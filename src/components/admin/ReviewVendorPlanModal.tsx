import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Store,
  Calendar,
  User,
  Mail,
  Coins,
  Percent,
  Clock,
  ShieldCheck,
  Loader2,
  Users,
  Wallet,
} from "lucide-react";
import { VendorPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReviewVendorPlanModalProps {
  plan: (VendorPlan & { profiles?: any }) | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (planId: string) => Promise<void>;
  onReject: (planId: string) => Promise<void>;
  loading?: boolean;
}

export const ReviewVendorPlanModal = ({
  plan,
  isOpen,
  onClose,
  onApprove,
  onReject,
  loading = false,
}: ReviewVendorPlanModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!plan) return null;

  const handleCopyTx = () => {
    if (plan.eligibility_tx) {
      navigator.clipboard.writeText(plan.eligibility_tx);
      setCopied(true);
      toast({ title: "Copied", description: "Transaction hash copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isApproved = plan.eligibility_status === "approved";
  const isRejected = plan.eligibility_status === "rejected";
  const isPending = !isApproved && !isRejected;

  const vendorName =
    plan.profiles?.first_name || plan.profiles?.last_name
      ? `${plan.profiles?.first_name || ""} ${plan.profiles?.last_name || ""}`.trim()
      : plan.vendor_name || "Unknown Vendor";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-white/10 text-white p-6 rounded-2xl shadow-2xl space-y-4">
        {/* Header */}
        <DialogHeader className="space-y-2 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Store className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                Review Vendor Plan
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Verify asset details, listing fee verification, and accept or reject this investment plan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Plan Overview Banner */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tight">{plan.name}</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                ID: <span className="font-mono text-white/70">{plan.id}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase border-white/15 px-2 py-0.5">
                {plan.asset_type || "Asset"}
              </Badge>
              <Badge
                className={cn(
                  "text-[8px] font-black uppercase px-2.5 py-0.5",
                  isApproved
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isRejected
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                )}
              >
                {isApproved ? "Approved & Live" : isRejected ? "Rejected" : "Pending Verification"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Vendor Information */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Vendor Profile</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold text-muted-foreground uppercase">Vendor Name</p>
                <p className="font-black truncate uppercase italic text-sm">{vendorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold text-muted-foreground uppercase">Email Address</p>
                <p className="font-bold truncate text-white/80">{plan.profiles?.email || "No email"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Plan Terms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Entry Price</p>
            <p className="text-sm font-black text-emerald-400">₦{(plan.min_investment || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Daily ROI</p>
            <p className="text-sm font-black text-primary">{(plan.daily_return_percent || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Duration</p>
            <p className="text-sm font-black text-white">{plan.duration_days || 0} Days</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Occupancy</p>
            <p className="text-sm font-black text-amber-400">{plan.current_traders || 0} / {plan.max_traders || 10}</p>
          </div>
        </div>

        {/* Listing Fee Verification Proof (TX Hash) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Listing Fee Verification Proof (₦5,000,000)
            </p>
          </div>

          {plan.eligibility_tx ? (
            <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-mono break-all text-emerald-400 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 flex-1">
                  {plan.eligibility_tx}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyTx}
                  className="h-8 px-2.5 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase shrink-0 gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-[8px] text-muted-foreground font-medium">
                Verify this transaction hash on the blockchain or payment network before authorizing.
              </p>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-[9px] font-bold uppercase">No transaction hash submitted by vendor yet.</p>
            </div>
          )}
        </div>

        {/* Payment Details if available */}
        {plan.payment_details && (
          <div className="space-y-1.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-3 w-3 text-primary" /> Vendor Payment Details
            </p>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-[10px] font-mono text-white/80 whitespace-pre-wrap break-all">
              {plan.payment_details}
            </div>
          </div>
        )}

        {/* Date registered */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-white/5 pt-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Submitted: {new Date(plan.created_at).toLocaleString()}
          </span>
          <span className="uppercase font-bold">
            Status: <span className={cn(isApproved ? "text-emerald-400" : isRejected ? "text-red-400" : "text-amber-400")}>{plan.eligibility_status?.toUpperCase() || "PENDING"}</span>
          </span>
        </div>

        {/* Actions Footer */}
        <DialogFooter className="border-t border-white/5 pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-10 border-white/10 hover:bg-white/5 text-muted-foreground font-bold text-xs uppercase rounded-xl"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onReject(plan.id)}
              disabled={loading}
              className="h-10 px-4 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 font-black text-xs uppercase tracking-wider gap-1.5 rounded-xl transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject Plan
            </Button>

            <Button
              onClick={() => onApprove(plan.id)}
              disabled={loading}
              className="h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider gap-1.5 shadow-lg shadow-emerald-900/30 rounded-xl transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Accept Plan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewVendorPlanModal;
