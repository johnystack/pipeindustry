import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { User, Investment, StatsData, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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
  Coins,
  Loader2,
  Calendar,
  CircleDollarSign,
  RefreshCcw,
  LayoutGrid,
} from "lucide-react";

const Dashboard = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<User | null>(null);
  const [statsData, setStatsData] = useState<StatsData>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

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
          (acc: number, investment: Investment) => acc + (investment.amount * 1.5),
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
            (acc: number, investment: Investment) => acc + Number(investment.return || 0),
            0
          ) || 0;

        setStatsData({
          totalBalance,
          activeInvestments: activeInvestmentsCount,
          totalEarnings,
          withdrawableBalance: Math.max(0, data.profile.withdrawable_balance || 0),
          referralEarnings: Math.max(0, data.profile.referral_earnings || 0),
        });
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClaim = async (investmentId: string) => {
    setClaiming(investmentId);
    try {
      const { data, error } = await supabase.rpc('claim_investment_assets', { p_investment_id: investmentId });
      
      if (error) throw error;

      if (data.success) {
        toast({ title: "Claim Successful", description: data.message });
        await fetchData();
      } else {
        toast({ title: "Claim Failed", description: data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setClaiming(null);
    }
  };

  const calculateInvestmentStats = (inv: Investment) => {
    if (inv.status === 'pending' || !inv.approved_at) return {
      daysPassed: 0,
      progress: 0,
      totalValue: inv.amount,
      accumulated: 0,
      claimable: 0,
      nextClaimDays: 4,
      claimStage: 0
    };

    const start = new Date(inv.approved_at).getTime();
    const now = Date.now();
    const diff = now - start;
    const daysPassed = Math.min(24, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const progress = (daysPassed / 24) * 100;
    
    const totalExpectedReturn = inv.amount * 1.5;
    const accumulatedValue = (totalExpectedReturn * (daysPassed / 24));
    
    // --- AMENDED STRICT MILESTONE LOGIC ---
    // Payouts occur ONLY on: Day 4, 8, 12, 16, 20, 24
    const milestonesReached = Math.floor(daysPassed / 4); 
    const stagesActuallyClaimed = Math.floor((inv.claimed_amount || 0) / (inv.amount * 0.25));
    
    // A claim is ONLY available if we have reached a NEW milestone we haven't paid out yet
    const claimable = milestonesReached > stagesActuallyClaimed ? (inv.amount * 0.25) : 0;
    
    // Calculate the exact day of the next milestone
    const nextMilestoneDay = (milestonesReached + 1) * 4;
    const nextClaimDays = nextMilestoneDay > 24 ? 0 : nextMilestoneDay - daysPassed;
    // ---------------------------------------

    return {
      daysPassed,
      progress,
      totalValue: totalExpectedReturn,
      accumulated: accumulatedValue,
      claimable,
      nextClaimDays: claimable > 0 ? 0 : nextClaimDays,
      claimStage: Math.min(6, stagesActuallyClaimed)
    };
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Smart Welcome Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 bg-slate-900/40 p-4 md:p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <LayoutGrid className="h-24 w-24" />
        </div>
        <div className="space-y-1 text-center md:text-left relative z-10">
          <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase italic leading-none">
            Welcome, <span className="text-primary">{profile?.first_name || "Chief"}</span>
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            Market ID: {user?.id.slice(0, 8)} • System <span className="text-emerald-500">Live</span>
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto relative z-10">
            {role === 'vendor' && (
                <Link to="/vendor-dashboard" className="flex-1 md:flex-none">
                    <Button variant="outline" className="h-9 md:h-10 w-full px-4 rounded-xl border border-white/10 gap-2 text-[8px] md:text-[9px] font-black uppercase">
                        <Briefcase className="h-3 w-3" /> Hub
                    </Button>
                </Link>
            )}
            <Link to="/invest-now" className="flex-1 md:flex-none">
                <Button className="h-9 md:h-10 w-full px-5 rounded-xl bg-primary text-white shadow-lg shadow-primary/10 font-black gap-2 text-[8px] md:text-[9px] uppercase">
                    <TrendingUp className="h-3 w-3" /> New Trade
                </Button>
            </Link>
        </div>
      </div>

      {/* Balanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Market Value */}
        <Card className="bg-slate-900/60 border border-white/5 rounded-2xl relative group overflow-hidden">
            <CardHeader className="p-4 pb-0">
                <CardTitle className="text-muted-foreground uppercase text-[8px] font-black tracking-[0.2em] flex items-center gap-2">
                    <TrendingUp className="h-2.5 w-2.5" /> Market Value
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="text-2xl md:text-3xl font-black tracking-tighter italic">
                    ₦{statsData.totalBalance?.toLocaleString() || "0"}
                </div>
            </CardContent>
            <div className="absolute -bottom-2 -right-2 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Coins className="h-12 w-12" />
            </div>
        </Card>

        {/* Liquid Assets */}
        <Card className="bg-emerald-600 border-none rounded-2xl relative group overflow-hidden shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <CardHeader className="p-4 pb-0 relative z-10">
                <CardTitle className="text-emerald-50 text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Wallet className="h-2.5 w-2.5" /> Liquid Assets
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3 relative z-10">
                <div className="text-2xl md:text-3xl font-black tracking-tighter italic text-white leading-none drop-shadow-md">
                    ₦{statsData.withdrawableBalance?.toLocaleString() || "0"}
                </div>
                <Link to="/withdraw">
                    <Button variant="secondary" className="h-8 w-full text-[8px] font-black uppercase tracking-widest bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-0 shadow-lg">
                        Liquidate
                    </Button>
                </Link>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className="h-20 w-20 text-white" />
            </div>
        </Card>

        {/* Active Positions */}
        <Card className="bg-slate-900/40 border border-white/5 shadow-sm p-4 flex flex-col justify-center rounded-2xl group hover:bg-white/[0.01] transition-all">
            <p className="text-[7px] md:text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest mb-1 italic">Active Positions</p>
            <p className="text-2xl md:text-3xl font-black italic group-hover:text-primary transition-colors">{statsData.activeInvestments || 0}</p>
        </Card>

        {/* Referral Yield */}
        <Card className="bg-slate-950 border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.1)] p-4 flex flex-col justify-center rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
            <p className="text-[7px] md:text-[9px] uppercase font-black text-primary/60 tracking-widest mb-1 italic relative z-10">Referral Yield</p>
            <p className="text-2xl md:text-3xl font-black text-primary italic relative z-10 drop-shadow-sm transition-all group-hover:scale-105">
                ₦{statsData.referralEarnings?.toLocaleString() || "0"}
            </p>
            <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="h-16 w-16 text-primary" />
            </div>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        {/* Left: Portfolio */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg md:text-xl font-black flex items-center gap-2 uppercase tracking-tighter italic">
                    <Gem className="h-5 w-5 text-primary" />
                    Portfolio Progress
                </h2>
                <Link to="/invest" className="text-primary font-black text-[9px] uppercase tracking-widest hover:opacity-70 transition-opacity">Market Floor</Link>
            </div>

            <div className="space-y-4">
                {investments.length > 0 ? (
                    investments.map((inv, index) => {
                        const stats = calculateInvestmentStats(inv);
                        const isCompleted = inv.status === 'completed';
                        return (
                            <Card 
                                key={index} 
                                className={cn(
                                    "bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl relative group transition-all hover:border-primary/20",
                                    isCompleted ? "border-emerald-500/20 bg-emerald-500/[0.01]" : ""
                                )}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                                
                                <CardContent className="p-4 md:p-6 space-y-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm md:text-base font-black uppercase tracking-tighter italic truncate">{inv.plan_name}</h3>
                                                <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary px-1.5 py-0">Stage {stats.claimStage}/6</Badge>
                                            </div>
                                            <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                <Calendar className="h-2 w-2" /> Start: {new Date(inv.created_at || "").toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge className={cn(
                                            "font-black text-[7px] md:text-[8px] px-2 py-0.5 rounded-md tracking-tighter uppercase shrink-0",
                                            inv.status === 'active' ? "bg-emerald-600" : 
                                            inv.status === 'pending' ? "bg-amber-600" : "bg-slate-700"
                                        )}>
                                            {inv.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 py-1">
                                        {[
                                            { label: 'Capital', val: inv.amount, color: 'text-white' },
                                            { label: 'Target', val: inv.amount * 1.5, color: 'text-emerald-500' },
                                            { label: 'Claimed', val: inv.claimed_amount || 0, color: 'text-purple-500' },
                                            { label: 'Matured', val: Math.floor(stats.accumulated), color: 'text-cyan-500' }
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-0.5">
                                                <p className="text-[6px] md:text-[7px] font-black text-muted-foreground uppercase">{item.label}</p>
                                                <p className={cn("text-xs md:text-sm font-black italic", item.color)}>₦{item.val.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {inv.status === 'active' && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-muted-foreground">{stats.daysPassed}/24 Cycle</p>
                                                {stats.nextClaimDays > 0 && (
                                                    <p className="text-[6px] md:text-[7px] font-black uppercase text-primary/50 italic">Claim in {stats.nextClaimDays} Days</p>
                                                )}
                                            </div>
                                            <Progress value={stats.progress} className="h-1 bg-slate-950" />
                                        </div>
                                    )}

                                    {inv.status === 'active' && (
                                        <Button 
                                            onClick={() => handleClaim(inv.id)}
                                            disabled={stats.claimable <= 0 || !!claiming}
                                            className={cn(
                                                "w-full h-10 font-black text-[8px] md:text-[9px] tracking-[0.1em] rounded-xl uppercase italic transition-all",
                                                stats.claimable > 0 
                                                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20" 
                                                    : "bg-slate-800 opacity-40 cursor-not-allowed"
                                            )}
                                        >
                                            {claiming === inv.id ? (
                                                <RefreshCcw className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <>
                                                    <CircleDollarSign className="h-3 w-3 md:h-3.5 md:w-3.5 mr-2" />
                                                    {stats.claimable > 0 ? `CLAIM ₦${stats.claimable.toLocaleString()}` : "MATURING"}
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {isCompleted && (
                                        <div className="w-full p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-center">
                                            <p className="text-[8px] md:text-[9px] font-black tracking-widest uppercase italic">WITHDRAWAL COMPLETE</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="py-16 text-center bg-slate-950/50 rounded-2xl border border-dashed border-white/5">
                        <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground font-black uppercase text-[8px] md:text-[10px] tracking-widest">No active positions detected.</p>
                        <Link to="/invest-now">
                            <Button variant="link" className="mt-2 text-primary font-bold text-[10px] uppercase italic">Start Trade</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="space-y-4 md:space-y-6">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2 uppercase tracking-tighter italic text-white/30 px-1">
                <Clock className="h-5 w-5 md:h-6 md:w-6" />
                Live Feed
            </h2>
            <Card className="bg-slate-950/50 border border-white/5 shadow-xl h-[400px] md:h-[500px] overflow-hidden rounded-[2rem]">
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5 overflow-y-auto h-full scrollbar-hide">
                        {recentTransactions.map((tx, i) => (
                            <div key={i} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                        tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 
                                        tx.type === 'profit' ? 'bg-primary/10 text-primary' :
                                        'bg-orange-500/10 text-orange-500'
                                    }`}>
                                        {tx.type === 'deposit' ? <ArrowUpRight className="h-3 w-3" /> : 
                                         tx.type === 'profit' ? <Coins className="h-3 w-3" /> :
                                         <ArrowDownRight className="h-3 w-3" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] md:text-[11px] font-black uppercase italic truncate">{tx.type}</p>
                                        <p className="text-[7px] md:text-[8px] text-muted-foreground font-bold uppercase">{new Date(tx.created_at || "").toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-xs md:text-sm font-black italic ${
                                        (tx.type === 'deposit' || tx.type === 'profit') ? 'text-emerald-500' : 'text-orange-500'
                                    }`}>
                                        {(tx.type === 'deposit' || tx.type === 'profit') ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                    </p>
                                    <Badge variant="outline" className="text-[6px] md:text-[7px] h-3 md:h-4 px-1 rounded uppercase font-black border-white/5">{tx.status}</Badge>
                                </div>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="py-20 text-center italic text-muted-foreground/30 font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em]">
                                Quiet Market...
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
