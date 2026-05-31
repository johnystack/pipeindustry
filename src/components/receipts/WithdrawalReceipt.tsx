import { Transaction, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Landmark, ShieldCheck, CheckCircle2, Clock, Ban } from 'lucide-react';

interface WithdrawalReceiptProps {
  transaction: Transaction;
  user: User;
}

const WithdrawalReceipt = ({ transaction, user }: WithdrawalReceiptProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'pending':
        return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'rejected':
      case 'failed':
        return 'text-rose-700 bg-rose-50 border-rose-100';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle2 className="h-2 w-2" />;
      case 'pending':
        return <Clock className="h-2 w-2" />;
      case 'rejected':
      case 'failed':
        return <Ban className="h-2 w-2" />;
      default:
        return null;
    }
  };

  const fee = Number(transaction.fee || 0);
  const netAmount = transaction.amount - fee;

  return (
    <div className="p-4 md:p-6 bg-[#FCFBF7] rounded-[1.5rem] shadow-xl text-[#3E2723] border border-[#EFEBE9] max-w-sm mx-auto relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2691E]/5 rounded-full blur-2xl -mr-16 -mt-16" />
      
      {/* Header / Logo Section */}
      <div className="relative z-10 text-center mb-4">
        <div className="flex flex-col items-center gap-1.5 mb-3">
          <div className="h-10 w-10 bg-[#3E2723] rounded-lg flex items-center justify-center shadow shadow-[#3E2723]/20 rotate-3">
            <Landmark className="h-5 w-5 text-[#D2691E]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic text-[#3E2723]">
              Terras<span className="text-[#D2691E]">Investment</span>
            </h1>
            <p className="text-[6px] font-black uppercase tracking-[0.4em] text-[#8D6E63] opacity-60">Asset Management</p>
          </div>
        </div>
        
        <div className="h-px w-full bg-[#EFEBE9] mb-4" />
        
        <div className="space-y-0.5">
          <h2 className="text-[7px] font-black uppercase tracking-widest text-[#8D6E63]">Transaction Voucher</h2>
          <p className="text-[7px] font-mono text-[#8D6E63] opacity-40">ID: {transaction.id.slice(0, 12)}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
                <div>
                    <p className="text-[7px] font-black uppercase tracking-widest text-[#D2691E] mb-0.5">Beneficiary</p>
                    <p className="font-black text-xs italic uppercase text-[#3E2723] leading-tight truncate">{user.first_name} {user.last_name}</p>
                    <p className="text-[8px] font-bold text-[#8D6E63] truncate opacity-60">{user.email}</p>
                </div>

                <div>
                    <p className="text-[7px] font-black uppercase tracking-widest text-[#D2691E] mb-0.5">Channel</p>
                    <p className="font-black text-[9px] uppercase italic text-[#3E2723]">
                        {transaction.withdrawal_type === 'to_bank' ? 'Bank Transfer' : 'Digital Assets'}
                    </p>
                </div>

                {fee > 0 && (
                  <div>
                      <p className="text-[7px] font-black uppercase tracking-widest text-[#D2691E] mb-0.5">Service Fee</p>
                      <p className="font-black text-[9px] text-rose-600">₦{fee.toLocaleString()}</p>
                  </div>
                )}
            </div>
            
            <div className="space-y-3 text-right">
                <div>
                    <p className="text-[7px] font-black uppercase tracking-widest text-[#D2691E] mb-0.5">Net Payout</p>
                    <p className="font-black text-lg italic text-[#3E2723]">₦{netAmount.toLocaleString()}</p>
                    <p className="text-[7px] font-bold text-[#8D6E63] uppercase opacity-60">Naira (NGN)</p>
                </div>

                <div>
                    <p className="text-[7px] font-black uppercase tracking-widest text-[#D2691E] mb-0.5">Timestamp</p>
                    <p className="font-black text-[8px] uppercase italic text-[#3E2723]">{new Date(transaction.created_at || '').toLocaleDateString()}</p>
                    <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest border mt-0.5 shadow-sm",
                        getStatusColor(transaction.status)
                    )}>
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                    </div>
                </div>

                {fee > 0 && (
                  <div>
                      <p className="text-[7px] font-black uppercase tracking-widest text-[#D2691E] mb-0.5">Gross Total</p>
                      <p className="font-black text-[9px] text-[#3E2723]/60">₦{transaction.amount.toLocaleString()}</p>
                  </div>
                )}
            </div>
        </div>

        <div className="bg-white/50 p-2 rounded-lg border border-[#EFEBE9]">
            <p className="text-[6px] font-black uppercase text-[#D2691E] mb-0.5 opacity-50">Settlement Coordinates</p>
            <p className="text-[8px] font-mono text-[#8D6E63] break-all leading-tight uppercase italic truncate">
                {transaction.address}
            </p>
        </div>
      </div>

      {/* Professional Footer Sections */}
      <div className="relative z-10 space-y-4 border-t border-[#EFEBE9] pt-4">
        <p className="text-[7px] text-[#8D6E63] leading-tight text-center font-medium uppercase px-2 opacity-50 italic">
            Certified evidence of transfer. Final and irrevocable settlement.
        </p>

        <div className="text-center">
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#8D6E63] opacity-40">Digital Endorsement</p>
          <div className="font-black italic text-[#3E2723]/10 text-lg tracking-tighter uppercase select-none leading-none mt-1">
            TERRAS CORE ALPHA
          </div>
        </div>
      </div>

      {/* Security Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.015] -rotate-12 whitespace-nowrap">
        <p className="text-[60px] font-black uppercase">OFFICIAL</p>
      </div>
    </div>
  );
};

export default WithdrawalReceipt;
