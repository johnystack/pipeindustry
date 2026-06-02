import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { User, Referral, CommissionEarning } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Users,
  Copy,
  Share2,
  DollarSign,
  TrendingUp,
  Gift,
  Award,
  Wallet,
  CheckCircle,
} from "lucide-react";

const Referrals = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [referralStats, setReferralStats] = useState({
    total_referrals: 0,
    active_referrals: 0,
    total_earned: 0,
    currentLevel: "Level 0",
    currentPercent: 0,
    nextTierReq: 2,
  });
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([]);
  const [commissionEarnings, setCommissionEarnings] = useState<CommissionEarning[]>([]);

  const handleWithdrawReferrals = async () => {
    if (!profile || profile.referral_earnings <= 0) {
      toast({
        title: "No earnings to withdraw",
        description: "You do not have any referral earnings to withdraw.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('claim_referral_earnings', { p_user_id: user.id });

      if (error) throw error;

      if (data.success) {
        // Calculate new balance locally for instant UI update
        const claimedAmount = profile.referral_earnings;
        const newWithdrawableBalance = (profile.withdrawable_balance || 0) + claimedAmount;
        
        setProfile({
          ...profile,
          withdrawable_balance: newWithdrawableBalance,
          referral_earnings: 0,
        });

        toast({
          title: "Withdrawal successful",
          description: `Your referral earnings of ₦${claimedAmount.toLocaleString()} have been added to your withdrawable balance.`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error withdrawing earnings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const { toast } = useToast();

  const fetchReferralPageData = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase.rpc('get_referral_data', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching referral data:', error);
      } else {
        setProfile(data.profile);
        setReferralStats(data.referral_stats);
        setRecentReferrals(data.recent_referrals || []);
        setCommissionEarnings(data.commission_earnings || []);
      }
    }
  }, [user]);

  const refreshData = () => {
    fetchReferralPageData();
  };

  useEffect(() => {
    fetchReferralPageData();
  }, [fetchReferralPageData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const commissionStructure = [
    {
      level: "Level 1",
      requirement: "2 Referrals",
      percentage: "5%",
      description: "Direct referral commission",
      color: "bg-blue-500",
    },
    {
      level: "Level 2",
      requirement: "3-5 Referrals",
      percentage: "10%",
      description: "Increased commission tier",
      color: "bg-emerald-500",
    },
    {
      level: "Level 3",
      requirement: "6-8 Referrals",
      percentage: "15%",
      description: "Advanced referral rewards",
      color: "bg-purple-500",
    },
    {
      level: "Level 4",
      requirement: "9+ Referrals",
      percentage: "20%",
      description: "Elite partner commission",
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-background to-background p-6 md:p-8 rounded-2xl md:rounded-[2rem] border-2 border-primary/5 shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic">Referral Program</h1>
          <p className="text-muted-foreground text-[10px] md:text-sm font-bold opacity-60 uppercase tracking-wide">
            Earn tiered commissions based on your network of direct referrals.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-slate-900/50 border border-white/5 shadow-lg rounded-2xl overflow-hidden relative group hover:bg-white/[0.02] transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform hidden sm:block">
            <Users className="h-12 w-12 text-blue-500" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-5 pt-4 md:pt-5">
            <CardTitle className="text-[7px] md:text-[9px] uppercase font-black text-muted-foreground tracking-widest truncate">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5">
            <div className="text-xl md:text-3xl font-black tracking-tighter italic">
              {referralStats.total_referrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border border-white/5 shadow-lg rounded-2xl overflow-hidden relative group hover:bg-white/[0.02] transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform hidden sm:block">
            <TrendingUp className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-5 pt-4 md:pt-5">
            <CardTitle className="text-[7px] md:text-[9px] uppercase font-black text-muted-foreground tracking-widest truncate">Active Referrals</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5">
            <div className="text-xl md:text-3xl font-black tracking-tighter italic">
              {referralStats.active_referrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-2 border-emerald-500/20 shadow-[0_0_25px_-5px_rgba(16,185,129,0.1)] rounded-2xl overflow-hidden relative group hover:bg-emerald-500/[0.02] transition-all">
          <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
            <DollarSign className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-5 pt-4 md:pt-5 relative z-10">
            <CardTitle className="text-[7px] md:text-[9px] uppercase font-black text-emerald-500 tracking-widest truncate">Total Earned</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5 relative z-10">
            <div className="text-xl md:text-3xl font-black tracking-tighter italic text-emerald-500 drop-shadow-sm">
              ₦{(referralStats.total_earned || 0).toLocaleString()}
            </div>
            <Button
              className="mt-3 md:mt-4 w-full h-8 md:h-10 rounded-lg md:rounded-xl font-black uppercase text-[8px] md:text-[10px] tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all gap-1.5 md:gap-2"
              onClick={handleWithdrawReferrals}
              disabled={!profile || (profile.referral_earnings || 0) <= 0}
            >
              <Wallet className="h-3 w-3 md:h-3.5 md:w-3.5" />
              Claim
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border border-primary/20 shadow-lg rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-primary/5 opacity-50" />
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
            <Award className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-5 pt-4 md:pt-5 relative z-10">
            <CardTitle className="text-[7px] md:text-[9px] uppercase font-black text-primary tracking-widest truncate">Current Tier</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-5 pb-4 md:pb-5 relative z-10">
            <div className="text-xl md:text-3xl font-black tracking-tighter italic truncate">{referralStats.currentLevel}</div>
            <div className="mt-1 text-[7px] md:text-[8px] font-black uppercase text-primary/60 tracking-widest italic">
              {referralStats.currentPercent}% SHARE
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="bg-slate-900/50 border border-white/5 shadow-xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-white/5">
          <CardTitle className="text-xl md:text-2xl font-black flex items-center gap-3 italic uppercase tracking-tight">
            <Share2 className="h-5 w-5 text-primary" />
            Referral Gateway
          </CardTitle>
          <CardDescription className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wide opacity-60">
            Share this link to activate new network nodes and earn commissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          {profile?.username ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                value={`${window.location.origin}/ref/${profile?.username}`}
                readOnly
                className="flex-1 h-12 rounded-xl bg-background border-2 border-white/5 font-mono text-[10px] md:text-xs text-white/70"
              />
              <Button 
                className="h-12 px-6 rounded-xl font-black uppercase text-xs bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-transform active:scale-95"
                onClick={() => copyToClipboard(`${window.location.origin}/ref/${profile?.username}`)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Gateway
              </Button>
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/10 rounded-2xl border-2 border-dashed border-white/5">
              <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mb-4">Set a username in settings to activate your gateway.</p>
              <Button asChild variant="default" className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary text-white">
                <Link to="/settings">Open Settings</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Structure */}
      <Card className="bg-slate-900/50 border border-white/5 shadow-xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
        <CardHeader className="p-6 md:p-8 border-b border-white/5">
          <CardTitle className="text-xl md:text-2xl font-black flex items-center gap-3 italic uppercase tracking-tight">
            <Gift className="h-5 w-5 text-primary" />
            Reward Structure
          </CardTitle>
          <CardDescription className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wide opacity-60">
            Scale your earnings as your direct network expands.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {commissionStructure.map((level, index) => {
              const isActive = referralStats.currentLevel === level.level;
              return (
                <div key={index} className={cn(
                  "text-center space-y-3 p-5 md:p-6 rounded-2xl border transition-all duration-300",
                  isActive ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "bg-slate-950/50 border-white/5"
                )}>
                  <div
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mx-auto shadow-lg transition-transform duration-300",
                      isActive ? "bg-primary text-white scale-110" : "bg-slate-900 text-muted-foreground"
                    )}
                  >
                    <span className="font-black text-lg italic">
                      {level.percentage}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-xs md:text-sm tracking-tight uppercase italic">{level.level}</h3>
                    <p className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground/60 mt-0.5 tracking-widest">{level.requirement}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-5 md:p-6 bg-slate-950/50 rounded-2xl border border-white/5">
            <h4 className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4 text-primary italic">Expansion Progress</h4>
            {referralStats.nextTierReq > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground/60">
                    Need <span className="text-white">{referralStats.nextTierReq - referralStats.active_referrals}</span> more nodes for Level {parseInt(referralStats.currentLevel.split(' ')[1] || '0') + 1}
                  </span>
                  <span>{referralStats.active_referrals} / {referralStats.nextTierReq}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                   <div 
                    className="h-full bg-primary transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary),0.4)]" 
                    style={{ width: `${Math.min(100, (referralStats.active_referrals / referralStats.nextTierReq) * 100)}%` }} 
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500">
                <Award className="h-4 w-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Maximum Elite Tier Achieved</p>
              </div>
            )}
            
            <div className="mt-6 flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-emerald-500/80 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
              <CheckCircle className="h-3 w-3" />
              Only direct node activations generate yield &bull; Instant settlements applied
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Tabs defaultValue="referrals" className="space-y-6">
        <TabsList className="bg-slate-950/50 p-1 rounded-xl h-auto w-fit border border-white/5 mx-auto md:mx-0 flex">
          <TabsTrigger value="referrals" className="rounded-lg gap-2 py-2.5 px-5 font-black uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-primary transition-all italic">
            <Users className="h-3.5 w-3.5" />
            Network
          </TabsTrigger>
          <TabsTrigger value="earnings" className="rounded-lg gap-2 py-2.5 px-5 font-black uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-emerald-600 transition-all italic">
            <DollarSign className="h-3.5 w-3.5" />
            Yield Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="outline-none">
          <Card className="bg-slate-900/50 border border-white/5 shadow-xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 md:p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg md:text-xl font-black uppercase italic tracking-tight">Recent Nodes</CardTitle>
                <CardDescription className="text-[9px] md:text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">Track your direct expansion network activity</CardDescription>
              </div>
              <Button onClick={refreshData} variant="outline" className="h-9 px-4 rounded-lg font-black uppercase text-[10px] border-white/10 hover:bg-white/5 transition-all">Refresh</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {recentReferrals.length > 0 ? recentReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-5 md:p-6 hover:bg-white/[0.01] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/10 italic">
                        {referral.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-black text-white text-xs md:text-sm uppercase italic">{referral.name}</h4>
                        <p className="text-[8px] md:text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-40">
                          {new Date(referral.joinDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1.5">
                      <Badge
                        className={cn(
                          "font-black px-2.5 py-0.5 text-[8px] tracking-widest uppercase italic",
                          referral.status === "Active" ? "bg-emerald-500 text-white" : "bg-slate-800 text-muted-foreground"
                        )}
                      >
                        {referral.status}
                      </Badge>
                      <div className="text-[9px] md:text-[10px] font-black italic space-x-3">
                        <span className="opacity-40 uppercase tracking-tighter">Vol: {referral.invested}</span>
                        <span className="text-emerald-500">Yield: {referral.commission}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 opacity-20 italic">
                    <Users className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No nodes detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="outline-none">
          <Card className="bg-slate-900/50 border border-white/5 shadow-xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 md:p-8 border-b border-white/5">
              <CardTitle className="text-lg md:text-xl font-black uppercase italic tracking-tight">Yield History</CardTitle>
              <CardDescription className="text-[9px] md:text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">Protocol-wide commission distribution logs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {commissionEarnings.length > 0 ? commissionEarnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-5 md:p-6 hover:bg-white/[0.01] transition-all group"
                  >
                    <div className="space-y-1">
                      <h4 className="font-black text-white text-xs md:text-sm uppercase italic">{earning.description}</h4>
                      <p className="text-[8px] text-muted-foreground font-mono opacity-40 uppercase">{earning.reference}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-emerald-500 font-black text-base md:text-lg italic tracking-tighter">
                      +₦{earning.amount.toLocaleString()}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 opacity-20 italic">
                    <DollarSign className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No yield recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Referrals;
