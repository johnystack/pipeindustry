import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { Investment } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvestments = async () => {
      if (userId && isOpen) {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active');
        if (error) {
          console.error('Error fetching investments:', error);
        } else {
          setInvestments(data || []);
        }
      }
    };
    fetchInvestments();
  }, [userId, isOpen]);

  const handleDeductBonus = async () => {
    if (!selectedInvestment) {
      toast({
        title: "No Investment Selected",
        description: "Please select an active investment.",
        variant: "destructive",
      });
      return;
    }

    const deductAmount = parseFloat(amount);
    if (isNaN(deductAmount) || deductAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive value.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find current bonus to check limits
      const inv = investments.find(i => i.id === selectedInvestment);
      if (inv && (inv.bonus || 0) < deductAmount) {
         toast({
            title: "Insufficient Bonus",
            description: `Current bonus is only ₦${inv.bonus || 0}.`,
            variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.rpc("deduct_balance", {
        p_investment_id: selectedInvestment,
        p_amount: deductAmount,
      });

      if (error) throw error;

      toast({
        title: "Capital Deducted",
        description: `Successfully removed ₦${deductAmount} from the selected position.`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Deduction Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-2 border-white/5 rounded-[2rem] max-w-md p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Deduct Position Balance</DialogTitle>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subtract funds from an active trade position.</p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Active Position</label>
            <Select onValueChange={setSelectedInvestment} value={selectedInvestment || ''}>
              <SelectTrigger className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold">
                <SelectValue placeholder="Choose a position..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 rounded-xl">
                {investments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id} className="font-medium focus:bg-white/5">
                    {investment.plan_name} (₦{investment.amount.toLocaleString()})
                  </SelectItem>
                ))}
                {investments.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground font-bold italic">No active positions found.</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount to Remove (₦)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold text-lg"
            />
          </div>

          <Button 
            onClick={handleDeductBonus} 
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-destructive hover:bg-destructive/80 font-black text-sm tracking-widest uppercase shadow-lg shadow-destructive/20 gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            CONFIRM DEDUCTION
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}