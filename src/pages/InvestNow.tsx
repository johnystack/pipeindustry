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
} from "lucide-react";

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

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: planData } = await supabase
        .from("vendor_plans")
        .select(`*, profiles(username, first_name, last_name)`)
        .eq("status", "active")
        .eq("eligibility_status", "approved")
        .order("created_at", { ascending: false });

      const mappedPlans = planData?.map((plan: any) => ({
        ...plan,
        vendor_name: plan.profiles?.username || `${plan.profiles?.first_name} ${plan.profiles?.last_name}`.trim() || "Vendor"
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
      claimStage: 0
    };

    const start = new Date(inv.approved_at).getTime();
    const now = Date.now();
    const diff = now - start;
    const daysPassed = Math.min(24, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const progress = (daysPassed / 24) * 100;
    
    const totalExpectedReturn = inv.amount * 1.5;
    const accumulatedValue = (totalExpectedReturn * (daysPassed / 24));
    
    const claimBlocksAvailable = Math.floor(daysPassed / 4);
    const totalPossibleClaimed = claimBlocksAvailable * (inv.amount * 0.25);
    const currentClaimed = inv.claimed_amount || 0;
    const claimable = Math.max(0, totalPossibleClaimed - currentClaimed);
    
    const nextClaimDays = 4 - (daysPassed % 4);

    // Each block claimed is 1/6 of the cycle
    const claimStage = Math.round(currentClaimed / (inv.amount * 0.25));

    return {
      daysPassed,
      progress,
      totalValue: totalExpectedReturn,
      accumulated: accumulatedValue,
      claimable,
      nextClaimDays: daysPassed >= 24 ? 0 : nextClaimDays,
      claimStage: Math.min(6, claimStage)
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

                  <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Payment Receipt</Label>
                    <div className={cn(
                        "p-6 border border-dashed rounded-xl bg-slate-950/30 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer hover:bg-slate-950/50",
                        selectedFile ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/10"
                    )} onClick={() => document.getElementById('proof-upload')?.click()}>
                        <input type="file" id="proof-upload" className="hidden" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-1">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <p className="text-[10px] font-bold truncate max-w-[150px]">{selectedFile.name}</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="h-5 w-5 text-muted-foreground opacity-30" />
                                <p className="text-[10px] font-bold uppercase tracking-tighter">SELECT FILE</p>
                            </>
                        )}
                    </div>
                  </div>

                  <Button className="w-full h-12 text-xs font-black rounded-lg shadow-lg shadow-primary/20" onClick={handleInvest} disabled={submitting}>
                    {submitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : "CONFIRM POSITION"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5">
              <Card className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-[10px] font-black flex items-center gap-2 uppercase tracking-widest opacity-50">
                      <Wallet className="h-3 w-3" /> Settlement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
                  {selectedPlanData ? (
                    <>
                      <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-3">
                          <div className="space-y-1">
                              <p className="text-[8px] font-black text-emerald-600/70 uppercase">Certified Vendor</p>
                              <p className="font-black text-base">{selectedPlanData.vendor_name}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[8px] font-black text-emerald-600/70 uppercase">Detail</p>
                              <div className="bg-slate-950 p-3 rounded-lg border border-emerald-500/10 relative group">
                                  <p className="whitespace-pre-wrap font-mono text-[10px] break-all leading-relaxed font-bold">
                                      {selectedPlanData.payment_details}
                                  </p>
                                  <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-6 w-6 hover:bg-emerald-500/10" onClick={() => { navigator.clipboard.writeText(selectedPlanData.payment_details || ""); toast({ title: "Copied" }); }}>
                                      <Copy className="h-3 w-3 text-emerald-600" />
                                  </Button>
                              </div>
                          </div>
                      </div>
                      <div className="p-3 bg-slate-950/50 rounded-lg border border-white/5 text-center">
                        <span className="text-sm font-black text-primary tracking-tight">₦{selectedPlanData.min_investment.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 opacity-30 italic text-[10px] font-black uppercase tracking-widest">Select Plan</div>
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
                                            <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary px-1.5 py-0">Stage {stats.claimStage}/6</Badge>
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
                                            {stats.nextClaimDays > 0 && (
                                                <p className="text-[7px] font-black uppercase text-primary/50">Next Claim Window: {stats.nextClaimDays} Days</p>
                                            )}
                                        </div>
                                        <Progress value={stats.progress} className="h-1.5 bg-slate-950" />
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
                                                {stats.claimable > 0 ? `CLAIM ₦${stats.claimable.toLocaleString()}` : "NO ASSETS READY"}
                                            </>
                                        )}
                                    </Button>

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
