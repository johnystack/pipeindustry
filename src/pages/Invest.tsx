import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import { VendorPlan } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

import { Check, TrendingUp, Loader2, Award, Gem, Flame, Droplets, Zap, Coins, Factory, Sprout, Landmark, Anchor, Mountain, ThermometerSnowflake, Shovel } from "lucide-react";

const assetIcons: Record<string, any> = {
  Gold: Gem,
  Lithium: Zap,
  "Crude Oil": Droplets,
  Nickel: Flame,
  Silver: Award,
  Bitcoin: Coins,
  "Natural Gas": ThermometerSnowflake,
  Copper: Shovel,
  Platinum: Landmark,
  Palladium: Anchor,
  "Iron Ore": Mountain,
  Aluminum: Factory,
  Wheat: Sprout,
};

const assetColors: Record<string, string> = {
  Gold: "text-yellow-500 bg-yellow-500/10",
  Lithium: "text-purple-500 bg-purple-500/10",
  "Crude Oil": "text-slate-800 bg-slate-800/10",
  Nickel: "text-emerald-500 bg-emerald-500/10",
  Silver: "text-gray-400 bg-gray-400/10",
  Bitcoin: "text-orange-500 bg-orange-500/10",
  "Natural Gas": "text-blue-300 bg-blue-300/10",
  Copper: "text-orange-700 bg-orange-700/10",
  Platinum: "text-slate-300 bg-slate-300/10",
  Palladium: "text-zinc-400 bg-zinc-400/10",
  "Iron Ore": "text-red-800 bg-red-800/10",
  Aluminum: "text-zinc-300 bg-zinc-300/10",
  Wheat: "text-yellow-600 bg-yellow-600/10",
};

const assetPrices: Record<string, number> = {
  Gold: 1000000,
  Bitcoin: 1000000,
  Palladium: 1000000,
  Platinum: 500000,
  Silver: 500000,
  Nickel: 250000,
  Copper: 250000,
  Aluminum: 100000,
  "Crude Oil": 50000,
  "Iron Ore": 50000,
  Lithium: 250000,
  "Natural Gas": 100000,
};

const Invest = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [vendorPlans, setVendorPlans] = useState<VendorPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);

  useEffect(() => {
    const fetchVendorPlans = async () => {
      const { data, error } = await supabase
        .from("vendor_plans")
        .select(`
          *,
          profiles(username, first_name, last_name)
        `)
        .eq("status", "active")
        .eq("eligibility_status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching vendor plans:", error);
      } else {
        const mappedPlans = data?.map((plan: any) => ({
          ...plan,
          vendor_name: plan.profiles?.username || `${plan.profiles?.first_name} ${plan.profiles?.last_name}`.trim() || "Unknown Vendor"
        })) || [];
        setVendorPlans(mappedPlans);
        if (mappedPlans.length > 0) {
          setSelectedPlan(mappedPlans[0].id);
          setInvestmentAmount(mappedPlans[0].min_investment);
        }
      }
      setLoading(false);
    };

    fetchVendorPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
        const plan = vendorPlans.find(p => p.id === selectedPlan);
        if (plan) {
            setInvestmentAmount(plan.min_investment);
        }
    }
  }, [selectedPlan, vendorPlans]);

  const handleSelectPlan = () => {
    navigate("/signup");
  };

  const handleBeVendor = async () => {
    if (!user) {
        navigate("/login");
        return;
    }
    navigate("/vendor-verification");
  };

  const calculateReturns = (amount: number, planId: string | null) => {
    if (amount <= 0) {
      return { expectedProfit: 0, totalReturn: 0 };
    }

    const profit = amount * 0.5; // Fixed 50%
    const total = amount + profit;

    return { expectedProfit: profit, totalReturn: total };
  };

  const { expectedProfit, totalReturn } = calculateReturns(
    investmentAmount,
    selectedPlan,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:p-6 space-y-6 md:space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-4 pt-4 md:pt-12">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase italic leading-none">Market Opportunities</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-xs md:text-lg font-bold uppercase tracking-widest opacity-60">
            Choose your preferred asset node and initiate wealth distribution protocols.
        </p>
      </div>

      {/* Choice Section */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        <Card className="bg-slate-900/40 border-primary/20 shadow-xl hover:shadow-primary/5 transition-all rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-sm relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-20 w-20" />
          </div>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase italic">
                <TrendingUp className="h-6 w-6 text-primary" />
                Active Stake
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Browse and invest in existing plans posted by our vendors.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs" onClick={() => document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                View Asset Matrix
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-emerald-500/20 shadow-xl hover:shadow-emerald-500/5 transition-all rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-sm relative group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <Award className="h-20 w-20 text-emerald-500" />
          </div>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase italic">
                <Award className="h-6 w-6 text-emerald-500" />
                Node Vendor
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Get verified to post your commodities like Gold and Lithium.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {role === 'vendor' ? (
                <Link to="/vendor-dashboard">
                    <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                        Vendor Hub
                    </Button>
                </Link>
            ) : (
                <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={handleBeVendor}>
                    Request Authority
                </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Plans Grid */}
      <div id="plans-grid" className="space-y-4 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Asset Matrix</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-black px-3">GOLD</Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-black px-3">LITHIUM</Badge>
                <Badge variant="outline" className="bg-slate-800/10 text-slate-800 border-slate-800/20 font-black px-3 text-white">CRUDE OIL</Badge>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {vendorPlans.map((plan) => {
            const Icon = assetIcons[plan.asset_type || "Gold"] || TrendingUp;
            const colorClass = assetColors[plan.asset_type || "Gold"] || "text-primary bg-primary/10";
            
            return (
                <Card
                key={plan.id}
                className={`relative bg-slate-900/60 border-white/5 shadow-2xl transition-all duration-300 hover:border-primary/30 cursor-pointer group rounded-xl md:rounded-[2.5rem] overflow-hidden backdrop-blur-xl ${
                    selectedPlan === plan.id ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => setSelectedPlan(plan.id)}
                >
                <CardHeader className="text-center p-3 md:p-8">
                    <div className="flex justify-center mb-1 md:mb-6">
                    <div className={`p-2 md:p-6 rounded-xl md:rounded-2xl ${colorClass} transition-transform group-hover:scale-110 shadow-lg`}>
                        <Icon className="h-5 w-5 md:h-10 md:w-10" />
                    </div>
                    </div>
                    <CardTitle className="text-[10px] md:text-2xl font-black uppercase tracking-tighter italic truncate">{plan.name}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1 font-black text-[6px] md:text-xs uppercase tracking-widest">
                        <Badge variant="secondary" className="font-black text-[5px] md:text-[9px] px-1 py-0">{plan.asset_type}</Badge>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 md:space-y-8 p-3 md:p-8 pt-0">
                    <div className="text-center p-2 md:p-6 bg-slate-950/50 rounded-lg md:rounded-2xl border border-white/5">
                        <div className="text-lg md:text-5xl font-black text-emerald-500 italic leading-none tracking-tighter">
                            50%
                        </div>
                        <p className="text-[5px] md:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">Growth</p>
                    </div>

                    <div className="space-y-1 md:space-y-3">
                        <div className="flex justify-between items-center p-2 md:p-4 bg-slate-950/80 rounded-lg md:rounded-2xl border border-white/5">
                            <span className="text-[5px] md:text-[10px] text-muted-foreground uppercase font-black opacity-40">Entry</span>
                            <p className="font-black text-[9px] md:text-2xl text-primary italic">₦{plan.min_investment.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="pt-1 md:pt-6 border-t border-white/5">
                    <Button
                        size="sm"
                        className="w-full h-8 md:h-14 font-black uppercase tracking-widest text-[7px] md:text-sm italic rounded-lg md:rounded-2xl bg-primary text-white"
                        onClick={handleSelectPlan}
                    >
                        Stake
                    </Button>
                    </div>
                </CardContent>
                </Card>
            );
            })}
        </div>
      </div>

      {/* Investment Calculator */}
      <Card className="bg-slate-900/60 border-white/5 shadow-2xl overflow-hidden relative rounded-2xl md:rounded-[3rem] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp className="h-32 w-32 text-primary" />
        </div>
        <CardHeader className="relative p-4 md:p-12 pb-0">
          <CardTitle className="text-xl md:text-4xl font-black uppercase italic tracking-tighter">Forecaster</CardTitle>
          <CardDescription className="text-[8px] md:text-lg font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
            Project your earnings based on verified distribution protocols.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative p-4 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-16">
            <div className="space-y-4 md:space-y-10">
              <div className="space-y-1 md:space-y-4">
                <label className="text-[8px] md:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic opacity-50">Active Stake (₦)</label>
                <div className="w-full px-4 md:px-8 py-3 md:py-6 bg-slate-950 border-2 border-white/5 rounded-xl md:rounded-[2rem] text-lg md:text-4xl font-black text-primary italic flex items-center">
                    ₦{investmentAmount.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1 md:space-y-4">
                <label className="text-[8px] md:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground italic opacity-50">Select Asset Node</label>
                <select
                  className="w-full h-10 md:h-20 px-4 md:px-8 bg-slate-950 border-2 border-white/5 focus:border-primary/50 rounded-xl md:rounded-[2rem] text-[9px] md:text-lg font-black uppercase italic tracking-wider outline-none"
                  value={selectedPlan || ""}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  <option value="">SCANNING NETWORK...</option>
                  {vendorPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.asset_type.toUpperCase()} • {plan.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl md:rounded-[3.5rem] p-4 md:p-16 border border-primary/10 flex flex-col justify-center">
                <div className="grid grid-cols-1 gap-4 md:gap-12 relative z-10">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2 md:pb-10">
                        <span className="text-[8px] md:text-xs font-black text-muted-foreground uppercase opacity-40">Yield</span>
                        <span className="text-lg md:text-5xl font-black text-emerald-500 italic">
                            +₦{expectedProfit.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-[8px] md:text-xs font-black text-muted-foreground uppercase opacity-40">Maturity</span>
                        <span className="text-xl md:text-6xl font-black text-primary italic">
                            ₦{totalReturn.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invest;
