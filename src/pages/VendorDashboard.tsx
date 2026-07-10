import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { VendorPlan, Investment, Crypto, VendorPaymentWallet } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Plus, List, Users, Gem, Zap, Droplets, Flame, Award, Wallet, Coins, Factory, Sprout, Landmark, Anchor, Mountain, ThermometerSnowflake, Shovel, Copy, TrendingUp, CheckCircle, Clock, AlertTriangle, Settings } from "lucide-react";

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
    Lithium: 250000, // Default for those not specified
    "Natural Gas": 25000,
};

const VendorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<VendorPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [vendorWallets, setVendorWallets] = useState<VendorPaymentWallet[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = {
    totalVolume: investments.reduce((acc, inv) => acc + inv.amount, 0),
    activeTraders: new Set(investments.map(inv => inv.user_id)).size,
    pendingEligibility: plans.filter(p => p.eligibility_status === 'pending').length,
    monthlyCommission: investments.reduce((acc, inv) => acc + (inv.amount * 0.5), 0), // 50% commission
  };

  // Form state for new plan
  const [newPlan, setNewPlan] = useState({
    name: "",
    asset_type: "Gold",
    payment_details: "",
    max_traders: 10,
    selected_wallet_id: "",
    eligibility_tx: "",
  });

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchInvestments();
      fetchCryptos();
      fetchVendorWallets();
    }
  }, [user]);

  const fetchCryptos = async () => {
    const { data, error } = await supabase.from("cryptocurrencies").select("*");
    if (error) {
      console.error("Error fetching cryptos:", error);
    } else {
      setCryptos(data || []);
    }
  };

  const fetchVendorWallets = async () => {
    const { data, error } = await supabase
      .from("vendor_payment_wallets")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) {
      console.error("Error fetching vendor wallets:", error);
    } else {
      setVendorWallets(data || []);
    }
  };

  const fetchPlans = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("vendor_plans")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching plans:", error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const fetchInvestments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("investments")
      .select("*, vendor_plans!inner(*), profiles(*)")
      .eq("vendor_plans.vendor_id", user.id)
      .in("status", ["active", "completed"]);

    if (error) {
      console.error("Error fetching investments:", error);
    } else {
      setInvestments(data || []);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const fixedPrice = assetPrices[newPlan.asset_type] || 250000;
    const fixedDuration = 24;
    const fixedTotalReturn = 50; // 50%
    const dailyReturn = fixedTotalReturn / fixedDuration;

    const { error } = await supabase.from("vendor_plans").insert([
      {
        vendor_id: user.id,
        name: newPlan.name,
        min_investment: fixedPrice,
        max_investment: fixedPrice,
        fixed_limit: fixedPrice,
        duration_days: fixedDuration,
        daily_return_percent: dailyReturn,
        asset_type: newPlan.asset_type,
        payment_details: newPlan.payment_details,
        status: "active",
        eligibility_status: "pending",
        eligibility_tx: newPlan.eligibility_tx,
        max_traders: newPlan.max_traders,
        current_traders: 0,
        selected_wallet_id: newPlan.selected_wallet_id,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Asset investment plan created. Admin will review your eligibility fee verification.",
      });
      setNewPlan({
        name: "",
        asset_type: "Gold",
        payment_details: "",
        max_traders: 10,
        selected_wallet_id: "",
        eligibility_tx: "",
      });
      fetchPlans();
    }
  };

  const handlePayEligibility = async (planId: string, tx: string) => {
    if (!tx) {
        toast({ title: "Error", description: "Please enter transaction hash", variant: "destructive" });
        return;
    }
    const { error } = await supabase
        .from("vendor_plans")
        .update({ eligibility_tx: tx, eligibility_status: "pending" })
        .eq("id", planId);
    
    if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Success", description: "Eligibility proof (₦5M) submitted for review." });
        fetchPlans();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight">Vendor Management</h1>
        <p className="text-muted-foreground">Manage your assets, plans, and track your investors.</p>
      </div>

      {/* Vendor Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-2 border-white/5 shadow-xl">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Assets Managed</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black">₦{stats.totalVolume.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-2 border-white/5 shadow-xl">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Active Traders</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black">{stats.activeTraders}</div>
            </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-2 border-white/5 shadow-xl">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Estimated Commission</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-emerald-500">₦{stats.monthlyCommission.toLocaleString()}</div>
                <p className="text-[8px] text-muted-foreground font-bold mt-1">ESTIMATED MONTHLY</p>
            </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-2 border-white/5 shadow-xl">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Pending Verification</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-yellow-500">{stats.pendingEligibility}</div>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="plans" className="rounded-lg gap-2">
            <List className="h-4 w-4" />
            Active Plans
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-lg gap-2">
            <Plus className="h-4 w-4" />
            Post New Asset
          </TabsTrigger>
          <TabsTrigger value="investors" className="rounded-lg gap-2">
            <Users className="h-4 w-4" />
            Traders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid grid-cols-1 gap-6">
            {plans.map((plan) => {
              const Icon = assetIcons[plan.asset_type || "Gold"] || Gem;
              const isApproved = plan.eligibility_status === "approved";
              return (
                <div
                    key={plan.id}
                    className={cn(
                        "flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-6 rounded-3xl border bg-background/50 gap-6 transition-all hover:border-primary/30",
                        isApproved ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-yellow-500/20 bg-yellow-500/[0.02]"
                    )}
                >
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-2xl",
                                isApproved ? "bg-emerald-500/10" : "bg-primary/10"
                            )}>
                                <Icon className={cn(
                                    "h-6 w-6",
                                    isApproved ? "text-emerald-500" : "text-primary"
                                )} />
                            </div>
                            <div>
                                <h4 className="font-black text-xl tracking-tight">{plan.name}</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge variant="secondary" className={cn(
                                        "font-black uppercase text-[10px] px-3",
                                        isApproved ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/20 text-primary"
                                    )}>
                                        {plan.asset_type}
                                    </Badge>
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold border-2",
                                        isApproved ? "border-emerald-500/30 text-emerald-600" : "border-primary/30 text-primary"
                                    )}>
                                        STATUS: {plan.status.toUpperCase()}
                                    </Badge>
                                    <Badge className={cn(
                                        "text-[10px] font-black px-3",
                                        isApproved ? "bg-emerald-500 text-white" : "bg-yellow-500 text-white"
                                    )}>
                                        ELIGIBILITY: {plan.eligibility_status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Expected ROI</p>
                                <p className="font-black text-emerald-500 text-lg">50% / 24 Days</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trading Price</p>
                                <p className="font-black text-primary text-lg">₦{plan.min_investment.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trader Slots</p>
                                <div className="flex items-end gap-2">
                                    <p className="font-black text-lg">{plan.current_traders || 0} / {plan.max_traders || 10}</p>
                                    <div className="flex-1 bg-white/5 h-1.5 rounded-full mb-1.5 overflow-hidden">
                                        <div 
                                            className="bg-primary h-full rounded-full transition-all" 
                                            style={{ width: `${((plan.current_traders || 0) / (plan.max_traders || 10)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Commission</p>
                                <p className="font-black text-emerald-400 text-lg">50% Per Asset</p>
                            </div>
                        </div>

                        {!isApproved && (
                            <div className="space-y-4 pt-4 border-t border-yellow-500/10">
                                <div className="flex items-center gap-2 text-yellow-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    <p className="text-[10px] font-black uppercase">Action Required: Submit Verification Proof (₦5M Fee)</p>
                                </div>
                                <div className="flex flex-col lg:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <Input 
                                            placeholder="Enter Transaction Hash (TX Hash)..." 
                                            className="h-12 bg-slate-950 border-yellow-500/20 rounded-xl pr-12 text-sm" 
                                            id={`tx-${plan.id}`}
                                            defaultValue={plan.eligibility_tx || ""}
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute top-1 right-1 h-10 w-10 hover:bg-white/5"
                                            onClick={() => {
                                                const tx = (document.getElementById(`tx-${plan.id}`) as HTMLInputElement).value;
                                                handlePayEligibility(plan.id, tx);
                                            }}
                                        >
                                            <CheckCircle className="h-5 w-5 text-yellow-600" />
                                        </Button>
                                    </div>
                                    <Button 
                                        className="h-12 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-yellow-600/20"
                                        onClick={() => {
                                            const tx = (document.getElementById(`tx-${plan.id}`) as HTMLInputElement).value;
                                            handlePayEligibility(plan.id, tx);
                                        }}
                                    >
                                        Update Proof
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isApproved && plan.eligibility_tx && (
                             <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                Verification Proof: <span className="font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">{plan.eligibility_tx.slice(0, 20)}...</span>
                             </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center items-center lg:items-end gap-3 lg:w-48 lg:border-l lg:border-white/5 lg:pl-6">
                        {isApproved ? (
                            <div className="w-full space-y-3">
                                <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-2xl border border-emerald-500/20 text-center space-y-1">
                                    <p className="text-[8px] font-black uppercase">Asset Status</p>
                                    <p className="text-sm font-black tracking-widest">LIVE & ACTIVE</p>
                                </div>
                                <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-xs gap-2">
                                    <Settings className="h-4 w-4" />
                                    Manage Plan
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full space-y-3">
                                <div className="bg-yellow-500/10 text-yellow-500 p-3 rounded-2xl border border-yellow-500/20 text-center space-y-1">
                                    <p className="text-[8px] font-black uppercase">Asset Status</p>
                                    <p className="text-sm font-black tracking-widest">AWAITING REVIEW</p>
                                </div>
                                <p className="text-[9px] text-center text-muted-foreground font-bold px-2">
                                    Admin is verifying your ₦5,000,000 listing fee.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
              );
            })}
            {plans.length === 0 && !loading && (
              <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-white/5">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-xl font-black mb-2">No Assets Posted</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">Start earning 50% commission by listing your first trading asset.</p>
                <Button 
                    className="bg-gradient-primary rounded-xl font-bold px-4 h-12" 
                    onClick={() => {
                        const createTab = document.querySelector('[value="create"]') as HTMLElement;
                        if (createTab) createTab.click();
                    }}
                >
                    Post Your First Asset Plan
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card className="max-w-3xl mx-auto border-2 rounded-3xl overflow-hidden bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="text-center pb-8 border-b border-white/5 bg-primary/5">
              <CardTitle className="text-3xl font-black tracking-tight">Post New Investment Asset</CardTitle>
              <CardDescription className="text-sm font-bold uppercase tracking-widest text-primary/60">
                Define the terms for your asset investment plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleCreatePlan} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label htmlFor="asset_type" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Asset Category</Label>
                        <Select value={newPlan.asset_type} onValueChange={(v) => setNewPlan({ ...newPlan, asset_type: v })}>
                            <SelectTrigger className="h-14 rounded-xl bg-slate-900/50 border-2 border-white/5">
                                <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="Gold">Gold (₦1,000,000)</SelectItem>
                                <SelectItem value="Bitcoin">Bitcoin (₦1,000,000)</SelectItem>
                                <SelectItem value="Palladium">Palladium (₦1,000,000)</SelectItem>
                                <SelectItem value="Platinum">Platinum (₦500,000)</SelectItem>
                                <SelectItem value="Silver">Silver (₦500,000)</SelectItem>
                                <SelectItem value="Nickel">Nickel (₦250,000)</SelectItem>
                                <SelectItem value="Copper">Copper (₦250,000)</SelectItem>
                                <SelectItem value="Lithium">Lithium (₦250,000)</SelectItem>
                                <SelectItem value="Natural Gas">Natural Gas (₦25,000)</SelectItem>
                                <SelectItem value="Aluminum">Aluminum (₦100,000)</SelectItem>
                                <SelectItem value="Crude Oil">Crude Oil (₦50,000)</SelectItem>
                                <SelectItem value="Iron Ore">Iron Ore (₦50,000)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fixed Trading Price</Label>
                        <div className="h-14 flex items-center px-6 bg-primary/10 rounded-xl font-black text-xl text-primary border-2 border-primary/20">
                            ₦{(assetPrices[newPlan.asset_type] || 0).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Strategy / Plan Name</Label>
                    <Input
                        id="name"
                        className="h-14 rounded-xl bg-slate-900/50 border-2 border-white/5"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        placeholder="e.g., Elite Gold Trading Strategy"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Plan Duration (Fixed)</Label>
                    <div className="h-14 flex items-center px-6 bg-slate-900/50 rounded-xl font-black text-lg text-white border-2 border-white/5">
                        24 Days
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Return (Fixed)</Label>
                    <div className="h-14 flex items-center px-6 bg-emerald-500/10 rounded-xl font-black text-lg text-emerald-500 border-2 border-emerald-500/20">
                        50% ROI
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="max_traders" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Maximum Traders</Label>
                    <Input
                      id="max_traders"
                      type="number"
                      min="1"
                      max="1000"
                      className="h-14 rounded-xl bg-slate-900/50 border-2 border-white/5"
                      value={newPlan.max_traders}
                      onChange={(e) => setNewPlan({ ...newPlan, max_traders: parseInt(e.target.value) || 10 })}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground font-bold">Limit of traders that can join this specific asset pool.</p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="selected_wallet" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment Wallet</Label>
                    <Select value={newPlan.selected_wallet_id} onValueChange={(v) => setNewPlan({ ...newPlan, selected_wallet_id: v })}>
                      <SelectTrigger className="h-14 rounded-xl bg-slate-900/50 border-2 border-white/5">
                        <SelectValue placeholder="Select company wallet" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {vendorWallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name} ({wallet.network})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="eligibility_tx" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Verification Proof (TX Hash)
                  </Label>
                  <Input
                    id="eligibility_tx"
                    className="h-14 rounded-xl bg-slate-900/50 border-2 border-white/5 font-mono text-sm"
                    value={newPlan.eligibility_tx}
                    onChange={(e) => setNewPlan({ ...newPlan, eligibility_tx: e.target.value })}
                    placeholder="Paste the ₦5,000,000 payment transaction hash here..."
                  />
                  <p className="text-[10px] text-yellow-500 font-bold uppercase">Provide the hash for the ₦5M listing fee to activate your plan.</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="payment_details" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Your Receiving Account Details
                  </Label>
                  <Textarea
                    id="payment_details"
                    className="min-h-[120px] rounded-xl bg-slate-900/50 border-2 border-white/5 p-4"
                    value={newPlan.payment_details}
                    onChange={(e) => setNewPlan({ ...newPlan, payment_details: e.target.value })}
                    placeholder="Where should traders send their investment funds? (e.g., BTC Address, Network, etc.)"
                    required
                  />
                </div>

                {/* Company Payment Wallets Section */}
                <div className="space-y-6 p-8 bg-slate-950/50 border-2 border-yellow-500/20 rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-32 w-32" />
                  </div>
                  <div className="flex items-center gap-3 relative">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl">
                        <Wallet className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="font-black text-2xl tracking-tight">₦5,000,000 Commitment Fee</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        To list an asset on the platform, vendors must pay a one-time <b>₦5,000,000</b> eligibility fee. 
                        This ensures platform security and vendor quality. Pay to any company wallet below:
                    </p>
                    
                    <div className="grid gap-4">
                      {vendorWallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center justify-between p-5 bg-background/50 rounded-2xl border-2 border-white/5 hover:border-yellow-500/20 transition-all group/wallet">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                              <Coins className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-lg text-white tracking-tight">{wallet.symbol}</span>
                              <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">{wallet.network}</span>
                              <span className="text-xs text-muted-foreground font-mono mt-1 break-all opacity-60 group-hover/wallet:opacity-100 transition-opacity">{wallet.address}</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 hover:bg-yellow-500/10 rounded-xl"
                            onClick={() => {
                              navigator.clipboard.writeText(wallet.address);
                              toast({ title: "Copied!", description: `${wallet.symbol} address copied.` });
                            }}
                          >
                            <Copy className="h-5 w-5 text-yellow-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex gap-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-[10px] text-yellow-600 font-black uppercase tracking-widest">Notice</p>
                        <p className="text-xs text-muted-foreground leading-normal">
                            Your asset will be visible to traders immediately after admin verifies your payment hash. 
                            Ensure the hash is correct to avoid activation delays.
                        </p>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 text-xl font-black uppercase tracking-widest bg-gradient-to-r from-primary to-primary/80 rounded-[1.25rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
                    Post Investment Asset
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investors">
          <Card className="border-2 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-2xl font-black">Recent Traders</CardTitle>
              <CardDescription className="text-sm font-bold text-muted-foreground">
                Track who is investing in your asset plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Asset Plan</th>
                      <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-muted/30 transition-colors group">
                        <td className="py-3 px-4 font-bold text-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                                    {inv.profiles?.username?.[0].toUpperCase() || "U"}
                                </div>
                                {inv.profiles?.username || `${inv.user_id.slice(0, 8)}...`}
                            </div>
                        </td>
                        <td className="py-3 px-4">
                            <Badge variant="outline" className="font-black border-2 px-3 py-1">
                                {inv.plan_name}
                            </Badge>
                        </td>
                        <td className="py-3 px-4 font-black text-lg text-primary">₦{inv.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Badge className={cn(
                              "font-black px-3 py-1",
                              inv.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                          )}>
                            {inv.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-bold text-xs">
                          {new Date(inv.approved_at || (inv as any).created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {investments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-20 text-muted-foreground italic font-medium">
                          No traders have invested in your assets yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;
