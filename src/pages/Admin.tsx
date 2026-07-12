import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Users as UsersIcon,
  Coins,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Gem,
  Settings,
  Loader2,
  Plus,
  Store,
  Zap,
  XCircle,
  RefreshCcw,
  ShieldAlert,
  ArrowUpRight,
  Eye,
  Image as ImageIcon,
  ArrowDownLeft,
  History as HistoryIcon,
  ShieldCheck,
  Wallet,
  Info,
  Crown,
  UserCheck,
  UserPlus,
  Target,
  Trash2,
  Edit,
  Check,
  X,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeductBalanceModal } from "@/components/admin/DeductBalanceModal";
import GiveBonusModal from "@/components/admin/GiveBonusModal";
import EditCryptoModal from "@/components/admin/EditCryptoModal";
import CreateVendorWalletModal from "@/components/admin/CreateVendorWalletModal";
import EditVendorWalletModal from "@/components/admin/EditVendorWalletModal";
import { cn } from "@/lib/utils";
import { Investment, User, VendorPlan, Crypto as Cryptocurrency, Transaction, VendorPaymentWallet } from "@/lib/types";
import ViewReceiptModal from "@/components/receipts/ViewReceiptModal";

const Admin = () => {
  const { toast } = useToast();
  // Statistics
  const [stats, setStats] = useState({
    totalInvestments: 0,
    pendingReview: 0,
    activeInvestments: 0,
    totalUsers: 0,
    totalVendors: 0,
    totalTraders: 0,
    totalVolume: 0,
    approvedVendorPlans: 0,
    pendingWithdrawals: 0,
  });

  // Data management
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [vendorWallets, setVendorWallets] = useState<VendorPaymentWallet[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [vendorPlans, setVendorPlans] = useState<(VendorPlan & { profiles: any })[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // New Notification State
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "success" | "warning" | "error">("info");
  const [notifTarget, setNotifTarget] = useState<"all" | "single">("all");
  const [notifUserId, setNotifUserId] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  
  // Modal states
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null);
  const [editCryptoOpen, setEditCryptoOpen] = useState(false);
  const [selectedVendorWallet, setSelectedVendorWallet] = useState<VendorPaymentWallet | null>(null);
  const [editVendorWalletOpen, setEditVendorWalletOpen] = useState(false);
  const [createVendorWalletOpen, setCreateVendorWalletOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [giveBonusOpen, setGiveBonusOpen] = useState(false);
  const [deductBalanceOpen, setDeductBalanceOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState<string | null>(null);

  // Receipt Modal State
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: invData },
        { data: profilesData },
        { data: plansData },
        { data: cryptoData },
        { data: vendorWalletData },
        { data: transData },
        { data: notifData }
      ] = await Promise.all([
        supabase.from("investments").select("*, profiles(first_name, last_name, email, username, avatar_url)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("vendor_plans").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false }),
        supabase.from("cryptocurrencies").select("*"),
        supabase.from("vendor_payment_wallets").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*, profiles(first_name, last_name, email, bank_name, account_number, account_name)").order("created_at", { ascending: false }),
        supabase.from("notifications").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false })
      ]);

      if (notifData) setNotifications(notifData);

      if (invData) {
        const pending = invData.filter((inv) => inv.status === "pending").length;
        const active = invData.filter((inv) => inv.status === "active").length;
        const volume = invData.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        
        setInvestments(invData);
        setStats(prev => ({
          ...prev,
          totalInvestments: invData.length,
          pendingReview: pending,
          activeInvestments: active,
          totalVolume: volume,
        }));

        const processedInv = invData.filter(i => i.status !== 'pending').map(i => ({ ...i, historyType: 'investment' }));
        setHistory(processedInv);
      }

      if (transData) {
        const withdrawalRequests = transData.filter(t => t.type === 'withdrawal');
        setWithdrawals(withdrawalRequests);
        setStats(prev => ({
          ...prev,
          pendingWithdrawals: withdrawalRequests.filter(w => w.status === 'pending').length
        }));

        const processedTrans = transData.filter(t => t.status !== 'pending').map(t => ({ ...t, historyType: 'transaction' }));
        setHistory(prev => {
            const combined = [...prev, ...processedTrans].sort((a, b) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
            return combined;
        });
      }

      if (profilesData) {
        setProfiles(profilesData);
        setStats(prev => ({
          ...prev,
          totalUsers: profilesData.length,
          totalVendors: profilesData.filter(u => u.role === 'vendor').length,
          totalTraders: profilesData.filter(u => u.role === 'trader' || !u.role || u.role === 'user').length,
        }));
      }

      if (plansData) {
        setVendorPlans(plansData as any);
        setStats(prev => ({
          ...prev,
          approvedVendorPlans: plansData.filter(p => p.eligibility_status === 'approved').length
        }));
      }

      if (cryptoData) setCryptos(cryptoData);
      if (vendorWalletData) setVendorWallets(vendorWalletData);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (investmentId: string) => {
    setApproveLoading(investmentId);
    try {
      const now = new Date().toISOString();
      const dueDate = new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from("investments").update({ status: "active", approved_at: now, due_date: dueDate }).eq("id", investmentId);
      if (error) throw error;
      toast({ title: "Trade Authorized", description: "Activated successfully." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setApproveLoading(null); }
  };

  const handleReject = async (investmentId: string) => {
    setApproveLoading(investmentId);
    try {
      const { error } = await supabase.from("investments").update({ status: "denied" }).eq("id", investmentId);
      if (error) throw error;
      toast({ title: "Trade Discarded", description: "Denied successfully." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setApproveLoading(null); }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    setApproveLoading(withdrawalId);
    try {
      const { error } = await supabase.rpc('approve_withdrawal', { withdrawal_id: withdrawalId });
      if (error) throw error;
      toast({ title: "Withdrawal Approved", description: "Assets liquidated successfully." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setApproveLoading(null); }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    setApproveLoading(withdrawalId);
    try {
      const { error } = await supabase.rpc('reject_withdrawal', { withdrawal_id: withdrawalId });
      if (error) throw error;
      toast({ title: "Withdrawal Rejected", description: "Request denied and balance refunded." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setApproveLoading(null); }
  };

  const handleDeleteVendorWallet = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wallet?")) return;
    try {
      const { error } = await supabase.from("vendor_payment_wallets").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Wallet deleted successfully." });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleVendorWallet = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("vendor_payment_wallets").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: `Wallet ${!currentStatus ? 'activated' : 'deactivated'} successfully.` });
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle || !notifMessage) {
      toast({ title: "Validation Error", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    if (notifTarget === "single" && !notifUserId) {
      toast({ title: "Validation Error", description: "Target user is required for individual notifications.", variant: "destructive" });
      return;
    }

    setSendingNotif(true);
    try {
      const { error } = await supabase.from("notifications").insert([{
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        user_id: notifTarget === "all" ? null : notifUserId
      }]);

      if (error) throw error;
      toast({ title: "Notification Sent", description: "Broadcasting successful." });
      setNotifTitle("");
      setNotifMessage("");
      loadData();
    } catch (error: any) {
      toast({ title: "Transmission Failed", description: error.message, variant: "destructive" });
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm("Remove this notification?")) return;
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Notification Removed" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-muted-foreground font-black tracking-widest animate-pulse uppercase text-xs">Synchronizing Neural Core...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-black tracking-[0.2em] uppercase">
            <ShieldAlert className="h-2.5 w-2.5" /> Secure Authority
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Commander</h1>
          <p className="text-muted-foreground font-bold max-w-md italic text-[10px] uppercase tracking-widest opacity-60">Complete oversight of market participants.</p>
        </div>
        <div className="flex gap-3">
            <Button onClick={loadData} variant="outline" className="h-11 w-11 rounded-xl border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-all">
                <RefreshCcw className="h-4 w-4" />
            </Button>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Identify target..." 
                    className="pl-10 h-11 w-full md:w-[260px] rounded-xl bg-slate-950 border-white/5 text-[10px] font-bold uppercase"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
            { label: 'Awaiting', val: stats.pendingReview, icon: Clock, color: 'text-primary' },
            { label: 'Withdrawals', val: stats.pendingWithdrawals, icon: DollarSign, color: 'text-orange-500' },
            { label: 'Users', val: stats.totalUsers, icon: UsersIcon, color: 'text-white' },
            { label: 'Volume', val: `₦${stats.totalVolume.toLocaleString()}`, icon: ArrowUpRight, color: 'text-amber-500' }
        ].map((s, i) => (
            <Card key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden relative group hover:bg-white/[0.01] transition-all shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform hidden sm:block">
                    <s.icon className={cn("h-8 w-8", s.color)} />
                </div>
                <CardHeader className="pb-1 px-4 md:px-5 pt-4 md:pt-5">
                    <CardTitle className="text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-50 truncate">{s.label}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-5 pb-4 md:pb-5">
                  <div className="text-xl md:text-3xl font-black tracking-tighter italic truncate">{s.val}</div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Tabs defaultValue="investments" className="w-full space-y-8">
        <TabsList className="bg-slate-950/80 border border-white/10 p-1 rounded-xl h-12 w-full grid grid-cols-7 gap-1 shadow-2xl overflow-x-auto scrollbar-hide">
          <TabsTrigger value="investments" className="rounded-lg font-black text-[9px] tracking-widest data-[state=active]:bg-primary h-full uppercase italic px-0">Trades</TabsTrigger>
          <TabsTrigger value="withdrawals" className="rounded-lg font-black text-[9px] tracking-widest data-[state=active]:bg-orange-600 h-full uppercase italic px-0">Payouts</TabsTrigger>
          <TabsTrigger value="vendors" className="rounded-lg font-black text-[9px] tracking-widest data-[state=active]:bg-emerald-600 h-full uppercase italic px-0">Plans</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg font-black text-[9px] tracking-widest data-[state=active]:bg-purple-600 h-full uppercase italic px-0">Users</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg font-black text-[9px] tracking-widest data-[state=active]:bg-red-600 h-full uppercase italic px-0">Alerts</TabsTrigger>
          <TabsTrigger value="crypto" className="rounded-lg font-black text-[9px] tracking-widest data-[state=active]:bg-cyan-600 h-full uppercase italic px-0">Wallets</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg font-black text-[9px] tracking-widest data-[state=active]:bg-slate-700 h-full uppercase italic px-0">History</TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="space-y-4 pt-2 outline-none">
            {/* Summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total', val: investments.length, color: 'text-white' },
                    { label: 'Pending', val: investments.filter(i => i.status === 'pending').length, color: 'text-amber-400' },
                    { label: 'Active', val: investments.filter(i => i.status === 'active').length, color: 'text-emerald-400' },
                    { label: 'Awaiting Proof', val: investments.filter(i => i.status === 'awaiting_proof').length, color: 'text-blue-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</span>
                        <span className={cn("text-lg font-black", s.color)}>{s.val}</span>
                    </div>
                ))}
            </div>

            {/* Desktop table — hidden on mobile */}
            <div className="hidden md:block bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <th className="px-4 py-3 text-left">Trader</th>
                                <th className="px-4 py-3 text-left">Plan / Asset</th>
                                <th className="px-4 py-3 text-left">Capital</th>
                                <th className="px-4 py-3 text-left">Proof</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {investments
                                .filter(inv =>
                                    inv.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    inv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    inv.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    inv.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((inv) => (
                                <tr key={inv.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 shrink-0 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs border border-white/5 uppercase italic">
                                                {inv.profiles?.first_name?.[0]}{inv.profiles?.last_name?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <h6 className="font-black text-xs uppercase italic truncate">{inv.profiles?.first_name} {inv.profiles?.last_name}</h6>
                                                <p className="text-[8px] font-bold text-muted-foreground truncate">{inv.profiles?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <Gem className="h-3 w-3 shrink-0 text-primary/70" />
                                            <span className="text-[10px] font-black uppercase italic truncate max-w-[120px]">{inv.plan_name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-black text-primary">₦{(inv.amount || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {inv.payment_proof ? (
                                            <Badge variant="outline" className="text-[7px] font-black uppercase border-emerald-500/40 text-emerald-400 px-1.5">
                                                Uploaded
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[7px] font-black uppercase border-amber-500/40 text-amber-400 px-1.5">
                                                Pending
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={cn("text-[7px] font-black uppercase px-1.5 py-0",
                                            inv.status === 'pending' ? "border-amber-500/50 text-amber-500" :
                                            inv.status === 'active' ? "border-emerald-500/50 text-emerald-500" :
                                            inv.status === 'awaiting_proof' ? "border-blue-500/50 text-blue-400" :
                                            inv.status === 'denied' ? "border-red-500/50 text-red-400" :
                                            "border-white/20 text-white/50"
                                        )}>
                                            {inv.status === 'awaiting_proof' ? 'Awaiting' : inv.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-[8px] text-muted-foreground font-bold">
                                            {new Date(inv.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1.5 items-center">
                                            {inv.payment_proof && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(inv.payment_proof, '_blank')}
                                                    className="h-7 px-2 border-primary/20 text-primary hover:bg-primary/10 text-[8px] font-black uppercase"
                                                >
                                                    Proof
                                                </Button>
                                            )}
                                            {inv.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        disabled={approveLoading === inv.id}
                                                        onClick={() => handleApprove(inv.id)}
                                                        className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-[8px] font-black uppercase"
                                                    >
                                                        {approveLoading === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={approveLoading === inv.id}
                                                        onClick={() => handleReject(inv.id)}
                                                        className="h-7 w-7 border-white/5 text-destructive hover:bg-destructive/10"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {investments.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground text-xs font-bold uppercase">
                                        No investments found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile cards — shown only on small screens */}
            <div className="flex flex-col gap-3 md:hidden">
                {investments
                    .filter(inv =>
                        inv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inv.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inv.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((inv) => (
                    <div key={inv.id} className="bg-slate-950 border border-white/5 rounded-2xl p-4 space-y-3">
                        {/* Header row */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-sm uppercase italic">
                                    {inv.profiles?.first_name?.[0]}{inv.profiles?.last_name?.[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-xs uppercase italic truncate">{inv.profiles?.first_name} {inv.profiles?.last_name}</p>
                                    <p className="text-[9px] text-muted-foreground truncate">{inv.profiles?.email}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className={cn("shrink-0 text-[7px] font-black uppercase px-2 py-0.5",
                                inv.status === 'pending' ? "border-amber-500/50 text-amber-500" :
                                inv.status === 'active' ? "border-emerald-500/50 text-emerald-500" :
                                inv.status === 'awaiting_proof' ? "border-blue-500/50 text-blue-400" :
                                inv.status === 'denied' ? "border-red-500/50 text-red-400" :
                                "border-white/20 text-white/50"
                            )}>
                                {inv.status === 'awaiting_proof' ? 'Awaiting' : inv.status}
                            </Badge>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/[0.02] rounded-xl p-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Plan</p>
                                <div className="flex items-center gap-1">
                                    <Gem className="h-3 w-3 shrink-0 text-primary/70" />
                                    <span className="text-[10px] font-black uppercase italic truncate">{inv.plan_name || '—'}</span>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Capital</p>
                                <p className="text-sm font-black text-primary">₦{(inv.amount || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Payment Proof</p>
                                {inv.payment_proof ? (
                                    <Badge variant="outline" className="text-[7px] font-black uppercase border-emerald-500/40 text-emerald-400">Uploaded</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[7px] font-black uppercase border-amber-500/40 text-amber-400">None Yet</Badge>
                                )}
                            </div>
                            <div className="bg-white/[0.02] rounded-xl p-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Date</p>
                                <p className="text-[9px] font-bold">{new Date(inv.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Payment proof text if exists */}
                        {inv.payment_proof && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Payment Reference</p>
                                <p className="text-[9px] font-mono break-all text-white/70">{inv.payment_proof}</p>
                            </div>
                        )}

                        {/* Actions */}
                        {inv.status === 'pending' && (
                            <div className="flex gap-2 pt-1">
                                <Button
                                    onClick={() => handleApprove(inv.id)}
                                    disabled={approveLoading === inv.id}
                                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black uppercase rounded-xl"
                                >
                                    {approveLoading === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Approve</>}
                                </Button>
                                <Button
                                    onClick={() => handleReject(inv.id)}
                                    disabled={approveLoading === inv.id}
                                    variant="outline"
                                    className="flex-1 h-10 border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-black uppercase rounded-xl"
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />Reject
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
                {investments.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground text-xs font-bold uppercase">
                        No investments found
                    </div>
                )}
            </div>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6 pt-2 outline-none">
            <div className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <th className="px-4 py-3 text-left">Participant</th>
                                <th className="px-4 py-3 text-left">Method</th>
                                <th className="px-4 py-3 text-left">Amount</th>
                                <th className="px-4 py-3 text-left">Status/Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {withdrawals.filter(w => w.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())).map((w) => (
                                <tr key={w.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-black text-xs uppercase italic">{w.profiles?.first_name?.[0]}{w.profiles?.last_name?.[0]}</div>
                                            <div className="min-w-0">
                                                <h6 className="font-black text-xs uppercase italic truncate max-w-[140px]">{w.profiles?.first_name} {w.profiles?.last_name}</h6>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase truncate max-w-[140px]">{w.profiles?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className={cn("w-fit text-[6px] font-black uppercase border-orange-500/20 px-1 py-0", w.withdrawal_type === 'to_bank' ? "text-emerald-500 border-emerald-500/20" : "text-orange-500")}>
                                                {w.withdrawal_type === 'to_bank' ? 'Bank Payout' : 'Crypto Payout'}
                                            </Badge>
                                            <span className="text-[10px] font-black uppercase italic leading-none">{w.crypto}</span>
                                            {w.withdrawal_type === 'to_bank' ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[8px] font-black text-white italic">{w.profiles?.bank_name}</span>
                                                    <span className="text-[8px] font-mono text-white/60">{w.profiles?.account_number}</span>
                                                    <span className="text-[7px] font-bold text-white/40 uppercase">{w.profiles?.account_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[8px] font-mono text-white/40 truncate max-w-[120px] uppercase">{w.address}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-orange-500">₦{(w.amount - Number(w.fee || 0)).toLocaleString()}</span>
                                            {Number(w.fee) > 0 && (
                                                <span className="text-[7px] font-bold text-muted-foreground uppercase opacity-40">Gross: ₦{w.amount.toLocaleString()}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={cn("text-[7px] font-black uppercase px-1.5 py-0", w.status === 'pending' ? "border-amber-500/50 text-amber-500" : "border-emerald-500/50 text-emerald-500")}>{w.status}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1.5 items-center">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => { setReceiptId(w.id); setIsReceiptOpen(true); }}
                                                className="h-7 px-2 border-orange-500/20 text-orange-400 hover:bg-orange-500/10 text-[8px] font-black uppercase italic transition-all"
                                            >
                                                View Receipt
                                            </Button>
                                            {w.status === 'pending' ? (
                                                <>
                                                    <Button size="sm" onClick={() => handleApproveWithdrawal(w.id)} className="h-7 px-2 bg-orange-600 hover:bg-orange-500 text-[8px] font-black uppercase italic">Approve</Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleRejectWithdrawal(w.id)} className="h-7 w-7 border-white/5 text-destructive hover:bg-destructive/10"><XCircle className="h-3.5 w-3.5" /></Button>
                                                </>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-20 hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6 pt-2 outline-none">
            <div className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <th className="px-4 py-3 text-left">Asset</th>
                                <th className="px-4 py-3 text-left">Origin</th>
                                <th className="px-4 py-3 text-left">Entry/Yield</th>
                                <th className="px-4 py-3 text-left">Occupancy</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {vendorPlans.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map((plan) => (
                                <tr key={plan.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center"><Store className="h-5 w-5" /></div>
                                            <div className="min-w-0">
                                                <h6 className="font-black text-xs uppercase italic truncate max-w-[120px]">{plan.name}</h6>
                                                <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10 opacity-60 px-1.5 py-0">{plan.asset_type}</Badge>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black truncate max-w-[140px] italic">{plan.profiles?.first_name} {plan.profiles?.last_name}</p>
                                            <p className="text-[8px] font-bold text-muted-foreground truncate max-w-[140px] uppercase">{plan.profiles?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black">₦{plan.min_investment.toLocaleString()}</span>
                                            <span className="text-[9px] font-black text-emerald-500 italic">{plan.daily_return_percent.toFixed(1)}% ROI</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black italic">{plan.current_traders}/{plan.max_traders}</div>
                                            <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${(plan.current_traders / plan.max_traders) * 100}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" className="h-7 px-3 bg-white text-black hover:bg-emerald-600 hover:text-white text-[8px] font-black uppercase rounded-lg italic transition-all">Review</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 pt-2 outline-none">
            {/* ... users content ... */}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-8 pt-2 outline-none">
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <Card className="bg-slate-900/50 border-white/10 shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 md:p-8 border-b border-white/5 bg-red-500/5">
                            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3 italic text-red-500">
                                <ShieldAlert className="h-5 w-5" /> Broadcast Alert
                            </CardTitle>
                            <CardDescription className="text-[9px] font-bold uppercase tracking-widest opacity-60">Issue system-wide or targeted notifications.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transmission Mode</Label>
                                        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                                            <button 
                                                onClick={() => setNotifTarget("all")}
                                                className={cn("flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all", notifTarget === "all" ? "bg-red-600 text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                                            >System Wide</button>
                                            <button 
                                                onClick={() => setNotifTarget("single")}
                                                className={cn("flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all", notifTarget === "single" ? "bg-red-600 text-white shadow-lg" : "text-muted-foreground hover:text-white")}
                                            >Targeted</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Threat Level</Label>
                                        <select 
                                            value={notifType} 
                                            onChange={(e) => setNotifType(e.target.value as any)}
                                            className="w-full h-10 bg-slate-950 border border-white/5 rounded-xl px-4 text-[9px] font-black uppercase italic text-white focus:outline-none focus:border-red-500/50 appearance-none"
                                        >
                                            <option value="info">Information</option>
                                            <option value="success">Operational</option>
                                            <option value="warning">Precautionary</option>
                                            <option value="error">Critical</option>
                                        </select>
                                    </div>
                                </div>

                                {notifTarget === "single" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identify Target User</Label>
                                        <select 
                                            value={notifUserId} 
                                            onChange={(e) => setNotifUserId(e.target.value)}
                                            className="w-full h-11 bg-slate-950 border border-white/5 rounded-xl px-4 text-[10px] font-black uppercase italic text-white focus:outline-none focus:border-red-500/50 appearance-none"
                                        >
                                            <option value="">Select User...</option>
                                            {profiles.map(u => (
                                                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alert Header</Label>
                                    <Input 
                                        placeholder="URGENT: ACTION REQUIRED"
                                        value={notifTitle}
                                        onChange={(e) => setNotifTitle(e.target.value)}
                                        className="h-11 bg-slate-950 border-white/5 text-[10px] font-black uppercase tracking-tighter"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Neural Payload (Message)</Label>
                                    <textarea 
                                        placeholder="Detailed transmission content..."
                                        value={notifMessage}
                                        onChange={(e) => setNotifMessage(e.target.value)}
                                        className="w-full h-32 bg-slate-950 border border-white/5 rounded-xl p-4 text-[10px] font-bold text-white focus:outline-none focus:border-red-500/50 resize-none"
                                    />
                                </div>

                                <Button 
                                    onClick={handleSendNotification}
                                    disabled={sendingNotif}
                                    className="w-full h-14 bg-red-600 hover:bg-red-500 text-[10px] font-black uppercase tracking-[0.2em] italic rounded-2xl shadow-xl shadow-red-900/20"
                                >
                                    {sendingNotif ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initiate Broadcast"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <Card className="bg-slate-950/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="p-6 md:p-8 border-b border-white/5">
                            <CardTitle className="text-lg font-black uppercase tracking-tight italic flex items-center gap-3">
                                <HistoryIcon className="h-5 w-5 text-muted-foreground" /> Alert Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[600px] overflow-y-auto scrollbar-hide divide-y divide-white/5">
                                {notifications.length === 0 ? (
                                    <div className="py-20 text-center space-y-4 opacity-20">
                                        <Info className="h-12 w-12 mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No active transmissions in log</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n.id} className="p-6 hover:bg-white/[0.02] transition-all group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-3 flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={cn(
                                                            "text-[7px] font-black uppercase px-2 py-0.5 italic",
                                                            n.type === 'error' ? "bg-red-500" : 
                                                            n.type === 'warning' ? "bg-amber-500" : 
                                                            n.type === 'success' ? "bg-emerald-500" : "bg-cyan-500"
                                                        )}>
                                                            {n.type}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10 opacity-60">
                                                            {n.user_id ? "Individual" : "System-Wide"}
                                                        </Badge>
                                                        <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">{new Date(n.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black uppercase italic text-white tracking-tight">{n.title}</h4>
                                                        <p className="text-[10px] font-medium text-muted-foreground/80 leading-relaxed">{n.message}</p>
                                                    </div>
                                                    {n.user_id && (
                                                        <div className="flex items-center gap-2 pt-1">
                                                            <div className="h-5 w-5 rounded bg-white/5 flex items-center justify-center text-[7px] font-black italic">{n.profiles?.first_name?.[0]}{n.profiles?.last_name?.[0]}</div>
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest italic">{n.profiles?.first_name} {n.profiles?.last_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleDeleteNotification(n.id)}
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-6 pt-2 outline-none">
            <div className="flex justify-between items-center px-2">
                <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest italic">Vendor Payment Registry</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Manage wallets used for vendor commitment fees.</p>
                </div>
                <Button 
                    onClick={() => setCreateVendorWalletOpen(true)}
                    className="h-9 px-4 bg-cyan-600 hover:bg-cyan-500 text-[10px] font-black uppercase italic rounded-xl gap-2"
                >
                    <Plus className="h-4 w-4" /> Add Wallet
                </Button>
            </div>

            <div className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <th className="px-4 py-3 text-left">Asset</th>
                                <th className="px-4 py-3 text-left">Protocol</th>
                                <th className="px-4 py-3 text-left">Identifier</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {vendorWallets.map((wallet) => (
                                <tr key={wallet.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500"><Wallet className="h-4 w-4" /></div>
                                            <p className="text-[11px] font-black uppercase italic">{wallet.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className="bg-cyan-600/10 text-cyan-500 border-cyan-500/20 text-[7px] font-black uppercase italic">
                                            {wallet.symbol} • {wallet.network || 'MAINNET'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-[9px] font-mono text-white/40 truncate max-w-[140px] uppercase">{wallet.address}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge 
                                            variant="outline" 
                                            className={cn(
                                                "text-[7px] font-black uppercase px-1.5 py-0 cursor-pointer",
                                                wallet.is_active ? "border-emerald-500/50 text-emerald-500" : "border-red-500/50 text-red-500"
                                            )}
                                            onClick={() => handleToggleVendorWallet(wallet.id, wallet.is_active)}
                                        >
                                            {wallet.is_active ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-7 w-7 opacity-20 hover:opacity-100"
                                                onClick={() => { setSelectedVendorWallet(wallet); setEditVendorWalletOpen(true); }}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-7 w-7 opacity-20 hover:opacity-100 text-destructive"
                                                onClick={() => handleDeleteVendorWallet(wallet.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vendorWallets.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-[10px] font-black uppercase opacity-20 tracking-widest italic">
                                        No vendor wallets registered.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 pt-2 outline-none">
             <div className="bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <th className="px-4 py-3 text-left">Timestamp</th>
                                <th className="px-4 py-3 text-left">Participant</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Amount</th>
                                <th className="px-4 py-3 text-right">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((item) => (
                                <tr key={item.id} className="group hover:bg-white/[0.01] transition-all">
                                    <td className="px-4 py-3">
                                        <p className="text-[10px] font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
                                        <p className="text-[8px] text-muted-foreground font-medium uppercase">{new Date(item.created_at).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center text-[8px] font-black italic border border-white/5 uppercase">{item.profiles?.first_name?.[0]}{item.profiles?.last_name?.[0]}</div>
                                            <p className="text-[10px] font-black truncate max-w-[120px] uppercase italic">{item.profiles?.first_name} {item.profiles?.last_name}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            {item.historyType === 'investment' ? <ArrowDownLeft className="h-2.5 w-2.5 text-cyan-500" /> : <ArrowUpRight className="h-2.5 w-2.5 text-orange-500" />}
                                            <span className="text-[8px] font-black uppercase tracking-widest">{item.historyType === 'investment' ? 'Deposit' : item.type}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><span className="text-xs font-black">₦{item.amount?.toLocaleString()}</span></td>
                                    <td className="px-4 py-3 text-right"><Badge className={cn("text-[7px] font-black uppercase px-2 py-0", item.status === 'approved' || item.status === 'active' || item.status === 'completed' ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/10" : "bg-destructive/20 text-destructive border-destructive/10")}>{item.status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </TabsContent>
      </Tabs>

      <EditCryptoModal crypto={selectedCrypto} isOpen={editCryptoOpen} onClose={() => setEditCryptoOpen(false)} onSave={crypto => { setCryptos(cryptos.map(c => c.id === crypto.id ? crypto : c)); setEditCryptoOpen(false); }} />
      <GiveBonusModal isOpen={giveBonusOpen} onClose={() => setGiveBonusOpen(false)} user={selectedUser} onBonusAdded={() => { loadData(); setGiveBonusOpen(false); }} />
      {selectedUser && (
        <DeductBalanceModal userId={selectedUser.id} isOpen={deductBalanceOpen} onClose={() => { setDeductBalanceOpen(false); loadData(); }} onOpenChange={setDeductBalanceOpen} />
      )}

      {/* Vendor Wallet Modals */}
      <CreateVendorWalletModal 
        isOpen={createVendorWalletOpen} 
        onClose={() => setCreateVendorWalletOpen(false)} 
        onCreated={loadData} 
      />
      {selectedVendorWallet && (
        <EditVendorWalletModal 
            wallet={selectedVendorWallet} 
            isOpen={editVendorWalletOpen} 
            onClose={() => setEditVendorWalletOpen(false)} 
            onUpdated={loadData} 
        />
      )}

      <ViewReceiptModal 
        transactionId={receiptId} 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
      />
    </div>
  );
};

export default Admin;
