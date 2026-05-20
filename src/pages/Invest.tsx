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
  Palladium: 500000,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight">Investment Opportunities</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Explore high-value asset plans posted by our verified vendors. Choose your preferred asset and start growing your wealth.
        </p>
      </div>

      {/* Choice Section */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 shadow-lg hover:shadow-primary/10 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Normal Investment
            </CardTitle>
            <CardDescription>
                Browse and invest in existing plans posted by our vendors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                View Plans
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-background border-emerald-500/20 shadow-lg hover:shadow-emerald-500/10 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-emerald-500" />
                Be a Vendor
            </CardTitle>
            <CardDescription>
                Get verified to post your commodities like Gold and Lithium. (Verification fee applies)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {role === 'vendor' ? (
                <Link to="/vendor-dashboard">
                    <Button variant="outline" className="w-full border-emerald-500 text-emerald-500 hover:bg-emerald-500/10">
                        Go to Vendor Dashboard
                    </Button>
                </Link>
            ) : (
                <Button variant="outline" className="w-full border-emerald-500 text-emerald-500 hover:bg-emerald-500/10" onClick={handleBeVendor}>
                    Apply for Verification
                </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Plans Grid */}
      <div id="plans-grid" className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Available Asset Plans</h2>
            <div className="flex gap-2">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Gold</Badge>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Lithium</Badge>
                <Badge variant="outline" className="bg-slate-800/10 text-slate-800 border-slate-800/20">Crude Oil</Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {vendorPlans.map((plan) => {
            const Icon = assetIcons[plan.asset_type || "Gold"] || TrendingUp;
            const colorClass = assetColors[plan.asset_type || "Gold"] || "text-primary bg-primary/10";
            
            return (
                <Card
                key={plan.id}
                className={`relative bg-gradient-card border-border shadow-card transition-all duration-300 hover:shadow-glow cursor-pointer group ${
                    selectedPlan === plan.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPlan(plan.id)}
                >
                <CardHeader className="text-center p-6">
                    <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-2xl ${colorClass} transition-transform group-hover:scale-110`}>
                        <Icon className="h-8 w-8" />
                    </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1 font-medium">
                        <Badge variant="secondary" className="font-bold">{plan.asset_type}</Badge>
                        <span className="text-muted-foreground mx-1">•</span>
                        <span>{plan.vendor_name}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                    <div className="text-center p-4 bg-muted/50 rounded-xl space-y-1">
                        <div className="text-4xl font-black text-primary">
                            50%
                        </div>
                        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Expected ROI
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Fixed Return in 24 Days
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <span className="text-xs text-muted-foreground uppercase font-bold">Fixed Entry Price</span>
                            <p className="font-black text-xl text-primary">₦{plan.min_investment.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        Plan Benefits
                    </h4>
                    <ul className="grid grid-cols-1 gap-2">
                        {plan.features.slice(0, 3).map((feature, featureIndex) => (
                        <li
                            key={featureIndex}
                            className="flex items-center text-sm text-muted-foreground"
                        >
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/50 mr-2" />
                            {feature}
                        </li>
                        ))}
                    </ul>
                    </div>

                    <div className="pt-4 border-t">
                    <Button
                        size="lg"
                        className="w-full font-bold shadow-lg shadow-primary/20"
                        onClick={handleSelectPlan}
                    >
                        Invest in {plan.asset_type}
                    </Button>
                    </div>
                </CardContent>
                </Card>
            );
            })}
            {vendorPlans.length === 0 && (
            <div className="col-span-full text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
                <p className="text-muted-foreground text-lg">No investment plans available at the moment.</p>
                <Button variant="link" onClick={handleBeVendor}>Become the first vendor</Button>
            </div>
            )}
        </div>
      </div>

      {/* Investment Calculator */}
      <Card className="bg-gradient-card border-border shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <TrendingUp className="h-32 w-32" />
        </div>
        <CardHeader className="relative">
          <CardTitle className="text-3xl">Profit Calculator</CardTitle>
          <CardDescription className="text-lg">
            Project your earnings based on current vendor plans.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fixed Investment (₦)</label>
                <div className="w-full px-4 py-3 bg-muted border-2 border-border rounded-xl text-lg font-bold text-primary flex items-center">
                    ₦{investmentAmount.toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground italic">Price is fixed for the selected commodity.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Investment Plan</label>
                <select
                  className="w-full h-12 px-4 py-2 bg-background border-2 border-border focus:border-primary rounded-xl text-sm font-medium transition-all"
                  value={selectedPlan || ""}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  <option value="">Select a plan</option>
                  {vendorPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.asset_type}) - {plan.daily_return_percent}% daily
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col justify-center">
                <div className="grid grid-cols-1 gap-6">
                    <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                        <span className="text-sm font-bold text-muted-foreground uppercase">Expected Profit</span>
                        <span className="text-3xl font-black text-emerald-500">
                            ₦{expectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-muted-foreground uppercase">Total Return</span>
                        <span className="text-3xl font-black text-primary">
                            ₦{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
