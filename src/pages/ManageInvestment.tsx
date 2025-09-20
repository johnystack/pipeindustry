import { useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

import { useNavigate } from "react-router-dom";

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

    const totalReturn = investment.amount + investment.return;
    const amountToReinvest = reinvestAll ? totalReturn : Number(reinvestAmount);

    if (!amountToReinvest) {
      toast({
        title: "Error",
        description: "Please enter an amount to re-invest.",
        variant: "destructive",
      });
      return;
    }

    if (amountToReinvest > totalReturn) {
      toast({
        title: "Error",
        description: "You cannot reinvest more than the total return.",
        variant: "destructive",
      });
      return;
    }

    // Create new investment
    const { error: insertError } = await supabase
      .from("investments")
      .insert([
        {
          user_id: user.id,
          plan_name: investment.plan_name,
          amount: amountToReinvest,
          crypto: investment.crypto,
          status: "pending",
          reinvested: true,
        },
      ]);

    if (insertError) {
      toast({
        title: "Error re-investing",
        description: insertError.message,
        variant: "destructive",
      });
    } else {
      // Update old investment
      const { error: updateError } = await supabase
        .from("investments")
        .update({ status: "completed", reinvested: true })
        .eq("id", id);

      if (updateError) {
        toast({
          title: "Error updating investment",
          description: updateError.message,
          variant: "destructive",
        });
      } else {
        // Update withdrawable balance if partial reinvestment
        if (!reinvestAll) {
          const remainingBalance = totalReturn - amountToReinvest;
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ withdrawable_balance: withdrawableBalance + remainingBalance })
            .eq("user_id", user.id);

          if (profileError) {
            toast({
              title: "Error updating withdrawable balance",
              description: profileError.message,
              variant: "destructive",
            });
          }
        }
        toast({
          title: "Re-invested successfully",
          description: `You have successfully reinvested ${amountToReinvest.toLocaleString()}. The remaining ${remainingBalance.toLocaleString()} has been added to your withdrawable balance. Your new withdrawable balance is ${(withdrawableBalance + remainingBalance).toLocaleString()}.`,
        });
        navigate("/dashboard");
      }
    }
  };

  const handleWithdraw = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to withdraw.",
        variant: "destructive",
      });
      return;
    }

    const totalReturn = investment.amount + investment.return;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ withdrawable_balance: withdrawableBalance + totalReturn })
      .eq("id", user.id);

    if (profileError) {
      toast({
        title: "Error updating withdrawable balance",
        description: profileError.message,
        variant: "destructive",
      });
    } else {
      // Update the investment status to 'withdrawn'
      const { error: updateError } = await supabase
        .from("investments")
        .update({ status: "withdrawn" })
        .eq("id", id);

      if (updateError) {
        toast({
          title: "Error updating investment",
          description: updateError.message,
          variant: "destructive",
        });
      } else {
        const { error: transactionError } = await supabase.from("transactions").insert([
          {
            user_id: user.id,
            type: "withdrawal",
            amount: totalReturn,
            status: "completed",
            description: "Investment return to withdrawable balance",
            withdrawal_type: "to_balance",
          },
        ]);

        if (transactionError) {
          console.error("Error creating transaction:", transactionError);
        }

        toast({
          title: "Withdrawal successful",
          description: `The total return of ${totalReturn.toLocaleString()} has been added to your withdrawable balance. Your new withdrawable balance is ${(withdrawableBalance + totalReturn).toLocaleString()}.`,
        });
        navigate("/withdraw", { state: { withdrawableBalance: withdrawableBalance + totalReturn } });
      }
    }
  };

  if (!investment) {
    return <div>Investment not found</div>;
  }

  const isDue = new Date(investment.end_date) < new Date();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Manage Investment
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your investment, re-invest or withdraw your earnings.
        </p>
      </div>
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle>{investment.plan_name}</CardTitle>
          <CardDescription>Investment Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Capital:</span>
            <span>${investment.amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Expected Profit:</span>
            <span className="text-green-500">${investment.expected_profit?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total Return:</span>
            <span>${(investment.amount + investment.expected_profit)?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${investment.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
              {investment.status}
            </span>
          </div>
          {investment.status === 'completed' && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-2">What would you like to do?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reinvest-amount">Re-invest Amount</Label>
                  <Input id="reinvest-amount" type="number" placeholder="Enter amount" value={reinvestAmount} onChange={(e) => setReinvestAmount(e.target.value)} />
                  <Button onClick={() => handleReinvest(false)} className="w-full mt-2">Re-invest</Button>
                </div>
                <div className="flex flex-col space-y-2">
                  <Button onClick={() => handleReinvest(true)} className="w-full">Re-invest All</Button>
                  <Button onClick={handleWithdraw} variant="destructive" className="w-full">Withdraw All to Balance</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageInvestment;