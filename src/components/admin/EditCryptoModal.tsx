import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const EditCryptoModal = ({ crypto, isOpen, onClose, onSave }) => {
  const [address, setAddress] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (crypto) {
      setAddress(crypto.address);
    }
  }, [crypto]);

  const handleSave = async () => {
    if (!crypto) return;

    const { error } = await supabase
      .from("cryptocurrencies")
      .update({ address })
      .eq("id", crypto.id);

    if (error) {
      toast({
        title: "Error updating address",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Address updated successfully",
      });
      onSave({ ...crypto, address });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {crypto?.name} Address</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Wallet Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCryptoModal;