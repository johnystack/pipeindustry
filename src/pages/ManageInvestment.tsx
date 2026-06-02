import { useLocation, useParams } from "react-router-dom";
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
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Gem, Coins, DollarSign, Wallet, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const ManageInvestment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { investment, withdrawableBalance } = location.state || {};
  const { user } = useAuth();
  const { toast } = useToast();
  const [reinvestAmount, setReinvestAmount] = useState("");

  const handleReinvest = async (reinvestAll = false) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to re-invest.",
        variant: "destructive",
      });
      return;
    }

    const amountToReinvest = reinvestAll ? ((investment.amount || 0) + (investment.return || 0)) : Number(reinvestAmount);

    if (!amountToReinvest) {
      toast({
        title: "Error",
        description: "Please enter an amount to re-invest.",
        variant: "destructive",
      });
      return;
    }

    if (amountToReinvest > ((investment.amount || 0) + (investment.return || 0))) {
      toast({
        title: "Error",
        description: "You cannot reinvest more than the capital and profit.",
        variant: "destructive",
      });
      return;
    }

    // Calculate how much should go to the user's balance
    const remainingCapitalAndProfit = ((investment.amount || 0) + (investment.return || 0)) - amountToReinvest;
    const totalToAddToWithdrawable = remainingCapitalAndProfit + (investment.bonus || 0);

    try {
      const { data, error } = await supabase.rpc('reinvest_investment', {
        p_user_id: user.id,
        p_old_investment_id: id,
        p_amount_to_reinvest: amountToReinvest,
        p_amount_to_balance: totalToAddToWithdrawable
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Re-investment successful",
          description: `You have successfully re-invested ₦${amountToReinvest.toLocaleString()}.`,
        });
        navigate("/dashboard");
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error re-investing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;

    const totalReturn = (investment.amount || 0) + (investment.return || 0) + (investment.bonus || 0);

    try {
      const { data, error } = await supabase.rpc('withdraw_investment_to_balance', {
        p_user_id: user.id,
        p_investment_id: id,
        p_total_return: totalReturn
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Withdrawal successful",
          description: `Your funds of ₦${totalReturn.toLocaleString()} have been added to your withdrawable balance.`,
        });
        navigate("/dashboard");
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error withdrawing funds",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!investment) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground mb-4">Investment not found.</p>
        <Link to="/dashboard">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCompleted = investment.status === 'completed';

  return (
    <div className="container mx-auto p-6 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-primary/10 via-background to-background p-8 rounded-3xl border-2 border-primary/10 shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">Manage Investment</h1>
          <p className="text-muted-foreground text-lg">
            Details for <span className="text-white font-bold">{investment.plan_name}</span>
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="h-12 px-6 rounded-xl border-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div 
        className={cn(
          "flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-8 rounded-[2rem] border bg-background/50 gap-10 transition-all hover:border-primary/30",
          isCompleted ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-primary/10"
        )}
      >
        <div className="space-y-8 flex-1">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "p-4 rounded-[1.5rem] bg-primary/10 border-2 border-primary/20"
                    )}>
                        <Gem className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl tracking-tight">{investment.plan_name}</h3>
                        <div className="flex gap-3 mt-2">
                            <Badge variant="secondary" className="text-xs uppercase font-black px-4 py-1">
                                {investment.status}
                            </Badge>
                            {isCompleted && (
                                <Badge className="bg-emerald-500 text-white text-xs font-black px-4 py-1">
                                    READY FOR ACTION
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase font-black text-muted-foreground tracking-widest">Invested Capital</p>
                    <p className="text-3xl font-black text-white">₦{investment.amount?.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-900/50 rounded-[1.5rem] border border-white/5 backdrop-blur-sm shadow-xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Expected Profit
                    </p>
                    <p className="text-3xl font-black text-primary">₦{investment.expected_profit?.toLocaleString() || 0}</p>
                </div>
                <div className="p-6 bg-slate-900/50 rounded-[1.5rem] border border-white/5 backdrop-blur-sm shadow-xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Coins className="h-4 w-4 text-emerald-500" />
                        Bonus Earned
                    </p>
                    <p className="text-3xl font-black text-emerald-500">₦{investment.bonus?.toLocaleString() || '0'}</p>
                </div>
                <div className="p-6 bg-slate-950 rounded-[1.5rem] border-2 border-white/5 shadow-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-white" />
                        Total Maturity Return
                    </p>
                    <p className="text-3xl font-black text-white">
                        ₦{(investment.amount + (investment.expected_profit || 0) + (investment.bonus || 0)).toLocaleString()}
                    </p>
                </div>
            </div>

            {isCompleted && (
                <div className="space-y-6 pt-8 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Post-Maturity Options</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-slate-900/50 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="reinvest-amount" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom Re-investment</Label>
                                <div className="relative">
                                    <Input
                                        id="reinvest-amount"
                                        type="number"
                                        placeholder="Enter amount to re-trade..."
                                        value={reinvestAmount}
                                        onChange={(e) => setReinvestAmount(e.target.value)}
                                        className="h-16 pl-10 rounded-2xl bg-background border-2 border-white/5 font-black text-lg"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black">₦</div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => handleReinvest(false)}
                                    className="h-14 rounded-xl font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                >
                                    Confirm Partial Re-trade
                                </Button>
                                <Button
                                    onClick={() => handleReinvest(true)}
                                    variant="outline"
                                    className="h-14 rounded-xl font-black uppercase tracking-widest border-2"
                                >
                                    Re-trade Capital + Profit
                                </Button>
                            </div>
                        </div>

                        <div className="p-8 bg-emerald-500/[0.03] rounded-[2rem] border-2 border-emerald-500/10 flex flex-col justify-between">
                            <div className="space-y-2">
                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Full Withdrawal</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Withdraw your entire capital, profit, and bonus directly to your main wallet balance.
                                </p>
                            </div>
                            <Button
                                onClick={handleWithdraw}
                                className="h-16 mt-8 rounded-2xl font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20"
                            >
                                <Wallet className="h-5 w-5 mr-2" />
                                Withdraw All to Balance
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ManageInvestment;
