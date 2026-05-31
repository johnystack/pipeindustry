import { useState } from "react";
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
import { Loader2, Plus } from "lucide-react";

interface CreateVendorWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateVendorWalletModal = ({ isOpen, onClose, onCreated }: CreateVendorWalletModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    address: "",
    network: "",
  });
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.name || !formData.symbol || !formData.address) {
        toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase
        .from("vendor_payment_wallets")
        .insert([formData]);

        if (error) throw error;

        toast({
            title: "Wallet Created",
            description: `${formData.name} has been added to the registry.`,
        });
        onCreated();
        onClose();
        setFormData({ name: "", symbol: "", address: "", network: "" });
    } catch (error: any) {
        toast({
            title: "Creation Failed",
            description: error.message || "Could not create wallet.",
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
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Create Vendor Wallet</DialogTitle>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Add a new company wallet for vendor commitment fees.</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Name (e.g. Bitcoin)</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Bitcoin"
              className="h-12 rounded-xl bg-slate-950 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Symbol (e.g. BTC)</Label>
            <Input
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="BTC"
              className="h-12 rounded-xl bg-slate-950 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network (e.g. Bitcoin, ERC20)</Label>
            <Input
              value={formData.network}
              onChange={(e) => setFormData({ ...formData, network: e.target.value })}
              placeholder="Bitcoin"
              className="h-12 rounded-xl bg-slate-950 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter wallet address..."
              className="h-12 rounded-xl bg-slate-950 border-white/5 font-mono text-xs"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/80 text-white font-black text-sm tracking-widest uppercase gap-2 mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            CREATE WALLET
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVendorWalletModal;
