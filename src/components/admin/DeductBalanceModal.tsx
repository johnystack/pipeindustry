import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

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
  const { toast } = useToast();

  const handleDeductBalance = async () => {
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
      const { error } = await supabase.rpc("deduct_balance", {
        p_user_id: userId,
        p_amount: deductAmount,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Balance Deducted",
        description: `Successfully deducted $${deductAmount} from the user's balance.`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error Deducting Balance",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deduct Balance</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to deduct"
          />
          <Button onClick={handleDeductBalance} className="mt-4" variant="destructive">
            Deduct Balance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}