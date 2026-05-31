import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Transaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Award,
  DollarSign,
  Filter,
  Download,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ViewReceiptModal from "@/components/receipts/ViewReceiptModal";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Receipt Modal State
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching transactions:", error);
        } else {
          setTransactions(data || []);
        }
      }
    };

    fetchTransactions();
  }, [user]);

  const summary = {
    totalDeposits: transactions
      .filter((t) => t.type === "deposit" && (t.status === "completed" || t.status === "approved"))
      .reduce((acc, t) => acc + t.amount, 0),
    totalWithdrawals: transactions
      .filter((t) => t.type === "withdrawal" && (t.status === "completed" || t.status === "approved"))
      .reduce((acc, t) => acc + t.amount, 0),
    totalProfits: transactions
      .filter((t) => t.type === "profit" && (t.status === "completed" || t.status === "approved"))
      .reduce((acc, t) => acc + t.amount, 0),
    totalInvestments: transactions
      .filter((t) => t.type === "investment" && (t.status === "completed" || t.status === "approved"))
      .reduce((acc, t) => acc + t.amount, 0),
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "investment":
        return <Gem className="h-6 w-6 text-primary" />;
      case "deposit":
        return <ArrowUpRight className="h-6 w-6 text-emerald-500" />;
      case "withdrawal":
        return <ArrowDownRight className="h-6 w-6 text-orange-500" />;
      case "profit":
        return <TrendingUp className="h-6 w-6 text-emerald-500" />;
      case "referral":
        return <Users className="h-6 w-6 text-blue-500" />;
      case "bonus":
        return <Award className="h-6 w-6 text-purple-500" />;
      default:
        return <DollarSign className="h-6 w-6" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500 text-white font-black px-3">COMPLETED</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white font-black px-3">PENDING</Badge>;
      case "processing":
        return <Badge className="bg-blue-500 text-white font-black px-3">PROCESSING</Badge>;
      case "failed":
        return <Badge variant="destructive" className="font-black px-3">FAILED</Badge>;
      default:
        return <Badge variant="secondary" className="font-black px-3">{status.toUpperCase()}</Badge>;
    }
  };

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((t) => {
      const matchesSearch =
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, filterType, filterStatus]);

  return (
    <div className="container mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-primary/10 via-background to-background p-8 rounded-3xl border-2 border-primary/10 shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight uppercase italic">Financial Ledger</h1>
          <p className="text-muted-foreground text-lg uppercase tracking-widest text-[10px] font-bold">
            Track every movement of your capital and profit.
          </p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-xl border-2 gap-2 font-black uppercase text-[10px]">
                <Download className="h-4 w-4" />
                Export CSV
            </Button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl overflow-hidden relative group">
          <CardHeader className="pb-2 px-6 pt-6">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest italic opacity-50">Total Inbound</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 flex items-center justify-between">
            <div className="text-2xl font-black text-emerald-500 italic">₦{summary.totalDeposits.toLocaleString()}</div>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <ArrowUpFromLine className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl overflow-hidden relative group">
          <CardHeader className="pb-2 px-6 pt-6">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest italic opacity-50">Total Outbound</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 flex items-center justify-between">
            <div className="text-2xl font-black text-orange-500 italic">₦{summary.totalWithdrawals.toLocaleString()}</div>
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <ArrowDownToLine className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl overflow-hidden relative group">
          <CardHeader className="pb-2 px-6 pt-6">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest italic opacity-50">Growth Earned</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 flex items-center justify-between">
            <div className="text-2xl font-black text-primary italic">₦{summary.totalProfits.toLocaleString()}</div>
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/30 border-white/10 shadow-xl rounded-3xl overflow-hidden relative group">
          <CardHeader className="pb-2 px-6 pt-6">
            <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest italic opacity-50">Active Stake</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 flex items-center justify-between">
            <div className="text-2xl font-black text-white italic">₦{summary.totalInvestments.toLocaleString()}</div>
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <Gem className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-900/30 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="p-8 border-b border-white/5">
          <CardTitle className="flex items-center gap-3 text-lg font-black uppercase tracking-tight italic">
            <Filter className="h-5 w-5 text-primary" />
            Filter parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Search Records</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Identify transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-12 rounded-xl bg-slate-950 border-white/10 font-bold text-xs uppercase"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Category</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-950 border-white/10 font-black uppercase text-[10px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-slate-950 border-white/10">
                  <SelectItem value="all" className="text-[10px] font-black uppercase">All Types</SelectItem>
                  <SelectItem value="deposit" className="text-[10px] font-black uppercase">Deposits</SelectItem>
                  <SelectItem value="withdrawal" className="text-[10px] font-black uppercase">Withdrawals</SelectItem>
                  <SelectItem value="investment" className="text-[10px] font-black uppercase">Investments</SelectItem>
                  <SelectItem value="profit" className="text-[10px] font-black uppercase">Profits</SelectItem>
                  <SelectItem value="referral" className="text-[10px] font-black uppercase">Referrals</SelectItem>
                  <SelectItem value="bonus" className="text-[10px] font-black uppercase">Bonuses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Withdrawal Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-950 border-white/10 font-black uppercase text-[10px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-slate-950 border-white/10">
                  <SelectItem value="all" className="text-[10px] font-black uppercase">All Status</SelectItem>
                  <SelectItem value="completed" className="text-[10px] font-black uppercase">Completed</SelectItem>
                  <SelectItem value="pending" className="text-[10px] font-black uppercase">Pending</SelectItem>
                  <SelectItem value="processing" className="text-[10px] font-black uppercase">Processing</SelectItem>
                  <SelectItem value="failed" className="text-[10px] font-black uppercase">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Ledger Entries</h2>
            <Badge variant="outline" className="font-black uppercase text-[9px] border-white/10 tracking-widest py-1 px-4">
                {filteredTransactions.length} Verified Records
            </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {filteredTransactions.map((transaction) => {
                const isPositive = ['deposit', 'profit', 'referral', 'bonus'].includes(transaction.type);
                return (
                    <div
                        key={transaction.id}
                        className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-slate-900/30 gap-6 transition-all hover:border-primary/30 group shadow-lg"
                    >
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className="h-14 w-14 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/10 group-hover:rotate-[10deg] transition-transform shrink-0">
                                {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="space-y-1 min-w-0">
                                <p className="font-black text-lg text-white leading-tight uppercase italic truncate">
                                    {transaction.description}
                                </p>
                                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(transaction.created_at || "").toLocaleDateString()}
                                    </span>
                                    <span className="opacity-20">|</span>
                                    <span className="truncate max-w-[140px]">REF: {transaction.reference || transaction.id.slice(0, 12)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center gap-8 lg:w-96 justify-end">
                            <div className="text-right space-y-1 shrink-0">
                                <p className={cn(
                                    "text-2xl font-black tracking-tighter italic",
                                    isPositive ? "text-emerald-500" : "text-orange-500"
                                )}>
                                    {isPositive ? "+" : "-"}₦{transaction.amount.toLocaleString()}
                                </p>
                                {transaction.fee && transaction.fee !== "₦0.00" && (
                                    <p className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Fee: {transaction.fee}</p>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-4 lg:border-l lg:border-white/5 lg:pl-8">
                                {getStatusBadge(transaction.status)}
                                {transaction.type === 'withdrawal' && (transaction.status === 'completed' || transaction.status === 'approved' || transaction.status === 'pending') && (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => { setReceiptId(transaction.id); setIsReceiptOpen(true); }}
                                        className="h-9 px-4 rounded-lg font-black text-[10px] uppercase border-2 italic hover:bg-white hover:text-black transition-all"
                                    >
                                        View Receipt
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {filteredTransactions.length === 0 && (
                <div className="text-center py-32 bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-white/5">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-10" />
                    <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px] italic">Zero Records Detected</p>
                </div>
            )}
        </div>
      </div>

      <ViewReceiptModal 
        transactionId={receiptId} 
        isOpen={isReceiptOpen} 
        onClose={() => setIsReceiptOpen(false)} 
      />
    </div>
  );
};

export default Transactions;
