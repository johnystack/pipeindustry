import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar
} from "lucide-react";


const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  

  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);

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
          setTransactions(data);
        }
      }
    };

    fetchTransactions();
  }, [user]);

  const summary = {
    totalDeposits: transactions
      .filter((t) => t.type === "deposit" && t.status === "completed")
      .reduce((acc, t) => acc + t.amount, 0)
      .toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    totalWithdrawals: transactions
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .reduce((acc, t) => acc + t.amount, 0)
      .toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    totalProfits: transactions
      .filter((t) => t.type === "profit" && t.status === "completed")
      .reduce((acc, t) => acc + t.amount, 0)
      .toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    totalInvestments: transactions
      .filter((t) => t.type === "investment" && t.status === "completed")
      .reduce((acc, t) => acc + t.amount, 0)
      .toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "investment":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case "deposit":
        return <ArrowUpFromLine className="h-4 w-4 text-success" />;
      case "withdrawal":
        return <ArrowDownToLine className="h-4 w-4 text-warning" />;
      case "profit":
        return <DollarSign className="h-4 w-4 text-success" />;
      case "referral":
        return <Users className="h-4 w-4 text-accent" />;
      case "bonus":
        return <Award className="h-4 w-4 text-accent" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "status-completed",
      pending: "status-pending", 
      processing: "status-active",
      failed: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return variants[status as keyof typeof variants] || "bg-muted";
  };

  

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = (transaction.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (transaction.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || transaction.type === filterType;
      const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, filterType, filterStatus]);

  return (
    <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Transaction History
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            View and manage all your account transactions including deposits, withdrawals, investments, and earnings.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="crypto-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deposits</p>
                  <p className="text-2xl font-bold text-success">{summary.totalDeposits}</p>
                </div>
                <ArrowUpFromLine className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="crypto-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                  <p className="text-2xl font-bold text-warning">{summary.totalWithdrawals}</p>
                </div>
                <ArrowDownToLine className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="crypto-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profits</p>
                  <p className="text-2xl font-bold text-success">{summary.totalProfits}</p>
                </div>
                <DollarSign className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="crypto-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Investments</p>
                  <p className="text-2xl font-bold text-primary">{summary.totalInvestments}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="investment">Investments</SelectItem>
                    <SelectItem value="profit">Profits</SelectItem>
                    <SelectItem value="referral">Referrals</SelectItem>
                    <SelectItem value="bonus">Bonuses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} of {transactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted/50">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.reference} • {transaction.date}
                        </div>
                        {transaction.fee !== "$0.00" && (
                          <div className="text-xs text-muted-foreground">
                            Fee: {transaction.fee}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-bold ${
                        transaction.amount > 0 ? 'text-success' : 'text-warning'
                      }`}>
                        {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </div>
                      <Badge variant="outline" className={getStatusBadge(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found matching your filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
};

export default Transactions;