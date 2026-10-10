import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Copy,
  CheckCircle,
  TrendingUp,
  Wallet,
  Upload,
  Image as ImageIcon,
  ArrowRight,
  RefreshCcw,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CircleDollarSign,
  Calendar,
  History,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Transaction, VendorPlan, Investment } from "@/lib/types";
import { cn } from "@/lib/utils";

const InvestNow = () => {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const { toast } = useToast();

  const [vendorPlans, setVendorPlans] = useState<VendorPlan[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [userInvestments, setUserInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeReferralsCount, setActiveReferralsCount] = useState<number>(0);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: planData } = await supabase
        .from("vendor_plans")
        .select(`*`)
        .eq("status", "active")
        .eq("eligibility_status", "approved")
        .order("created_at", { ascending: false });

      const mappedPlans = planData?.map((plan: any) => ({
        ...plan,
        vendor_name: "Terras"
      })) || [];
      setVendorPlans(mappedPlans);
      if (mappedPlans.length > 0 && !selectedPlanId) setSelectedPlanId(mappedPlans[0].id);

      // Fetch Investments
      const { data: investmentData } = await supabase
        .from("investments")
        .select(`*`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setUserInvestments(investmentData || []);

      // Fetch Recent Transactions
      const { data: transactionData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentTransactions(transactionData as any || []);

      // Fetch Active Referrals Count
      try {
        const { data: activeCount, error: countErr } = await supabase.rpc('get_active_referrals_count', { p_user_id: user.id });
        if (!countErr && activeCount !== null && activeCount !== undefined) {
          setActiveReferralsCount(Number(activeCount) || 0);
        } else {
          const { data: refUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('referred_by', user.id);
          if (refUsers && refUsers.length > 0) {
            const userIds = refUsers.map((u: any) => u.id);
            const { count } = await supabase
              .from('investments')
              .select('user_id', { count: 'exact', head: true })
              .in('status', ['active', 'completed'])
              .in('user_id', userIds);
            setActiveReferralsCount(count || 0);
          } else {
            setActiveReferralsCount(0);
          }
        }
      } catch (err) {
        console.error('Error fetching active referrals count in InvestNow:', err);
      }

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) {
      fetchData(); 
    }
  }, [user]);

  const handleInvest = async () => {
    if (!user || !selectedFile) {
      toast({ title: "Action Required", description: "Select a plan and upload proof.", variant: "destructive" });
      return;
    }
    const plan = vendorPlans.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    setSubmitting(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(filePath);

      const fixedAmount = plan.min_investment;
      const { error: investError } = await supabase.from("investments").insert([{
        user_id: user.id, plan_id: selectedPlanId, plan_name: plan.name,
        amount: fixedAmount, crypto: "NGN", status: "pending",
        expected_profit: fixedAmount * 0.5, daily_return: (fixedAmount * 0.5) / 24,
        duration: 24, payment_proof: publicUrl, payment_proof_uploaded_at: new Date().toISOString(),
        due_date: new Date(new Date().getTime() + 24 * 24 * 60 * 60 * 1000),
      }]);
      if (investError) throw investError;

      await supabase.from("transactions").insert([{
        user_id: user.id, type: "deposit", amount: fixedAmount, status: "pending",
        description: `Trade: ${plan.name}`, reference: `TRD-${Date.now()}`, crypto: "NGN",
      }]);

      toast({ title: "Success!", description: "Trade entry submitted for verification." });
      setSelectedFile(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (investmentId: string) => {
    setClaiming(investmentId);
    try {
      const { data, error } = await supabase.rpc('claim_investment_assets', { p_investment_id: investmentId });
      
      if (error) throw error;

      if (data.success) {
        toast({ title: "Claim Successful", description: data.message });
        await fetchData();
      } else {
        toast({ title: "Claim Failed", description: data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setClaiming(null);
    }
  };

  const calculateInvestmentStats = (inv: Investment) => {
    if (inv.status === 'pending' || !inv.approved_at) return {
      daysPassed: 0,
      progress: 0,
      totalValue: inv.amount,
      accumulated: 0,
      claimable: 0,
      nextClaimDays: 4,
      claimStage: 0,
      isRestricted: false,
      maxAllowedStages: activeReferralsCount > 0 ? 6 : 5,
      pendingStages: 0,
    };

    const start = new Date(inv.approved_at).getTime();
    const now = Date.now();
    const diff = now - start;
    const daysPassed = Math.min(24, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const progress = (daysPassed / 24) * 100;
    
    const totalExpectedReturn = inv.amount * 1.5;
    const accumulatedValue = (totalExpectedReturn * (daysPassed / 24));
    
    // Milestones at Day 4, 8, 12, 16, 20, 24 (6 stages total)
    const milestonesReached = Math.min(6, Math.floor(daysPassed / 4));
    const stagesActuallyClaimed = Math.round((inv.claimed_amount || 0) / (inv.amount * 0.25));

    // Referral restriction: users with 0 active referrals can only claim up to Stage 5 (100% capital + half of profit)
    const maxAllowedStages = activeReferralsCount > 0 ? 6 : 5;
    const availableMilestones = Math.min(milestonesReached, maxAllowedStages);
    const pendingStages = Math.max(0, availableMilestones - stagesActuallyClaimed);
    const claimable = pendingStages * (inv.amount * 0.25);

    const isRestricted = activeReferralsCount === 0 && stagesActuallyClaimed >= 5;

    const nextMilestoneDay = (stagesActuallyClaimed + 1) * 4;
    const nextClaimDays = nextMilestoneDay > 24 ? 0 : Math.max(0, nextMilestoneDay - daysPassed);

    return {
      daysPassed,
      progress,
      totalValue: totalExpectedReturn,
      accumulated: accumulatedValue,
      claimable,
      nextClaimDays: claimable > 0 ? 0 : nextClaimDays,
      claimStage: Math.min(6, stagesActuallyClaimed),
      isRestricted,
      maxAllowedStages,
      pendingStages,
    };
  };

  const selectedPlanData = vendorPlans.find((p) => p.id === selectedPlanId);

  if (loading && vendorPlans.length === 0) {
    return <div className="flex items-center justify-center h-[50vh]"><RefreshCcw className="h-8 w-8 animate-spin text-primary/40" /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      {/* ... previous content ... */}
      <div className="flex flex-col items-center text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic">Market Entry</h1>
        <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-60">Verified Commodity Paths</p>
      </div>

      <Tabs defaultValue="deposit" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 h-10 bg-slate-900/50 border border-white/5 p-1 rounded-lg mb-6">
          <TabsTrigger value="deposit" className="rounded-md font-black text-[10px] tracking-widest">ENTRY</TabsTrigger>
          <TabsTrigger value="my-investments" className="rounded-md font-black text-[10px] tracking-widest">PORTFOLIO</TabsTrigger>
          <TabsTrigger value="history" className="rounded-md font-black text-[10px] tracking-widest">LOGS</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-6 outline-none">
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <Card className="bg-slate-900/40 border border-white/10 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
                <CardHeader className="p-5 border-b border-white/5">
                  <CardTitle className="text-sm font-black flex items-center gap-2 tracking-widest uppercase">
                    <Zap className="h-4 w-4 text-primary" /> Start Trade
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger className="h-10 rounded-lg bg-slate-950/50 border border-white/10 text-xs font-bold">
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        {vendorPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id} className="text-xs font-bold">{plan.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Capital</p>
                        <p className="text-lg font-black text-primary">₦{selectedPlanData ? selectedPlanData.min_investment.toLocaleString() : "0"}</p>
                    </div>
                    <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        <p className="text-[8px] font-black uppercase text-emerald-600/70 mb-1">ROI</p>
                        <p className="text-lg font-black text-emerald-500">₦{selectedPlanData ? (selectedPlanData.min_investment * 0.5).toLocaleString() : "0"}</p>
                    </div>
                  </div>

                  {/* Settlement / Payment Option (Step 2 - Pay Before Uploading Receipt) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-emerald-400" /> Settlement & Payment Details
                      </Label>
                      {selectedPlanData && (
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          Step 2: Transfer ₦{selectedPlanData.min_investment.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {selectedPlanData ? (
                      <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/10">
                          <div>
                            <p className="text-[8px] font-black text-emerald-600/80 uppercase tracking-wider">Certified Agent</p>
                            <p className="font-black text-sm text-white">{selectedPlanData.vendor_name || "Terras"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-emerald-600/80 uppercase tracking-wider">Transfer Exactly</p>
                            <p className="font-black text-sm text-primary">₦{selectedPlanData.min_investment.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[8px] font-black text-emerald-600/80 uppercase tracking-wider">Payment Account / Address</p>
                            <span className="text-[8px] text-slate-400 font-bold">Tap icon to copy</span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/15 relative group">
                            <p className="whitespace-pre-wrap font-mono text-[11px] break-all leading-relaxed font-bold text-slate-200 select-all pr-8">
                              {selectedPlanData.payment_details}
                            </p>
                            <Button
                              size="icon"
                              variant="ghost"
                              type="button"
                              className="absolute top-1.5 right-1.5 h-7 w-7 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedPlanData.payment_details || "");
                                toast({ title: "Payment Details Copied!", description: "Paste into your banking app to transfer." });
                              }}
                              title="Copy Payment Details"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                          Please transfer the exact capital amount to the settlement account above. Once transferred, upload your payment receipt below to activate your position.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        Select a plan above to view settlement details
                      </div>
                    )}
                  </div>

                  {/* Payment Receipt Upload (Step 3 - Upload Proof After Payment) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5 text-primary" /> Payment Receipt Proof
                      </Label>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        Step 3: Attach Proof
                      </span>
                    </div>

                    <div
                      className={cn(
                        "p-6 border border-dashed rounded-xl bg-slate-950/30 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer hover:bg-slate-950/50",
                        selectedFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10"
                      )}
                      onClick={() => document.getElementById('proof-upload')?.click()}
                    >
                      <input
                        type="file"
                        id="proof-upload"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <CheckCircle className="h-6 w-6 text-emerald-400" />
                          <p className="text-[11px] font-bold text-emerald-300 truncate max-w-[220px]">{selectedFile.name}</p>
                          <span className="text-[8px] text-emerald-400/70 font-bold uppercase tracking-wider">Tap to change file</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground opacity-40" />
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">CLICK OR TAP TO UPLOAD RECEIPT</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase">PNG, JPG, PDF up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-xs font-black rounded-lg shadow-lg shadow-primary/20 uppercase tracking-widest"
                    onClick={handleInvest}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4 animate-spin" /> Verifying & Submitting...
                      </span>
                    ) : (
                      "CONFIRM & ACTIVATE POSITION"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Position Summary & Cycle Schedule */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <CardHeader className="p-5 pb-3 border-b border-white/5">
                  <CardTitle className="text-xs font-black flex items-center justify-between uppercase tracking-wider">
                    <span className="flex items-center gap-2 text-white">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" /> Trade Terms & Schedule
                    </span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[8px] font-black uppercase">
                      24-Day Cycle
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {selectedPlanData ? (
                    <>
                      <div className="p-3.5 bg-slate-950/60 rounded-xl border border-white/5 space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Plan Target</span>
                          <span className="font-black text-white">{selectedPlanData.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Total Expected Return</span>
                          <span className="font-black text-emerald-400">₦{(selectedPlanData.min_investment * 1.5).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">Net Profit (+50%)</span>
                          <span className="font-black text-primary">₦{(selectedPlanData.min_investment * 0.5).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Milestone Schedule Preview */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Claim Milestone Schedule (Every 4 Days)</p>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          {[
                            { stage: "Stage 1", day: "Day 4", pct: "25%" },
                            { stage: "Stage 2", day: "Day 8", pct: "50%" },
                            { stage: "Stage 3", day: "Day 12", pct: "75%" },
                            { stage: "Stage 4", day: "Day 16", pct: "100%" },
                            { stage: "Stage 5", day: "Day 20", pct: "125%" },
                            { stage: "Stage 6", day: "Day 24", pct: "150%" },
                          ].map((m, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-white/[0.02] border border-white/5 space-y-0.5">
                              <p className="text-[7px] font-bold text-slate-500 uppercase">{m.stage}</p>
                              <p className="text-[9px] font-black text-white">{m.day}</p>
                              <p className="text-[8px] font-bold text-emerald-400">{m.pct}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security Note */}
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-slate-300 leading-relaxed font-medium">
                          All positions are verified directly by certified Terras desk managers. Your trade begins counting down immediately upon admin confirmation.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 opacity-40 italic text-[10px] font-black uppercase tracking-widest">
                      Select a plan on the left to see trade terms
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="my-investments" className="outline-none space-y-6">
            {userInvestments.length === 0 ? (
                <div className="py-20 text-center space-y-4 opacity-20">
                    <TrendingUp className="h-12 w-12 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">No Active Positions Found</p>
                </div>
            ) : (
                userInvestments.map((inv) => {
                    const stats = calculateInvestmentStats(inv);
                    return (
                        <Card key={inv.id} className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                            
                            <CardHeader className="p-6 pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge 
                                                variant="outline" 
                                                className={cn(
                                                    "text-[7px] font-black uppercase px-1.5 py-0",
                                                    stats.isRestricted 
                                                        ? "border-amber-500/40 text-amber-400 bg-amber-500/10" 
                                                        : "border-primary/20 text-primary"
                                                )}
                                            >
                                                Stage {stats.claimStage}/6{stats.isRestricted ? " (Referral Required)" : ""}
                                            </Badge>
                                            <h3 className="text-lg font-black uppercase tracking-tighter italic">{inv.plan_name}</h3>
                                        </div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="h-2.5 w-2.5" /> Started: {new Date(inv.created_at || "").toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge className={cn(
                                        "font-black text-[9px] px-3 py-1 rounded-lg tracking-widest uppercase italic",
                                        inv.status === 'active' ? "bg-emerald-600" : 
                                        inv.status === 'pending' ? "bg-amber-600" : "bg-slate-600"
                                    )}>
                                        {inv.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            {/* ... card content rest ... */}

                            <CardContent className="p-6 pt-4 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                            <Wallet className="h-2.5 w-2.5" /> Entry Capital
                                        </p>
                                        <p className="text-sm font-black italic">₦{inv.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-emerald-600/70 uppercase flex items-center gap-1.5">
                                            <ArrowUpRight className="h-2.5 w-2.5" /> Expected Total
                                        </p>
                                        <p className="text-sm font-black text-emerald-500 italic">₦{(inv.amount * 1.5).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-purple-600/70 uppercase flex items-center gap-1.5">
                                            <ShieldCheck className="h-2.5 w-2.5" /> Claimed
                                        </p>
                                        <p className="text-sm font-black text-purple-500 italic">₦{(inv.claimed_amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[8px] font-black text-cyan-600/70 uppercase flex items-center gap-1.5">
                                            <TrendingUp className="h-2.5 w-2.5" /> Matured Value
                                        </p>
                                        <p className="text-sm font-black text-cyan-500 italic">₦{Math.floor(stats.accumulated).toLocaleString()}</p>
                                    </div>
                                </div>

                                {inv.status === 'active' && (
                                    <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Cycle Progress</p>
                                                <p className="text-[10px] font-black italic">{stats.daysPassed}/24 DAYS ELAPSED</p>
                                            </div>
                                            {stats.nextClaimDays > 0 && !stats.isRestricted && (
                                                <p className="text-[7px] font-black uppercase text-primary/50">Next Claim Window: {stats.nextClaimDays} Days</p>
                                            )}
                                            {stats.isRestricted && (
                                                <p className="text-[7px] font-black uppercase text-amber-500 italic">Stage 6 Locked</p>
                                            )}
                                        </div>
                                        <Progress value={stats.progress} className="h-1.5 bg-slate-950" />
                                    </div>
                                )}

                                {stats.isRestricted && (
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-1.5 text-amber-500 font-black text-[9px] uppercase tracking-wider">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span>Active Referral Required</span>
                                        </div>
                                        <p className="text-[8px] text-amber-400/90 leading-relaxed font-bold">
                                            You have claimed your capital and half of your profit (Stage 5/6). To unlock and withdraw the remaining 50% profit (Stage 6), an active referral with an approved investment is required.
                                        </p>
                                        <Link to="/referrals" className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-primary hover:underline pt-0.5">
                                            <span>Invite an Active Referral</span> &rarr;
                                        </Link>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    {inv.status === 'active' && (
                                        stats.isRestricted ? (
                                            <Button 
                                                disabled
                                                className="flex-1 h-12 font-black text-[9px] tracking-[0.1em] rounded-xl uppercase italic bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed"
                                            >
                                                <AlertCircle className="h-4 w-4 mr-2 text-amber-500 shrink-0" />
                                                Active Referral Required to Unlock Stage 6
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => handleClaim(inv.id)}
                                                disabled={stats.claimable <= 0 || !!claiming}
                                                className={cn(
                                                    "flex-1 h-12 font-black text-[10px] tracking-[0.2em] rounded-xl uppercase italic shadow-xl transition-all",
                                                    stats.claimable > 0 
                                                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20" 
                                                        : "bg-slate-800 opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                {claiming === inv.id ? (
                                                    <RefreshCcw className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CircleDollarSign className="h-4 w-4 mr-2" />
                                                        {stats.claimable > 0 
                                                            ? `CLAIM ₦${stats.claimable.toLocaleString()}${stats.pendingStages > 1 ? ` (${stats.pendingStages} Stages)` : ''}` 
                                                            : "NO ASSETS READY"}
                                                    </>
                                                )}
                                            </Button>
                                        )
                                    )}

                                    {inv.payment_proof && (
                                        <Button 
                                            variant="outline" 
                                            onClick={() => window.open(inv.payment_proof, '_blank')}
                                            className="h-12 px-6 border-white/10 rounded-xl font-black text-[9px] tracking-widest uppercase hover:bg-white/5"
                                        >
                                            VIEW RECEIPT
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </TabsContent>

        <TabsContent value="history" className="outline-none">
            <Card className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <CardHeader className="p-5 border-b border-white/5 bg-white/[0.02]">
                    <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest opacity-60">
                        <History className="h-3 w-3" /> Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {recentTransactions.length === 0 ? (
                        <div className="py-12 text-center opacity-20">
                            <Clock className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest">No Recent Activity</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {recentTransactions.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center border",
                                            tx.type === 'deposit' ? "bg-primary/10 border-primary/20 text-primary" :
                                            tx.type === 'withdrawal' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                            "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                        )}>
                                            {tx.type === 'deposit' ? <ArrowUpRight className="h-5 w-5" /> :
                                             tx.type === 'withdrawal' ? <ArrowDownRight className="h-5 w-5" /> :
                                             <CircleDollarSign className="h-5 w-5" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase tracking-tighter italic">
                                                {tx.description || tx.type.toUpperCase()}
                                            </p>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                                                {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'Recent'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-black italic">
                                            {tx.type === 'withdrawal' ? '-' : '+'}₦{tx.amount.toLocaleString()}
                                        </p>
                                        <Badge variant="outline" className={cn(
                                            "text-[7px] font-black uppercase px-1.5 py-0 border-white/10",
                                            tx.status === 'completed' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                                            tx.status === 'pending' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                            "text-red-500 border-red-500/20 bg-red-500/5"
                                        )}>
                                            {tx.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestNow;
