import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { VendorPaymentWallet } from "@/lib/types";
import { Loader2, Save } from "lucide-react";

interface EditVendorWalletModalProps {
  wallet: VendorPaymentWallet | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const EditVendorWalletModal = ({ wallet, isOpen, onClose, onUpdated }: EditVendorWalletModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    address: "",
    network: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (wallet) {
      setFormData({
        name: wallet.name || "",
        symbol: wallet.symbol || "",
        address: wallet.address || "",
        network: wallet.network || "",
      });
    }
  }, [wallet]);

  const handleSave = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
        const { error } = await supabase
        .from("vendor_payment_wallets")
        .update(formData)
        .eq("id", wallet.id);

        if (error) throw error;

        toast({
            title: "Wallet Updated",
            description: `${wallet.symbol} registry has been modified.`,
        });
        onUpdated();
        onClose();
    } catch (error: any) {
        toast({
            title: "Update Failed",
            description: error.message || "Could not update wallet.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-white/5 rounded-[2rem] max-w-md p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Edit {wallet?.symbol} Protocol</DialogTitle>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Modify the receiving address for vendor settlement.</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 rounded-xl bg-slate-950 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Symbol</Label>
            <Input
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="h-12 rounded-xl bg-slate-950 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network</Label>
            <Input
              value={formData.network}
              onChange={(e) => setFormData({ ...formData, network: e.target.value })}
              className="h-12 rounded-xl bg-slate-950 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-12 rounded-xl bg-slate-950 border-white/5 font-mono text-xs"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/80 text-white font-black text-sm tracking-widest uppercase gap-2 mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            UPDATE REGISTRY
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditVendorWalletModal;
