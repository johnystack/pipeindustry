import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { 
  UserPlus, 
  TrendingUp, 
  ArrowUpRight, 
  Wallet, 
  PlusCircle,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityEvent {
  id: string;
  type: 'registration' | 'investment' | 'claim' | 'cashout' | 'vendor_plan';
  user_name: string;
  amount?: number;
  plan_name?: string;
  timestamp: string;
}

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const fetchActivities = async () => {
    try {
      const [
        signupsRes,
        investmentsRes,
        transactionsRes,
        plansRes
      ] = await Promise.allSettled([
        supabase.from('profiles').select('id, username, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('investments').select('id, amount, plan_name, profiles(username), created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(10),
        supabase.from('transactions').select('id, type, amount, profiles(username), created_at').in('type', ['withdrawal', 'profit', 'referral']).order('created_at', { ascending: false }).limit(10),
        supabase.from('vendor_plans').select('id, name, asset_type, created_at').eq('status', 'active').eq('eligibility_status', 'approved').order('created_at', { ascending: false }).limit(5)
      ]);

      const signups = signupsRes.status === 'fulfilled' && !signupsRes.value.error ? signupsRes.value.data : [];
      const investments = investmentsRes.status === 'fulfilled' && !investmentsRes.value.error ? investmentsRes.value.data : [];
      const transactions = transactionsRes.status === 'fulfilled' && !transactionsRes.value.error ? transactionsRes.value.data : [];
      const plans = plansRes.status === 'fulfilled' && !plansRes.value.error ? plansRes.value.data : [];

      const combined: ActivityEvent[] = [];

      signups?.forEach(s => combined.push({
        id: `reg-${s.id}`,
        type: 'registration',
        user_name: s.username || 'Anonymous',
        timestamp: s.created_at
      }));

      investments?.forEach(i => combined.push({
        id: `inv-${i.id}`,
        type: 'investment',
        user_name: (i.profiles as any)?.username || 'Anonymous',
        amount: i.amount,
        plan_name: i.plan_name,
        timestamp: i.created_at
      }));

      transactions?.forEach(t => combined.push({
        id: `tx-${t.id}`,
        type: t.type === 'withdrawal' ? 'cashout' : 'claim',
        user_name: (t.profiles as any)?.username || 'Anonymous',
        amount: t.amount,
        timestamp: t.created_at
      }));

      plans?.forEach(p => combined.push({
        id: `plan-${p.id}`,
        type: 'vendor_plan',
        user_name: 'Vendor',
        plan_name: p.name,
        timestamp: p.created_at
      }));

      // Sort by timestamp
      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (combined.length > 0) {
        setActivities(combined.slice(0, 30)); // Keep a healthy rotation of top 30 global activities
      }
    } catch (error) {
      console.error("Error fetching live feed:", error);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 60000); // Refresh data every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;

    // Reset index if it's out of bounds after a data refresh
    if (currentIndex >= activities.length) {
        setCurrentIndex(0);
    }

    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setActivities(prev => {
            if (prev.length === 0) return prev;
            setCurrentIndex((curr) => (curr + 1) % prev.length);
            return prev;
        });
        setIsVisible(true);
      }, 2000); // Wait for fade out / slow motion
    }, 8000); // Change item every 8 seconds

    return () => clearInterval(timer);
  }, [activities, currentIndex]);

  if (activities.length === 0) {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="py-20 text-center italic text-muted-foreground/30 font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em]">
                Quiet Market...
            </div>
        </div>
    );
  }

  const current = activities[currentIndex] || activities[0];

  const getEventDetails = (event: ActivityEvent) => {
    if (!event) return {
        icon: <Activity className="h-4 w-4" />,
        text: "System syncing...",
        color: "border-white/10 bg-white/5",
        label: "System"
    };

    switch (event.type) {
      case 'registration':
        return {
          icon: <UserPlus className="h-4 w-4 text-blue-400" />,
          text: <><span className="text-white font-black">{event.user_name}</span> joined the network</>,
          color: "border-blue-500/20 bg-blue-500/5",
          label: "New User"
        };
      case 'investment':
        return {
          icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
          text: <><span className="text-white font-black">{event.user_name}</span> staked <span className="text-emerald-500 font-black">₦{event.amount?.toLocaleString()}</span></>,
          color: "border-emerald-500/20 bg-emerald-500/5",
          label: "Investment"
        };
      case 'claim':
        return {
          icon: <ArrowUpRight className="h-4 w-4 text-amber-400" />,
          text: <><span className="text-white font-black">{event.user_name}</span> claimed <span className="text-amber-500 font-black">₦{event.amount?.toLocaleString()}</span></>,
          color: "border-amber-500/20 bg-amber-500/5",
          label: "Profit Claim"
        };
      case 'cashout':
        return {
          icon: <Wallet className="h-4 w-4 text-purple-400" />,
          text: <><span className="text-white font-black">{event.user_name}</span> cashed out <span className="text-purple-500 font-black">₦{event.amount?.toLocaleString()}</span></>,
          color: "border-purple-500/20 bg-purple-500/5",
          label: "Withdrawal"
        };
      case 'vendor_plan':
        return {
          icon: <PlusCircle className="h-4 w-4 text-primary" />,
          text: <>New Asset: <span className="text-primary font-black">{event.plan_name}</span></>,
          color: "border-primary/20 bg-primary/5",
          label: "New Node"
        };
      default:
        return {
          icon: <Activity className="h-4 w-4" />,
          text: "System update",
          color: "border-white/10 bg-white/5",
          label: "System"
        };
    }
  };

  const details = getEventDetails(current);

  return (
    <div className="h-full flex items-center justify-center p-4 md:p-8">
      <div className={cn(
        "w-full flex flex-col items-center text-center gap-4 md:gap-6 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-2 backdrop-blur-xl shadow-2xl transition-all duration-[2000ms] transform",
        details.color,
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-12 scale-95"
      )}>
        <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl md:rounded-3xl bg-slate-950/80 border-2 border-white/5 shadow-inner">
          {details.icon}
        </div>
        <div className="space-y-2 md:space-y-3">
          <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] border-white/10 bg-white/5 px-2 md:px-3 py-1">
            {details.label}
          </Badge>
          <p className="text-xs md:text-lg text-white/90 font-black italic leading-tight max-w-[200px] md:max-w-xs">
            {details.text}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 md:mt-4 opacity-40">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Live Activity Network</span>
          </div>
        </div>
      </div>
    </div>
  );
};
