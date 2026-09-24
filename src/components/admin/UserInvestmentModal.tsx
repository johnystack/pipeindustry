import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Clock,
  Calendar,
  Gem,
  CheckCircle,
  XCircle,
  Eye,
  Image as ImageIcon,
  DollarSign,
  ArrowDownLeft,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { User, Investment, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface UserInvestmentModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  investments: Investment[];
  withdrawals: Transaction[];
  onApproveInvestment?: (id: string) => Promise<void>;
  onRejectInvestment?: (id: string) => Promise<void>;
  onViewReceipt?: (id: string) => void;
}

export const UserInvestmentModal = ({
  user,
  isOpen,
  onClose,
  investments,
  withdrawals,
  onApproveInvestment,
  onRejectInvestment,
  onViewReceipt,
}: UserInvestmentModalProps) => {
  const [activeTab, setActiveTab] = useState<"plans" | "withdrawals">("plans");

  if (!user) return null;

  // Filter investments for this user
  const userInvestments = investments.filter((inv) => inv.user_id === user.id);
  const activeInvestments = userInvestments.filter((inv) => inv.status === "active");
  const completedInvestments = userInvestments.filter(
    (inv) => inv.status === "completed" || inv.status === "withdrawn"
  );

  // 1. What they invested
  const activeInvested = activeInvestments.reduce(
    (sum, inv) => sum + (Number(inv.amount) || 0),
    0
  );
  const lifetimeInvested = userInvestments
    .filter((inv) => ["active", "completed", "withdrawn"].includes(inv.status))
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  // 2. How much withdrawn
  const totalClaimedFromPlans = userInvestments.reduce(
    (sum, inv) => sum + (Number(inv.claimed_amount) || 0),
    0
  );

  const userWithdrawals = withdrawals.filter((w) => w.user_id === user.id);
  const completedBankWithdrawals = userWithdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const pendingBankWithdrawals = userWithdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  // 3. How much left on plan execution
  const totalActiveTarget = activeInvestments.reduce(
    (sum, inv) => sum + (Number(inv.amount) || 0) * 1.5,
    0
  );
  const totalActiveClaimed = activeInvestments.reduce(
    (sum, inv) => sum + (Number(inv.claimed_amount) || 0),
    0
  );
  const totalLeftOnPlanExecution = Math.max(0, totalActiveTarget - totalActiveClaimed);
  const overallExecutionProgress =
    totalActiveTarget > 0
      ? Math.min(100, Math.round((totalActiveClaimed / totalActiveTarget) * 100))
      : activeInvestments.length === 0 && completedInvestments.length > 0
      ? 100
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-white/10 text-white p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
        {/* Header */}
        <DialogHeader className="space-y-4 border-b border-white/5 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xl uppercase italic shrink-0 shadow-lg shadow-purple-500/5">
                {user.first_name?.[0] || user.username?.[0] || "U"}
                {user.last_name?.[0] || ""}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl md:text-2xl font-black uppercase italic tracking-tight truncate">
                    {user.first_name || user.last_name
                      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                      : user.username || "Anonymous"}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5",
                      user.role === "admin"
                        ? "border-red-500/50 text-red-400 bg-red-500/10"
                        : user.role === "vendor"
                        ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                        : "border-purple-500/50 text-purple-400 bg-purple-500/10"
                    )}
                  >
                    {user.role || "user"}
                  </Badge>
                  {activeInvestments.length > 0 ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase">
                      Active Investor
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-white/10 text-muted-foreground text-[8px] font-black uppercase">
                      {completedInvestments.length > 0 ? "Completed Cycle" : "No Active Plans"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 truncate">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{user.email}</span>
                  {user.created_at && (
                    <span className="text-[10px] opacity-60">
                      • Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Link to={`/admin/users/${user.id}/investments`} onClick={onClose}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider gap-2 shrink-0"
              >
                <span>Full Portfolio Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* 1. What they invested */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Invested Capital</span>
                <TrendingUp className="h-3 w-3 text-primary" />
              </div>
              <p className="text-xl md:text-2xl font-black italic text-white tracking-tight">
                ₦{activeInvested.toLocaleString()}
              </p>
              <p className="text-[8px] font-bold text-muted-foreground/80 truncate">
                {activeInvestments.length > 0
                  ? `${activeInvestments.length} Active Plan(s)`
                  : lifetimeInvested > 0
                  ? `Lifetime: ₦${lifetimeInvested.toLocaleString()}`
                  : "No Active Deposits"}
              </p>
            </div>

            {/* 2. How much withdrawn */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Total Withdrawn</span>
                <ArrowDownLeft className="h-3 w-3 text-emerald-400" />
              </div>
              <p className="text-xl md:text-2xl font-black italic text-emerald-400 tracking-tight">
                ₦{totalClaimedFromPlans.toLocaleString()}
              </p>
              <p className="text-[8px] font-bold text-muted-foreground/80 truncate">
                Bank Paid: ₦{completedBankWithdrawals.toLocaleString()}
                {pendingBankWithdrawals > 0 && (
                  <span className="text-amber-400"> (₦{pendingBankWithdrawals.toLocaleString()} pend)</span>
                )}
              </p>
            </div>

            {/* 3. Left on plan execution */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Left On Plan Execution</span>
                <Clock className="h-3 w-3 text-amber-400" />
              </div>
              <p className="text-xl md:text-2xl font-black italic text-amber-400 tracking-tight">
                ₦{totalLeftOnPlanExecution.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <Progress value={overallExecutionProgress} className="h-1.5 flex-1 bg-slate-950" />
                <span className="text-[8px] font-black text-amber-400/90 shrink-0">
                  {overallExecutionProgress}%
                </span>
              </div>
            </div>

            {/* 4. Withdrawable balance */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 space-y-1 relative overflow-hidden group">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Wallet Balance</span>
                <Wallet className="h-3 w-3 text-cyan-400" />
              </div>
              <p className="text-xl md:text-2xl font-black italic text-cyan-400 tracking-tight">
                ₦{(user.withdrawable_balance || 0).toLocaleString()}
              </p>
              <p className="text-[8px] font-bold text-muted-foreground/80 truncate">
                Referral ROI: ₦{(user.referral_earnings || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs for Investments vs Bank Withdrawals */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-4">
          <TabsList className="bg-slate-900 border border-white/5 p-1 rounded-xl w-full grid grid-cols-2">
            <TabsTrigger
              value="plans"
              className="rounded-lg font-black text-xs uppercase tracking-wider data-[state=active]:bg-purple-600 data-[state=active]:text-white py-2"
            >
              Investment Plans ({userInvestments.length})
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              className="rounded-lg font-black text-xs uppercase tracking-wider data-[state=active]:bg-orange-600 data-[state=active]:text-white py-2"
            >
              Bank Payouts ({userWithdrawals.length})
            </TabsTrigger>
          </TabsList>

          {/* Investment Plans Tab Content */}
          <TabsContent value="plans" className="space-y-4 outline-none">
            {userInvestments.length === 0 ? (
              <div className="py-14 text-center bg-slate-900/30 rounded-2xl border border-dashed border-white/5">
                <Gem className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">
                  No investments recorded for this user
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userInvestments.map((inv) => {
                  const targetReturn = Number(inv.amount || 0) * 1.5;
                  const claimedAmount = Number(inv.claimed_amount || 0);
                  const leftOnPlan = Math.max(0, targetReturn - claimedAmount);
                  const stage = Math.min(6, Math.floor(claimedAmount / (inv.amount * 0.25)));

                  // Compute days passed
                  let daysPassed = 0;
                  if (inv.approved_at) {
                    const start = new Date(inv.approved_at).getTime();
                    const now = Date.now();
                    daysPassed = Math.min(24, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
                  }
                  const percentExecuted = targetReturn > 0 ? Math.min(100, Math.round((claimedAmount / targetReturn) * 100)) : 0;

                  return (
                    <div
                      key={inv.id}
                      className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 space-y-4 hover:border-white/10 transition-all"
                    >
                      {/* Plan Top Info */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-primary shrink-0">
                            <Gem className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm uppercase italic tracking-tight">
                                {inv.plan_name || "Standard Commodity Plan"}
                              </h4>
                              {inv.status === "active" && (
                                <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/30 text-primary">
                                  Stage {stage}/6
                                </Badge>
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              <span>Created: {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "N/A"}</span>
                              {inv.approved_at && (
                                <span>• Approved: {new Date(inv.approved_at).toLocaleDateString()}</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "font-black text-[8px] px-2.5 py-0.5 rounded-lg tracking-wider uppercase",
                              inv.status === "active"
                                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
                                : inv.status === "pending"
                                ? "bg-amber-600/20 text-amber-400 border border-amber-500/20"
                                : inv.status === "completed"
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                                : "bg-red-600/20 text-red-400 border border-red-500/20"
                            )}
                          >
                            {inv.status}
                          </Badge>

                          {inv.payment_proof && onViewReceipt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewReceipt(inv.id)}
                              className="h-7 px-2.5 rounded-lg border-white/10 hover:bg-white/10 text-[8px] font-black uppercase italic gap-1"
                            >
                              <ImageIcon className="h-3 w-3" />
                              <span>Receipt</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 4 Financial Breakdown Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                        <div>
                          <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Capital Invested</p>
                          <p className="text-sm font-black italic text-white">₦{Number(inv.amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Target Return (150%)</p>
                          <p className="text-sm font-black italic text-emerald-400">₦{targetReturn.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Withdrawn / Claimed</p>
                          <p className="text-sm font-black italic text-purple-400">₦{claimedAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">Left On Execution</p>
                          <p className="text-sm font-black italic text-amber-400">₦{leftOnPlan.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Execution Progress Bar */}
                      {inv.status === "active" && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>Execution Progress: {percentExecuted}%</span>
                            <span className="text-primary">{daysPassed}/24 Cycle Days • Stage {stage}/6</span>
                          </div>
                          <Progress value={percentExecuted} className="h-1.5 bg-slate-950" />
                        </div>
                      )}

                      {inv.status === "completed" && (
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-center text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Plan Execution 100% Completed &amp; Fully Disbursed</span>
                        </div>
                      )}

                      {/* Quick Approval Actions if Pending */}
                      {inv.status === "pending" && onApproveInvestment && onRejectInvestment && (
                        <div className="flex gap-2 pt-1 border-t border-white/5">
                          <Button
                            size="sm"
                            onClick={() => onApproveInvestment(inv.id)}
                            className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase rounded-xl gap-1.5"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Authorize Investment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onRejectInvestment(inv.id)}
                            className="flex-1 h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 text-[9px] font-black uppercase rounded-xl gap-1.5"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Discard
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Withdrawal History Tab Content */}
          <TabsContent value="withdrawals" className="space-y-4 outline-none">
            {userWithdrawals.length === 0 ? (
              <div className="py-14 text-center bg-slate-900/30 rounded-2xl border border-dashed border-white/5">
                <ArrowDownLeft className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">
                  No bank withdrawal requests for this user
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white italic">
                          ₦{Number(w.amount || 0).toLocaleString()}
                        </span>
                        <Badge
                          className={cn(
                            "text-[7px] font-black uppercase px-2 py-0.5",
                            w.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                              : w.status === "pending"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/20 text-red-400 border border-red-500/20"
                          )}
                        >
                          {w.status}
                        </Badge>
                      </div>
                      <p className="text-[9px] font-medium text-muted-foreground">
                        {w.description || (w.withdrawal_type === "to_bank" ? "Bank Transfer" : "Crypto Withdrawal")}
                        {w.created_at && ` • ${new Date(w.created_at).toLocaleDateString()}`}
                      </p>
                      {w.fee && Number(w.fee) > 0 && (
                        <p className="text-[8px] font-bold text-muted-foreground/60">
                          Fee: ₦{Number(w.fee).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right text-[9px] font-bold text-muted-foreground">
                      <p className="text-white/80 font-black uppercase">
                        {w.profiles?.bank_name || "Default Bank"}
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {w.profiles?.account_number ? `Acct: ${w.profiles.account_number}` : (w.address || "N/A")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserInvestmentModal;
