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
import { Plus, List, Users, Gem, Zap, Droplets, Flame, Award, Wallet, Coins, Factory, Sprout, Landmark, Anchor, Mountain, ThermometerSnowflake, Shovel, Copy } from "lucide-react";

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
    "Natural Gas": 100000,
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
      .eq("status", "approved");

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
        description: "Asset investment plan created. Please pay the ₦5,000,000 eligibility fee to make it live.",
      });
      setNewPlan({
        name: "",
        asset_type: "Gold",
        payment_details: "",
        max_traders: 10,
        selected_wallet_id: "",
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = assetIcons[plan.asset_type || "Gold"] || Gem;
              return (
                <Card key={plan.id} className="overflow-hidden border-2 hover:border-primary/50 transition-all">
                  <div className={cn(
                    "h-2",
                    plan.eligibility_status === "approved" ? "bg-emerald-500" : "bg-yellow-500"
                  )} />
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant={plan.status === "active" ? "success" : "secondary"}>
                                {plan.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                Eligibility: {plan.eligibility_status}
                            </Badge>
                        </div>
                    </div>
                    <CardTitle className="mt-4">{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.asset_type} • {plan.duration_days} Days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-bold">Plan Duration</p>
                            <p className="font-bold text-lg">24 Days</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-bold">Total ROI</p>
                            <p className="font-bold text-lg text-emerald-500">50%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-bold">Trader Slots</p>
                            <p className="font-bold text-lg">
                              {plan.current_traders || 0} / {plan.max_traders || 10}
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all" 
                                style={{ width: `${((plan.current_traders || 0) / (plan.max_traders || 10)) * 100}%` }}
                              ></div>
                            </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-bold">Status</p>
                            <p className="font-bold text-lg">
                              {(plan.current_traders || 0) >= (plan.max_traders || 10) ? (
                                <span className="text-red-500">Full</span>
                              ) : (
                                <span className="text-emerald-500">Open</span>
                              )}
                            </p>
                        </div>
                    </div>

                    {plan.eligibility_status !== "approved" && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-yellow-600 uppercase">Action Required: ₦5,000,000 Eligibility Fee</p>
                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">PENDING</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Please pay the listing fee of ₦5,000,000 to your selected company wallet below.</p>
                            
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Selected Company Wallet</Label>
                                <div className="grid gap-2">
                                    {vendorWallets
                                      .filter(wallet => wallet.id === plan.selected_wallet_id)
                                      .map((wallet) => (
                                        <div key={wallet.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-yellow-500/20 group">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-yellow-500/10 rounded-md">
                                                    <Coins className="h-4 w-4 text-yellow-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white">{wallet.name}</span>
                                                    <span className="text-xs text-muted-foreground">{wallet.network}</span>
                                                    <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{wallet.address}</span>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-yellow-500/10"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(wallet.address);
                                                    toast({ title: "Copied!", description: `${wallet.name} address copied.` });
                                                }}
                                            >
                                                <Copy className="h-4 w-4 text-yellow-600" />
                                            </Button>
                                        </div>
                                    ))}
                                    {!plan.selected_wallet_id && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                            <p className="text-xs text-red-600 font-bold">No wallet selected for this plan</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-yellow-500/10">
                                <Label htmlFor={`tx-${plan.id}`} className="text-[10px] font-bold uppercase text-muted-foreground">Upload Payment Proof (TX Hash)</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="Paste transaction hash here..." 
                                        className="h-9 text-xs bg-background border-yellow-500/20" 
                                        id={`tx-${plan.id}`}
                                    />
                                    <Button 
                                        size="sm" 
                                        className="h-9 text-xs bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-600/20"
                                        onClick={() => {
                                            const tx = (document.getElementById(`tx-${plan.id}`) as HTMLInputElement).value;
                                            handlePayEligibility(plan.id, tx);
                                        }}
                                    >
                                        Pay Fee
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Investment Price:</span>
                            <span className="font-bold">₦{plan.min_investment.toLocaleString()}</span>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {plans.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
                <p className="text-muted-foreground">You haven't posted any assets yet.</p>
                <Button 
                    variant="outline" 
                    className="mt-4" 
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
          <Card className="max-w-3xl mx-auto border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Post New Investment Asset</CardTitle>
              <CardDescription>
                Define the terms for your asset investment plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePlan} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="asset_type">Asset Type</Label>
                        <Select value={newPlan.asset_type} onValueChange={(v) => setNewPlan({ ...newPlan, asset_type: v })}>
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Gold">Gold (₦1,000,000)</SelectItem>
                                <SelectItem value="Bitcoin">Bitcoin (₦1,000,000)</SelectItem>
                                <SelectItem value="Palladium">Palladium (₦1,000,000)</SelectItem>
                                <SelectItem value="Platinum">Platinum (₦500,000)</SelectItem>
                                <SelectItem value="Silver">Silver (₦500,000)</SelectItem>
                                <SelectItem value="Nickel">Nickel (₦250,000)</SelectItem>
                                <SelectItem value="Copper">Copper (₦250,000)</SelectItem>
                                <SelectItem value="Lithium">Lithium (₦250,000)</SelectItem>
                                <SelectItem value="Natural Gas">Natural Gas (₦100,000)</SelectItem>
                                <SelectItem value="Aluminum">Aluminum (₦100,000)</SelectItem>
                                <SelectItem value="Crude Oil">Crude Oil (₦50,000)</SelectItem>
                                <SelectItem value="Iron Ore">Iron Ore (₦50,000)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Fixed Trading Price</Label>
                        <div className="h-12 flex items-center px-4 bg-muted rounded-md font-bold text-primary">
                            ₦{(assetPrices[newPlan.asset_type] || 0).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                        id="name"
                        className="h-12"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        placeholder="e.g., Elite Gold Trading Strategy"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Plan Duration (Fixed)</Label>
                    <div className="h-12 flex items-center px-4 bg-muted rounded-md font-bold text-primary">
                        24 Days
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Return (Fixed)</Label>
                    <div className="h-12 flex items-center px-4 bg-muted rounded-md font-bold text-emerald-500">
                        50% ROI
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="max_traders">Maximum Traders</Label>
                    <Input
                      id="max_traders"
                      type="number"
                      min="0"
                      max="100"
                      className="h-12"
                      value={newPlan.max_traders}
                      onChange={(e) => setNewPlan({ ...newPlan, max_traders: parseInt(e.target.value) || 10 })}
                      placeholder="e.g., 10"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Maximum number of traders that can invest in this plan</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selected_wallet">Payment Wallet</Label>
                    <Select value={newPlan.selected_wallet_id} onValueChange={(v) => setNewPlan({ ...newPlan, selected_wallet_id: v })}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select company wallet for payment" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorWallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name} ({wallet.network}) - {wallet.address.slice(0, 10)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Choose which company wallet to pay the ₦5M fee to</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_details" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment / Account Details
                  </Label>
                  <Textarea
                    id="payment_details"
                    className="min-h-[100px]"
                    value={newPlan.payment_details}
                    onChange={(e) => setNewPlan({ ...newPlan, payment_details: e.target.value })}
                    placeholder="Enter account details where users should send their investment funds..."
                    required
                  />
                </div>

                {/* Vendor Payment Wallets Section */}
                <div className="space-y-4 p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-bold text-lg">₦5,000,000 Eligibility Fee Payment</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    To activate your asset plan, you must pay the ₦5,000,000 eligibility fee to one of the admin wallets below. 
                    After payment, submit your transaction hash for verification.
                  </p>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-yellow-600 uppercase">Company Payment Wallets</Label>
                    <div className="grid gap-3">
                      {vendorWallets.map((wallet) => (
                        <div key={wallet.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-yellow-500/20 group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                              <Coins className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{wallet.symbol}</span>
                              <span className="text-xs text-muted-foreground">{wallet.network}</span>
                              <span className="text-xs text-muted-foreground font-mono break-all">{wallet.address}</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-yellow-500/10"
                            onClick={() => {
                              navigator.clipboard.writeText(wallet.address);
                              toast({ title: "Copied!", description: `${wallet.symbol} address copied to clipboard.` });
                            }}
                          >
                            <Copy className="h-4 w-4 text-yellow-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <p className="text-xs text-yellow-600 font-bold uppercase mb-2">Important Notice</p>
                    <p className="text-xs text-muted-foreground">
                      • Send exactly ₦5,000,000 equivalent in any supported cryptocurrency<br/>
                      • Your plan will remain pending until payment is verified<br/>
                      • Only approved plans will be visible to traders<br/>
                      • Keep your transaction hash for verification
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">Post Investment Asset</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investors">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Recent Traders</CardTitle>
              <CardDescription>
                Track who is investing in your asset plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-4 px-4 font-bold uppercase tracking-wider text-xs">User</th>
                      <th className="text-left py-4 px-4 font-bold uppercase tracking-wider text-xs">Asset Plan</th>
                      <th className="text-left py-4 px-4 font-bold uppercase tracking-wider text-xs">Amount</th>
                      <th className="text-left py-4 px-4 font-bold uppercase tracking-wider text-xs">Status</th>
                      <th className="text-left py-4 px-4 font-bold uppercase tracking-wider text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4 font-medium">{inv.user_id.slice(0, 8)}...</td>
                        <td className="py-4 px-4">
                            <Badge variant="outline" className="font-bold">
                                {inv.plan_name}
                            </Badge>
                        </td>
                        <td className="py-4 px-4 font-black text-primary">₦{inv.amount.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <Badge variant={inv.status === 'active' ? 'success' : 'secondary'}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {new Date(inv.approved_at || (inv as any).created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {investments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground italic">
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
