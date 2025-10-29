import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import WithdrawalReceipt from '@/components/receipts/WithdrawalReceipt';
import { Transaction, User } from '@/lib/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Receipt = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTransaction = async () => {
      if (transactionId) {
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .single();

        if (transactionError) {
          console.error('Error fetching transaction:', transactionError);
          toast({ title: "Error", description: "Could not fetch transaction details.", variant: "destructive" });
        } else {
          setTransaction(transactionData);
          console.log("Fetched Transaction Data:", transactionData);

          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', transactionData.user_id)
            .single();

          if (userError) {
            console.error('Error fetching user:', userError);
            toast({ title: "Error", description: "Could not fetch user details.", variant: "destructive" });
          } else {
            setUser(userData);
            console.log("Fetched User Data:", userData);
          }
        }
      }
      setLoading(false);
    };

    fetchTransaction();
  }, [transactionId, toast]);

  const handleDownloadReceipt = async () => {
    if (receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`withdrawal-receipt-${transaction?.id}.pdf`);
      toast({ title: "Success", description: "Receipt downloaded successfully." });
    } else {
      toast({ title: "Error", description: "Could not generate receipt for download.", variant: "destructive" });
    }
  };

  const handleShareReceipt = async () => {
    if (receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `withdrawal-receipt-${transaction?.id}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Withdrawal Receipt',
                text: 'Here is your withdrawal receipt.',
              });
              toast({ title: "Success", description: "Receipt shared successfully." });
            } catch (error) {
              console.error('Error sharing receipt:', error);
              toast({ title: "Error", description: "Failed to share receipt.", variant: "destructive" });
            }
          } else {
            toast({ title: "Info", description: "Web Share API not supported in this browser or for these files.", variant: "info" });
          }
        } else {
          toast({ title: "Error", description: "Could not generate receipt for sharing.", variant: "destructive" });
        }
      });
    } else {
      toast({ title: "Error", description: "Could not generate receipt for sharing.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading receipt...</div>;
  }

  if (!transaction || !user) {
    return <div className="flex justify-center items-center h-screen text-lg text-destructive">Receipt not found or data is incomplete.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Withdrawal Receipt</h1>
        <div className="flex gap-2">
          <Button onClick={handleDownloadReceipt}><Download className="mr-2 h-4 w-4" /> Download</Button>
          <Button onClick={handleShareReceipt}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
        </div>
      </div>
      <div ref={receiptRef} className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <WithdrawalReceipt transaction={transaction} user={user} />
      </div>
    </div>
  );
};

export default Receipt;
