import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface GiveBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onBonusAdded: () => void;
}

const GiveBonusModal = ({ isOpen, onClose, user, onBonusAdded }: GiveBonusModalProps) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGiveBonus = async () => {
    if (!user.has_invested) {
      toast({
        title: "Cannot Give Bonus",
        description: "This user has not made any investments yet.",
        variant: "destructive",
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
      user_id_input: user.id,
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
        description: `Successfully added a bonus of $${bonusAmount} to ${user.first_name || user.email}.`,
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
