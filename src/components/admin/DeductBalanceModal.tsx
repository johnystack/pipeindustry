import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Investment } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DeductBalanceModalProps {
  userId: string;
  onClose: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DeductBalanceModal({
  userId,
  onClose,
  isOpen,
  onOpenChange,
}: DeductBalanceModalProps) {
  const [amount, setAmount] = useState("");
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvestments = async () => {
      if (userId) {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', userId);
        if (error) {
          console.error('Error fetching investments:', error);
        } else {
          setInvestments(data);
        }
      }
    };
    fetchInvestments();
  }, [userId]);

  const handleDeductBonus = async () => {
    if (!selectedInvestment) {
      toast({
        title: "No Investment Selected",
        description: "Please select an investment to deduct the bonus from.",
        variant: "destructive",
      });
      return;
    }

    const deductAmount = parseFloat(amount);
    if (isNaN(deductAmount) || deductAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive number.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.rpc("deduct_bonus", {
        p_investment_id: selectedInvestment,
        p_amount: deductAmount,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Bonus Deducted",
        description: `Successfully deducted $${deductAmount} from the selected investment's bonus.`,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error Deducting Bonus",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deduct Bonus</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Select onValueChange={setSelectedInvestment} value={selectedInvestment || ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select an investment" />
            </SelectTrigger>
            <SelectContent>
              {investments.map((investment) => (
                <SelectItem key={investment.id} value={investment.id}>
                  {investment.plan_name} - ${investment.amount} (Bonus: ${investment.bonus})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to deduct"
            className="mt-4"
          />
          <Button onClick={handleDeductBonus} className="mt-4" variant="destructive">
            Deduct Bonus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}