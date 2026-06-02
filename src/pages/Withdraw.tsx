import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  ArrowLeft,
  ArrowDownToLine,
  Calendar,
  Building2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import ViewReceiptModal from "@/components/receipts/ViewReceiptModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Withdraw = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [withdrawalHistory, setWithdrawalHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [totalCommissionDue, setTotalCommissionDue] = useState(0);
  const [pendingInvestments, setPendingInvestments] = useState<any[]>([]);
  const [reinvestableInvestments, setReinvestableInvestments] = useState<any[]>([]);
  const [reinvesting, setReinvesting] = useState<string | null>(null);
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState(6.67);

  // Receipt Modal State
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const isWeekend = [0, 6].includes(new Date().getDay());

  const fetchData = async () => {
    if (user) {
      setLoading(true);
      
      // Fetch profile, settings, and pending commissions
      const [profileRes, settingsRes, investmentsRes, reinvestRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("withdrawable_balance, bank_name, account_number, account_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("settings")
          .select("withdrawal_fee_percent")
          .eq("id", 1)
          .single(),
        supabase
          .from("investments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .eq("commission_paid", false),
        supabase
          .from("investments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .eq("reinvested", false)
      ]);

      if (profileRes.error) {
        console.error("Error fetching balance:", profileRes.error);
      } else {
        setWithdrawableBalance(Math.max(0, profileRes.data?.withdrawable_balance || 0));
        setUserProfile(profileRes.data);
      }

      let feePercent = 6.67;
      if (settingsRes.error) {
        console.error("Error fetching settings:", settingsRes.error);
      } else if (settingsRes.data) {
        feePercent = Number(settingsRes.data.withdrawal_fee_percent);
        setWithdrawalFeePercent(feePercent);
      }

      if (investmentsRes.error) {
        console.error("Error fetching investments:", investmentsRes.error);
      } else {
        const completedUnpaid = investmentsRes.data || [];
        setPendingInvestments(completedUnpaid);
        
        // Calculate total commission due: 6.67% of the total 150% return (which is 10% of capital)
        const commission = completedUnpaid.reduce((sum, inv) => {
          const totalReturn = inv.amount * 1.5;
          return sum + (totalReturn * (feePercent / 100));
        }, 0);
        setTotalCommissionDue(commission);
      }

      if (!reinvestRes.error) {
        setReinvestableInvestments(reinvestRes.data || []);
      }

      setLoadingBalance(false);

      const { data: historyData, error: historyError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "withdrawal")
        .order("created_at", { ascending: false });

      if (historyError) {
        console.error("Error fetching withdrawal history:", historyError);
      } else {
        setWithdrawalHistory(historyData || []);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const feeAmount = totalCommissionDue;
  const netAmount = Math.max(0, Number(amount) - feeAmount);

  const handleReinvest = async (investmentId: string) => {
    setReinvesting(investmentId);
    try {
      const { data, error } = await supabase.rpc('reinvest_capital_from_balance', {
        p_user_id: user?.id,
        p_old_investment_id: investmentId
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Reinvestment Successful", description: data.message });
        await fetchData();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Reinvestment Failed", description: error.message, variant: "destructive" });
    } finally {
      setReinvesting(null);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }

    if (Number(amount) > withdrawableBalance) {
      toast({ title: "Insufficient Assets", description: "Amount exceeds your balance.", variant: "destructive" });
      return;
    }

    if (totalCommissionDue > 0 && Number(amount) <= totalCommissionDue) {
      toast({ 
        title: "Amount Too Low", 
        description: `Your withdrawal must be greater than the pending commission of ₦${totalCommissionDue.toLocaleString()}.`, 
        variant: "destructive" 
      });
      return;
    }

    if (!userProfile?.bank_name || !userProfile?.account_number) {
      toast({ title: "Missing Bank Details", description: "Please update your bank details in Settings.", variant: "destructive" });
      return;
    }

    try {
      const finalAddress = `BANK: ${userProfile.bank_name} | ACC: ${userProfile.account_number} | NAME: ${userProfile.account_name}`;
      const description = `Withdrawal to ${userProfile.bank_name} ${feeAmount > 0 ? `(Inc. One-time Commission: ₦${feeAmount.toLocaleString()})` : '(Commission-free)'}`;

      // ATOMIC RPC EXECUTION - SECURE & FAST
      const { data, error: rpcError } = await supabase.rpc('execute_withdrawal', {
        p_user_id: user.id,
        p_amount: Number(amount),
        p_fee: feeAmount,
        p_description: description,
        p_address: finalAddress,
        p_pending_investment_ids: pendingInvestments.map(i => i.id)
      });

      if (rpcError) throw rpcError;

      if (data.success) {
        toast({ title: "Withdrawal Requested", description: `₦${Number(amount).toLocaleString()} is being processed.` });
        
        // Instant UI feedback
        setWithdrawableBalance(prev => Math.max(0, prev - Number(amount)));
        setAmount("");
        setTotalCommissionDue(0);
        setPendingInvestments([]);
        
        // Refresh local history
        const { data: updatedHistory } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "withdrawal")
          .order("created_at", { ascending: false });
        
        setWithdrawalHistory(updatedHistory || []);
      } else {
        // This catches the 'Insufficient assets' message from SQL
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
    };
    const label = status === 'rejected' ? 'REJECTED' : (status === 'approved' ? 'APPROVED' : status.toUpperCase());
    return <Badge className={cn("font-black text-[8px] uppercase tracking-widest px-2 py-0.5 border", variants[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20")}>{label}</Badge>;
  };

  if (loading) {
    return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="withdraw" className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Withdraw</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Request bank settlement for your matured assets</p>
        </div>
        <TabsList className="bg-slate-900/50 border border-white/10 p-1 rounded-xl w-full md:w-auto">
          <TabsTrigger value="withdraw" className="flex-1 md:flex-none gap-2 px-6 rounded-lg font-black uppercase text-[10px] data-[state=active]:bg-primary italic transition-all">
            <Zap className="h-3.5 w-3.5" /> New Request
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 md:flex-none gap-2 px-6 rounded-lg font-black uppercase text-[10px] data-[state=active]:bg-slate-700 italic transition-all">
            <Clock className="h-3.5 w-3.5" /> History
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="space-y-8">
        {reinvestableInvestments.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <Card className="bg-slate-900/30 border-primary/20 shadow-2xl rounded-3xl overflow-hidden border-2">
              <CardHeader className="p-6 md:p-8 border-b border-white/5 bg-primary/10">
                <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                  <RefreshCcw className="h-6 w-6 text-primary animate-spin-slow" /> Perfect Reinvestment
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                  Keep your capital working. Reinvest instantly from your internal balance.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reinvestableInvestments.map((inv) => (
                    <div key={inv.id} className="group relative bg-slate-950/50 rounded-2xl border border-white/5 p-6 space-y-4 hover:border-primary/50 transition-all overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="h-12 w-12 text-primary" />
                      </div>
                      <div className="space-y-1 relative">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{inv.plan_name}</p>
                        <p className="text-2xl font-black italic tracking-tighter text-white">₦{inv.amount.toLocaleString()}</p>
                      </div>
                      <div className="pt-2">
                        <Button 
                          onClick={() => handleReinvest(inv.id)}
                          disabled={withdrawableBalance < inv.amount || !!reinvesting}
                          className={cn(
                            "w-full h-12 font-black text-[10px] tracking-[0.2em] uppercase italic rounded-xl transition-all shadow-lg",
                            withdrawableBalance >= inv.amount 
                              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20" 
                              : "bg-slate-800 text-muted-foreground opacity-50 cursor-not-allowed border border-white/5"
                          )}
                        >
                          {reinvesting === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            withdrawableBalance >= inv.amount ? "Reinvest Capital" : "Insufficient Balance"
                          )}
                        </Button>
                      </div>
                      {withdrawableBalance < inv.amount && (
                        <p className="text-[8px] font-black text-amber-500/80 uppercase text-center italic animate-pulse">
                          Need ₦{(inv.amount - withdrawableBalance).toLocaleString()} more
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <TabsContent value="withdraw" className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-4 space-y-6 order-first lg:order-last">
            <Card className="bg-slate-900/30 border-white/10 shadow-2xl rounded-3xl overflow-hidden group">
              <CardHeader className="p-6 border-b border-white/5 bg-emerald-500/5">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-500/80 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" /> Withdrawable Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-tighter">Available Funds</p>
                  <div className="text-4xl font-black text-white tracking-tighter italic">
                    ₦{withdrawableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-emerald-500/20 transition-colors">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <p className="text-[9px] font-black uppercase text-muted-foreground italic">Verified for Withdrawal</p>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-amber-500/20 transition-colors">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <p className="text-[9px] font-black uppercase text-muted-foreground italic">24-48h Processing</p>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <Card className="bg-slate-900/30 border-white/10 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="p-6 md:p-8 border-b border-white/5 bg-primary/5">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic">
                  <Building2 className="h-5 w-5 text-primary" /> Withdrawal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-8">
                {isWeekend && (
                  <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-red-500 italic tracking-widest">Withdrawals Closed</p>
                      <p className="text-[9px] font-bold text-red-500/60 uppercase leading-relaxed">Liquidation requests are only processed on business days (Monday - Friday). Please return on Monday to withdraw your funds.</p>
                    </div>
                  </div>
                )}
                {withdrawableBalance <= 0 ? (
                  <div className="py-12 text-center space-y-6">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                        <AlertCircle className="h-8 w-8 text-muted-foreground opacity-20" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-black uppercase italic">Zero Balance</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-xs mx-auto">You have no funds available for withdrawal at this time.</p>
                    </div>
                    <Link to="/invest-now">
                        <Button variant="outline" className="h-11 rounded-xl border-2 px-8 font-black uppercase text-[10px] hover:bg-primary transition-all">Start Trading</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Method</Label>
                            <div className="p-5 bg-slate-950/50 rounded-2xl border-2 border-white/5 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-black uppercase text-[11px] italic">Direct Bank</p>
                                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">Verified Transfer</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Amount to Withdraw</Label>
                            <div className="relative group">
                                <Input 
                                    placeholder="0.00" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-14 pl-10 rounded-2xl bg-slate-950 border-white/10 font-black text-xl italic focus:border-primary transition-all pr-24 text-white uppercase"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">₦</div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-3 rounded-xl font-black text-[9px] uppercase text-primary hover:bg-primary/10 italic"
                                    onClick={() => setAmount(withdrawableBalance.toString())}
                                >
                                    MAX
                                </Button>
                            </div>
                            {Number(amount) > 0 && (
                                <div className="px-1 space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>Withdrawal Fee</span>
                                        <span className={cn("text-destructive", feeAmount === 0 && "text-emerald-500 font-black")}>
                                          {feeAmount === 0 ? "FREE" : `-₦${feeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                        <span>Net Payout</span>
                                        <span>₦{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {feeAmount > 0 && (
                                      <p className="text-[7px] font-black text-amber-500 uppercase tracking-tighter italic">
                                        * Includes one-time commission for {pendingInvestments.length} completed trade(s)
                                      </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/10 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 italic flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5" /> Destination Bank
                            </h4>
                            <Link to="/settings">
                                <Button variant="link" size="sm" className="h-auto p-0 text-[9px] font-black uppercase text-muted-foreground hover:text-white italic">Edit</Button>
                            </Link>
                        </div>
                        
                        {userProfile?.bank_name ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase text-muted-foreground/40">Bank</p>
                                    <p className="text-[11px] font-black text-white uppercase italic truncate">{userProfile.bank_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase text-muted-foreground/40">Account No.</p>
                                    <p className="text-[11px] font-black text-white italic font-mono truncate">{userProfile.account_number}</p>
                                </div>
                                <div className="col-span-2 md:col-span-1 space-y-1">
                                    <p className="text-[8px] font-black uppercase text-muted-foreground/40">Account Name</p>
                                    <p className="text-[11px] font-black text-white uppercase italic truncate">{userProfile.account_name}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 text-center">
                                <Link to="/settings">
                                    <Button variant="outline" size="sm" className="h-10 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">Setup Bank Info</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                disabled={!userProfile?.bank_name || !amount || isWeekend}
                                className="w-full h-16 text-lg font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98] italic text-primary-foreground"
                            >
                                {isWeekend ? "Market Closed" : "Withdraw Funds"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] bg-slate-900 border-2 border-white/5 w-[95%] max-w-sm text-white">
                            <div className="p-4 text-center space-y-6">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black uppercase italic">Confirm Withdrawal</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">
                                      {feeAmount > 0 ? (
                                        <>You will receive <span className="text-white text-base">₦{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> after <span className="text-destructive">₦{feeAmount.toLocaleString()} commission</span>.</>
                                      ) : (
                                        <>You will receive <span className="text-white text-base">₦{Number(amount).toLocaleString()}</span>. This withdrawal is <span className="text-emerald-500 font-black">commission-free</span>.</>
                                      )}
                                    </p>
                                    <p className="text-[8px] text-muted-foreground uppercase mt-2">
                                      Total balance deduction: ₦{Number(amount).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <AlertDialogCancel className="h-12 rounded-xl border-2 font-black uppercase text-[10px] flex-1 italic border-white/10 text-white">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleWithdraw} className="h-12 rounded-xl bg-primary font-black uppercase text-[10px] flex-1 italic text-primary-foreground">Confirm</AlertDialogAction>
                                </div>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-slate-900/30 border-white/10 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5">
                    <CardTitle className="text-lg font-black flex items-center gap-3 uppercase italic">
                        <Clock className="h-5 w-5 text-primary" /> Withdrawal History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {withdrawalHistory.map((w) => (
                            <div key={w.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 hover:bg-white/[0.02] transition-all gap-6">
                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                    <div className="h-12 w-12 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5 shrink-0">
                                        <Building2 className="h-5 w-5 text-muted-foreground opacity-40" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <p className="font-black text-lg text-white leading-tight italic truncate">₦{w.amount.toLocaleString()}</p>
                                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(w.created_at || "").toLocaleDateString()}</span>
                                            <span className="opacity-20">|</span>
                                            <span className="text-emerald-500">BANK TRANSFER</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-6 md:w-80">
                                    <div className="flex flex-col items-end gap-2">
                                        {getStatusBadge(w.status)}
                                        <p className="text-[8px] font-mono text-muted-foreground uppercase opacity-30 truncate max-w-[120px]">ID: {w.id.slice(0, 8)}</p>
                                    </div>
                                    {(w.status === 'pending' || w.status === 'approved' || w.status === 'completed') && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => { setReceiptId(w.id); setIsReceiptOpen(true); }}
                                            className="h-9 px-4 rounded-lg font-black text-[9px] uppercase border-2 italic hover:bg-white hover:text-black transition-all"
                                        >
                                            View Receipt
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {withdrawalHistory.length === 0 && (
                            <div className="text-center py-32 space-y-4 opacity-20">
                                <Clock className="h-10 w-10 mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No withdrawal history discovered</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </div>

      <ViewReceiptModal 
        transactionId={receiptId} 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
      />
    </Tabs>
  );
};

export default Withdraw;
