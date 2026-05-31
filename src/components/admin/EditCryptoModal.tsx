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
import { Crypto as Cryptocurrency } from "@/lib/types";
import { Loader2, Save } from "lucide-react";

interface EditCryptoModalProps {
  crypto: Cryptocurrency | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Cryptocurrency) => void;
}

const EditCryptoModal = ({ crypto, isOpen, onClose, onSave }: EditCryptoModalProps) => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (crypto) {
      setAddress(crypto.address || "");
    }
  }, [crypto]);

  const handleSave = async () => {
    if (!crypto) return;

    setLoading(true);
    try {
        const { error } = await supabase
        .from("cryptocurrencies")
        .update({ address })
        .eq("id", crypto.id);

        if (error) throw error;

        toast({
            title: "Registry Updated",
            description: `${crypto.symbol} destination address has been modified.`,
        });
        onSave({ ...crypto, address });
        onClose();
    } catch (error: any) {
        toast({
            title: "Update Failed",
            description: error.message || "Could not update asset address.",
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
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Edit {crypto?.symbol} Protocol</DialogTitle>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Modify the receiving address for {crypto?.name} settlement.</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Settlement Address ({crypto?.network})</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter new wallet address..."
              className="h-14 rounded-2xl bg-slate-950 border-white/5 font-mono text-xs focus:border-cyan-500/50 transition-all"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm tracking-widest uppercase shadow-lg shadow-cyan-600/20 gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            UPDATE REGISTRY
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCryptoModal;
