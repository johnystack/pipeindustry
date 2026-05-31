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
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  TrendingUp,
  Users,
  Search,
  Gem,
  Image as ImageIcon,
  ShieldAlert,
  ArrowUpRight,
  RefreshCcw,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Investment {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  crypto: string;
  status: string;
  expected_profit: number;
  daily_return: number;
  duration: number;
  due_date: string;
  payment_proof?: string;
  payment_proof_uploaded_at?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    username?: string;
  };
}

const AdminInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("investments")
        .select(`
          *,
          profiles(first_name, last_name, email, username)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvestments(); }, []);

  const handleAction = async (id: string, status: 'active' | 'denied') => {
    try {
      const updateData: any = { status };
      if (status === 'active') {
        updateData.approved_at = new Date().toISOString();
        updateData.due_date = new Date(new Date().getTime() + 24 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from("investments")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast({ 
        title: status === 'active' ? "Trade Activated" : "Trade Rejected",
        description: `The investment has been successfully ${status === 'active' ? 'approved' : 'rejected'}.`
      });
      fetchInvestments();
    } catch (error: any) {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    }
  };

  const filteredInvestments = investments.filter(inv => 
    inv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = investments.filter(i => i.status === 'pending').length;

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <p className="text-muted-foreground font-black tracking-widest animate-pulse">LOADING MARKET DATA...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase">
                <ShieldAlert className="h-3 w-3" /> System Administrator
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Settlement Control</h1>
            <p className="text-muted-foreground font-medium">Verify incoming capital and authorize market entries.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search traders or assets..." 
            className="pl-12 h-12 w-full md:w-[400px] rounded-2xl bg-slate-900/50 border-2 border-white/5 focus:border-primary/50 transition-all text-lg font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-primary/5 border-2 border-primary/10 rounded-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
              <Clock className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-primary/70 truncate">Awaiting Action</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6"><div className="text-xl md:text-2xl font-black truncate">{pendingCount}</div></CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-emerald-500 hidden sm:block">
              <Zap className="h-12 w-12" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-emerald-600/70 truncate">Live Entries</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6"><div className="text-xl md:text-2xl font-black text-emerald-500 truncate">{investments.filter(i => i.status === 'active').length}</div></CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-2 border-white/5 rounded-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
              <Users className="h-12 w-12" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">Total Traders</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6"><div className="text-xl md:text-2xl font-black truncate">{new Set(investments.map(i => i.user_id)).size}</div></CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-2 border-white/5 rounded-xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform hidden sm:block">
              <ArrowUpRight className="h-12 w-12" />
          </div>
          <CardHeader className="pb-1 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-[7px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">Gross Volume</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6"><div className="text-xl md:text-2xl font-black truncate">₦{investments.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <TabsList className="bg-slate-900/50 border border-white/5 p-1 rounded-2xl h-14 backdrop-blur-xl">
                <TabsTrigger value="pending" className="rounded-xl font-black text-xs px-4 data-[state=active]:bg-primary">QUEUE ({pendingCount})</TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl font-black text-xs px-4 data-[state=active]:bg-slate-700">ARCHIVE</TabsTrigger>
            </TabsList>
            <Button variant="outline" onClick={fetchInvestments} className="h-14 rounded-2xl font-bold gap-2 border-white/5 bg-slate-900/50">
                <RefreshCcw className="h-4 w-4" /> SYNC
            </Button>
        </div>

        <TabsContent value="pending" className="space-y-6 pt-2 outline-none">
          {filteredInvestments.filter(i => i.status === 'pending').map((inv, idx) => (
            <Card key={inv.id} className="group bg-slate-900/40 border-2 border-white/5 hover:border-primary/30 transition-all rounded-[2rem] overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <Gem className="text-primary h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-xl md:text-2xl tracking-tight uppercase italic truncate">{inv.plan_name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm font-bold text-white/80 truncate">{inv.profiles?.username || `${inv.profiles?.first_name} ${inv.profiles?.last_name}`}</p>
                            <div className="h-1 w-1 rounded-full bg-white/20 shrink-0" />
                            <p className="text-xs font-medium text-muted-foreground truncate">{inv.profiles?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <Badge className="font-black text-xl px-6 py-2 bg-slate-950 border-2 border-primary/20 text-primary rounded-2xl">₦{inv.amount.toLocaleString()}</Badge>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">CAPITAL SETTLEMENT</p>
                    </div>
                  </div>

                  {inv.payment_proof && (
                    <div className="bg-slate-950/50 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between border-2 border-white/5 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-left">
                            <span className="text-sm font-black tracking-widest uppercase">Transaction Receipt</span>
                            <p className="text-[10px] text-muted-foreground font-bold">Uploaded {new Date(inv.payment_proof_uploaded_at || "").toLocaleString()}</p>
                        </div>
                      </div>
                      <Button size="lg" variant="secondary" onClick={() => window.open(inv.payment_proof, '_blank')} className="font-black gap-2 h-14 w-full sm:w-auto px-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                        <Eye className="h-5 w-5" /> VERIFY DOCUMENT
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-56 lg:border-l lg:border-white/5 lg:pl-8">
                  <Button onClick={() => handleAction(inv.id, 'active')} className="h-12 flex-1 bg-emerald-600 hover:bg-emerald-500 font-black text-sm tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 gap-2">
                    <CheckCircle className="h-5 w-5" /> AUTHORIZE
                  </Button>
                  <Button onClick={() => handleAction(inv.id, 'denied')} variant="outline" className="h-12 flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 font-black text-sm tracking-widest rounded-2xl gap-2">
                    <XCircle className="h-5 w-5" /> DISCARD
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filteredInvestments.filter(i => i.status === 'pending').length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[3rem] gap-4">
                <CheckCircle className="h-12 w-16 opacity-10" />
                <p className="text-xl font-black uppercase tracking-[0.2em]">Queue Fully Cleared</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 pt-2 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInvestments.filter(i => i.status !== 'pending').map((inv) => (
                <div key={inv.id} className="p-6 border-2 border-white/5 rounded-[2rem] flex items-center justify-between bg-slate-900/30 hover:bg-slate-900/50 transition-colors group">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <TrendingUp className="h-6 w-6 opacity-30" />
                    </div>
                    <div className="min-w-0">
                    <h5 className="font-black text-lg tracking-tight truncate max-w-[140px]">{inv.plan_name}</h5>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate max-w-[140px]">{inv.profiles?.email}</p>
                    </div>
                </div>
                <div className="text-right space-y-2 shrink-0">
                    <span className="block font-black text-lg">₦{inv.amount.toLocaleString()}</span>
                    <Badge variant={inv.status === 'active' ? 'default' : 'destructive'} className={cn(
                        "font-black text-[9px] tracking-widest px-3 py-0.5 rounded-lg",
                        inv.status === 'active' ? "bg-emerald-600/20 text-emerald-500 border border-emerald-500/20" : ""
                    )}>
                    {inv.status.toUpperCase()}
                    </Badge>
                </div>
                </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInvestments;
