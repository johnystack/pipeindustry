import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { User, Investment } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GiveBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
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
      if (user) {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id);
        if (error) {
          console.error('Error fetching investments:', error);
        } else {
          setInvestments(data);
        }
      }
    };
    fetchInvestments();
  }, [user]);

  const handleGiveBonus = async () => {
    if (!selectedInvestment) {
      toast({
        title: 'No Investment Selected',
        description: 'Please select an investment to add the bonus to.',
        variant: 'destructive',
      });
      return;
    }

    const bonusAmount = parseFloat(amount);
    if (isNaN(bonusAmount) || bonusAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number for the bonus.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.rpc('add_bonus', {
      investment_id_input: selectedInvestment,
      bonus_amount_input: bonusAmount,
    });
    setLoading(false);

    if (error) {
      toast({
        title: 'Error Giving Bonus',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bonus Added!',
        description: `Successfully added a bonus of $${bonusAmount} to the selected investment.`,
      });
      onBonusAdded();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give Bonus to {user?.first_name || user?.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="investment">Select Investment</Label>
            <Select onValueChange={setSelectedInvestment} value={selectedInvestment || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select an investment" />
              </SelectTrigger>
              <SelectContent>
                {investments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id}>
                    {investment.plan_name} - ${investment.amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonus-amount">Bonus Amount ($)</Label>
            <Input
              id="bonus-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGiveBonus} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Add Bonus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GiveBonusModal;
