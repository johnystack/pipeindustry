import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { User, Investment, StatsData, Transaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  Briefcase,
  Gem,
} from "lucide-react";

const Dashboard = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [statsData, setStatsData] = useState<StatsData>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const { data, error } = await supabase.rpc('get_dashboard_data', { p_user_id: user.id });

        if (error) {
          console.error('Error fetching dashboard data:', error);
        } else {
          setProfile(data.profile);
          setInvestments(data.investments || []);
          setRecentTransactions(data.recent_transactions || []);

          const activeInvestments = (data.investments || []).filter(
            (investment: Investment) => investment.status === 'active'
          );

          const totalBalance = activeInvestments.reduce(
            (acc: number, investment: Investment) => acc + investment.amount,
            0
          );

          const activeInvestmentsCount = activeInvestments.length;

          const completedInvestments = (data.investments || []).filter((investment: Investment) =>
            ['completed', 'withdrawn'].includes(
              investment.status.trim().toLowerCase()
            )
          );

          const totalEarnings =
            completedInvestments.reduce(
              (acc: number, investment: Investment) => acc + Number(investment.return),
              0
            ) || 0;

          setStatsData({
            totalBalance,
            activeInvestments: activeInvestmentsCount,
            totalEarnings,
            withdrawableBalance: data.profile.withdrawable_balance,
            referralEarnings: data.profile.referral_earnings,
          });
        }
      }
    };

    fetchData();
  }, [user]);

  const calculateProgress = (investment: Investment) => {
    if (investment.status !== "active" || !investment.approved_at) {
      return { progress: 0, days_left: 24 };
    }

    const approvedAt = new Date(investment.approved_at);
    const now = new Date();
    const daysPassed = Math.floor(
      (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const duration = 24;
    const progress = Math.min(Math.floor((daysPassed / duration) * 100), 100);
    const daysLeft = Math.max(duration - daysPassed, 0);

    return { progress, days_left: daysLeft };
  };

  return (
    <div className="container mx-auto p-6 space-y-10">
      {/* Premium Welcome Header */}
      <div className="flex items-center justify-between gap-6 bg-gradient-to-r from-primary/20 via-background to-background p-8 rounded-3xl border-2 border-primary/10 shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight">
            Greetings, {profile?.first_name || "Investor"}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Your portfolio is currently looking <span className="text-emerald-500 font-bold">sharp</span>.
          </p>
        </div>
        <div className="flex gap-3">
            {role === 'vendor' && (
                <Link to="/vendor-dashboard">
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-2 gap-2">
                        <Briefcase className="h-4 w-4" />
                        Vendor Hub
                    </Button>
                </Link>
            )}
            <Link to="/invest-now">
                <Button className="h-12 px-8 rounded-xl bg-gradient-primary text-primary-foreground shadow-xl shadow-primary/20 font-bold gap-2">
                    <TrendingUp className="h-4 w-4" />
                    New Investment
                </Button>
            </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-8">
        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                <Wallet className="h-24 w-24" />
            </div>
            <CardHeader>
                <CardTitle className="text-slate-400 uppercase text-xs font-black tracking-widest">Total Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-5xl font-black tracking-tighter">
                    ₦{statsData.totalBalance?.toLocaleString() || "0.00"}
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-3 py-1 rounded-full">
                    <ArrowUpRight className="h-4 w-4" />
                    +12.5% this month
                </div>
            </CardContent>
        </Card>

        {/* Withdrawable Card */}
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-none shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                <DollarSign className="h-24 w-24" />
            </div>
            <CardHeader>
                <CardTitle className="text-emerald-100 uppercase text-xs font-black tracking-widest">Withdrawable Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-5xl font-black tracking-tighter">
                    ₦{statsData.withdrawableBalance?.toLocaleString() || "0.00"}
                </div>
                <Link to="/withdraw">
                    <Button variant="secondary" className="w-full font-bold bg-white text-emerald-700 hover:bg-emerald-50">
                        Withdraw Now
                    </Button>
                </Link>
            </CardContent>
        </Card>

        {/* Secondary Stats Column */}
        <div className="grid grid-cols-1 gap-4">
            <Card className="bg-muted/30 border-2 shadow-sm">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Active Trades</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-black">{statsData.activeInvestments || 0}</div>
                </CardContent>
            </Card>
            <Card className="bg-muted/30 border-2 shadow-sm">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Referral Bonus</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-black text-primary">₦{statsData.referralEarnings?.toLocaleString() || "0.00"}</div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Main Interactive Section */}
      <div className="grid grid-cols-3 gap-10">
        {/* Left: Active Investments */}
        <div className="col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Portfolio Progress
                </h2>
                <Link to="/invest" className="text-primary font-bold text-sm hover:underline">View all plans</Link>
            </div>

            <div className="space-y-4">
                {investments.length > 0 ? (
                    investments.map((investment, index) => {
                        const { progress, days_left } = calculateProgress(investment);
                        return (
                            <Card key={index} className="border-2 hover:shadow-xl transition-all group overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg group-hover:rotate-12 transition-transform">
                                                    <Gem className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg">{investment.plan_name}</h3>
                                                    <Badge variant="secondary" className="text-[10px] uppercase font-black">{investment.status}</Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                                                    <span>Growth Progress</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2 bg-muted" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-10">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-black text-muted-foreground">Invested</p>
                                                <p className="text-xl font-black">₦{investment.amount.toLocaleString()}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-black text-muted-foreground">Days Left</p>
                                                <p className="text-xl font-black text-primary">{days_left}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                                                <ArrowUpRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-bold">No active investments found.</p>
                        <Link to="/invest-now">
                            <Button variant="link" className="mt-2">Start your first trade</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Live Feed
            </h2>
            <Card className="border-2 shadow-xl h-[500px] overflow-hidden">
                <CardContent className="p-0">
                    <div className="divide-y overflow-y-auto h-full scrollbar-hide">
                        {recentTransactions.map((tx, i) => (
                            <div key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                        {tx.type === 'deposit' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black capitalize">{tx.type}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">{new Date(tx.created_at || "").toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {tx.type === 'deposit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                    </p>
                                    <Badge variant="outline" className="text-[8px] h-4 uppercase font-bold">{tx.status}</Badge>
                                </div>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="py-20 text-center italic text-muted-foreground text-sm">
                                No recent activity.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
