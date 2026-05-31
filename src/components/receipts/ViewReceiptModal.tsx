import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import WithdrawalReceipt from './WithdrawalReceipt';
import { Transaction, User } from '@/lib/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Share2, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ViewReceiptModalProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewReceiptModal = ({ transactionId, isOpen, onClose }: ViewReceiptModalProps) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (transactionId && isOpen) {
        setLoading(true);
        try {
          const { data: tx, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

          if (txError) throw txError;
          setTransaction(tx);

          const { data: prof, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', tx.user_id)
            .single();

          if (profError) throw profError;
          setUserData(prof);
        } catch (error: any) {
          console.error('Error fetching receipt data:', error);
          toast({ title: "Error", description: "Failed to load receipt.", variant: "destructive" });
          onClose();
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [transactionId, isOpen, toast, onClose]);

  const handleDownload = async () => {
    if (receiptRef.current && transaction) {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`withdrawal-${transaction.id.slice(0, 8)}.pdf`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[95vh] overflow-hidden bg-slate-950 border-white/10 p-0 rounded-[2rem] outline-none shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 gap-1.5 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all italic">
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload} className="h-7 px-3 rounded-lg border-white/10 text-[8px] font-black uppercase italic gap-1.5 hover:bg-white hover:text-black transition-all">
              <Download className="h-3 w-3" /> PDF
            </Button>
            <Button size="sm" onClick={onClose} className="h-7 w-7 p-0 rounded-full bg-white/5 hover:bg-white/10 border-white/10 transition-all">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6 flex justify-center bg-slate-900/20">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary opacity-20" />
              <p className="text-[8px] font-black uppercase tracking-[0.2em] animate-pulse italic opacity-40">Authenticating...</p>
            </div>
          ) : transaction && userData ? (
            <div ref={receiptRef} className="w-full">
              <WithdrawalReceipt transaction={transaction} user={userData} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Loader2 } from 'lucide-react';

export default ViewReceiptModal;
