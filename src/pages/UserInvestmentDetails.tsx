import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { User, Investment } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  User as UserIcon, 
  ArrowLeft, 
  TrendingUp, 
  Gem, 
  CheckCircle, 
  XCircle, 
  Image as ImageIcon, 
  Eye,
  ShieldCheck,
  Calendar,
  Briefcase,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const UserInvestmentDetails = () => {
  const { userId } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setUser(userData);

      const { data: investmentData } = await supabase.from("investments").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      setInvestments(investmentData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);

  const handleAction = async (id: string, status: 'active' | 'denied') => {
    try {
      const updateData: any = { status };
      if (status === 'active') {
        updateData.approved_at = new Date().toISOString();
        updateData.due_date = new Date(new Date().getTime() + 24 * 24 * 60 * 60 * 1000).toISOString();
      }
      const { error } = await supabase.from("investments").update(updateData).eq("id", id);
      if (error) throw error;
      toast({ title: status === 'active' ? "Trade Authorized" : "Trade Discarded" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="text-xs font-black tracking-widest text-muted-foreground uppercase">Syncing Portfolio...</p>
    </div>
  );
  if (!user) return <div className="p-20 text-center font-black text-muted-foreground uppercase tracking-widest">User Profile Not Found</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border-2 border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="h-24 w-24 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10 group overflow-hidden">
              <UserIcon className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter">{user.first_name} {user.last_name}</h1>
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-black px-3 py-0.5 rounded-lg text-[10px] tracking-widest">{user.role?.toUpperCase()}</Badge>
            </div>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> {user.email}
            </p>
          </div>
        </div>
        <Link to="/admin">
            <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 bg-white/5 font-black gap-2 hover:bg-white/10 transition-all">
                <ArrowLeft className="h-4 w-4" /> BACK TO CONSOLE
            </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 border-2 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Settled Balance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-black text-emerald-500 tracking-tighter">₦{user.withdrawable_balance?.toLocaleString() || "0.00"}</div>
            </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-2 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Market Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-black tracking-tighter">{investments.length} <span className="text-lg text-muted-foreground font-bold">Positions</span></div>
            </CardContent>
        </Card>
        <Card className="bg-slate-900/40 border-2 border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Active Entries</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-black text-primary tracking-tighter">{investments.filter(i => i.status === 'active').length}</div>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
            <Briefcase className="h-7 w-7 text-primary" /> TRADING INVENTORY
        </h2>
        
        <div className="grid grid-cols-1 gap-6">
          {investments.map((inv, i) => (
            <Card key={inv.id} className="group overflow-hidden border-2 border-white/5 bg-slate-900/40 rounded-[2.5rem] backdrop-blur-xl animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="p-8 md:p-10 flex flex-col lg:flex-row justify-between gap-10 items-stretch lg:items-center">
                <div className="flex-1 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-black/20">
                            <Gem className="text-primary h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tighter uppercase italic">{inv.plan_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">POSITION OPENED: {new Date(inv.created_at || "").toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    <Badge variant={inv.status === 'active' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'} className={cn(
                        "font-black px-6 py-1.5 rounded-xl text-[10px] tracking-[0.2em]",
                        inv.status === 'active' ? "bg-emerald-600/20 text-emerald-500 border border-emerald-500/20" : 
                        inv.status === 'pending' ? "bg-primary/20 text-primary border border-primary/20" : ""
                    )}>
                      {inv.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 text-center sm:text-left">
                      <p className="text-[10px] text-muted-foreground font-black mb-1 uppercase tracking-widest opacity-50">Allocated Capital</p>
                      <p className="text-2xl font-black tracking-tighter">₦{inv.amount.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 text-center sm:text-left">
                      <p className="text-[10px] text-muted-foreground font-black mb-1 uppercase tracking-widest opacity-50">Yield Forecast</p>
                      <p className="text-2xl font-black text-emerald-500 tracking-tighter">₦{(inv.amount * 1.5).toLocaleString()}</p>
                    </div>
                  </div>

                  {inv.payment_proof && (
                    <div className="bg-slate-950/80 p-6 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-widest">Proof of Settlement</p>
                                <p className="text-[10px] text-muted-foreground font-medium italic mt-0.5">Click to verify transaction details</p>
                            </div>
                        </div>
                        <Button variant="secondary" size="lg" className="w-full sm:w-auto h-14 px-10 rounded-2xl font-black tracking-widest gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all" onClick={() => window.open(inv.payment_proof || "", '_blank')}>
                            <Eye className="h-5 w-5" /> VIEW RECEIPT
                        </Button>
                    </div>
                  )}
                </div>

                {inv.status === 'pending' ? (
                  <div className="lg:w-56 flex flex-col justify-center gap-4 lg:border-l lg:border-white/5 lg:pl-10">
                    <Button onClick={() => handleAction(inv.id, 'active')} className="h-16 w-full bg-emerald-600 hover:bg-emerald-500 font-black tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-500/10 gap-2">
                        <CheckCircle className="h-4 w-4" /> AUTHORIZE
                    </Button>
                    <Button onClick={() => handleAction(inv.id, 'denied')} variant="outline" className="h-16 w-full border-destructive/20 text-destructive hover:bg-destructive/10 font-black tracking-widest text-xs rounded-2xl gap-2">
                        <XCircle className="h-4 w-4" /> DISCARD
                    </Button>
                  </div>
                ) : (
                  <div className="lg:w-64 flex flex-col justify-center gap-4 lg:border-l lg:border-white/5 lg:pl-10">
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase opacity-50">Operation Log</p>
                        <div className={cn(
                            "p-6 rounded-[2rem] border-2 text-center flex flex-col items-center justify-center gap-2 shadow-2xl shadow-black/20",
                            inv.status === 'active' ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500" : "border-white/5 bg-slate-950/50 text-muted-foreground"
                        )}>
                            {inv.status === 'active' ? <Zap className="h-6 w-6 fill-emerald-500 animate-pulse" /> : <ShieldCheck className="h-6 w-6 opacity-30" />}
                            <span className="font-black text-xs tracking-[0.2em] uppercase italic">{inv.status === 'active' ? 'MARKET LIVE' : 'CLOSED / REJECTED'}</span>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {investments.length === 0 && (
              <div className="text-center py-40 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                <Briefcase className="h-20 w-20 mx-auto mb-4" />
                <p className="text-xl font-black uppercase tracking-[0.3em]">No Active Trades Found</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInvestmentDetails;
