import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { User, Investment } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GiveBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onBonusAdded: () => void;
}

const GiveBonusModal = ({ isOpen, onClose, user, onBonusAdded }: GiveBonusModalProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvestments = async () => {
      if (user && isOpen) {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');
        if (error) {
          console.error('Error fetching investments:', error);
        } else {
          setInvestments(data || []);
        }
      }
    };
    fetchInvestments();
  }, [user, isOpen]);

  const handleGiveBonus = async () => {
    if (!selectedInvestment) {
      toast({
        title: 'Selection Required',
        description: 'Please select an active trade position.',
        variant: 'destructive',
      });
      return;
    }

    const bonusAmount = parseFloat(amount);
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a positive value.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
        const { error } = await supabase.rpc('add_bonus_to_investment', {
            investment_id_input: selectedInvestment,
            bonus_amount_input: bonusAmount,
        });

        if (error) throw error;

        toast({
            title: 'Bonus Distributed!',
            description: `Successfully credited ₦${bonusAmount} to the trade position.`,
        });
        onBonusAdded();
        onClose();
    } catch (error: any) {
        toast({
            title: 'Operation Failed',
            description: error.message || 'Could not process bonus allocation.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-white/5 rounded-[2rem] max-w-md p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Allocate Profit Bonus</DialogTitle>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inject additional capital into {user?.first_name || 'trader'}'s position.</p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Position</Label>
            <Select onValueChange={setSelectedInvestment} value={selectedInvestment || ''}>
              <SelectTrigger className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold">
                <SelectValue placeholder="Select active trade..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 rounded-xl">
                {investments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id} className="font-medium focus:bg-white/5">
                    {investment.plan_name} (₦{investment.amount.toLocaleString()})
                  </SelectItem>
                ))}
                {investments.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground font-bold italic">No active positions available.</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bonus Multiplier (₦)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-14 rounded-2xl bg-slate-950 border-white/5 font-bold text-lg"
            />
          </div>

          <Button 
            onClick={handleGiveBonus} 
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/80 text-primary-foreground font-black text-sm tracking-widest uppercase shadow-lg shadow-primary/20 gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Gift className="h-5 w-5" />}
            AUTHORIZE BONUS
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GiveBonusModal;
