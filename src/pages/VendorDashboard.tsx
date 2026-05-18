import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { VendorPlan, Investment } from "@/lib/types";
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
import { Plus, List, Users, Gem, Zap, Droplets, Flame, Award, Wallet, Coins, Factory, Sprout, Landmark, Anchor, Mountain, ThermometerSnowflake, Shovel } from "lucide-react";

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
    Corn: Sprout,
    Soybeans: Sprout,
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
    Corn: 50000,
    Soybeans: 50000,
};

const VendorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<VendorPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for new plan
  const [newPlan, setNewPlan] = useState({
    name: "",
    duration_days: "",
    daily_return_percent: "",
    features: "",
    asset_type: "Gold",
    payment_details: "",
  });

  useEffect(() => {
    if (user) {
      fetchPlans();
      fetchInvestments();
    }
  }, [user]);

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
      .select("*, vendor_plans!inner(*)")
      .eq("vendor_plans.vendor_id", user.id);

    if (error) {
      console.error("Error fetching investments:", error);
    } else {
      setInvestments(data || []);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const featuresArray = newPlan.features
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f !== "");

    const fixedPrice = assetPrices[newPlan.asset_type] || 0;

    const { error } = await supabase.from("vendor_plans").insert([
      {
        vendor_id: user.id,
        name: newPlan.name,
        min_investment: fixedPrice,
        max_investment: fixedPrice,
        fixed_limit: fixedPrice,
        duration_days: parseInt(newPlan.duration_days),
        daily_return_percent: parseFloat(newPlan.daily_return_percent),
        features: featuresArray,
        asset_type: newPlan.asset_type,
        payment_details: newPlan.payment_details,
        status: "active",
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
        description: "Asset investment plan created. Please complete the eligibility payment to make it live.",
      });
      setNewPlan({
        name: "",
        duration_days: "",
        daily_return_percent: "",
        features: "",
        asset_type: "Gold",
        payment_details: "",
      });
      // Switch to plans tab to show the new plan needing payment
      const plansTab = document.querySelector('[value="plans"]') as HTMLElement;
      if (plansTab) plansTab.click();
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
        toast({ title: "Success", description: "Eligibility proof submitted for review." });
        fetchPlans();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight">Vendor Management</h1>
        <p className="text-muted-foreground">Manage your assets, plans, and track your investors.</p>
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
                            <p className="text-muted-foreground text-xs uppercase font-bold">Daily Return</p>
                            <p className="font-bold text-lg">{plan.daily_return_percent}%</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-muted-foreground text-xs uppercase font-bold">Total ROI</p>
                            <p className="font-bold text-lg">{plan.daily_return_percent * plan.duration_days}%</p>
                        </div>
                    </div>

                    {plan.eligibility_status !== "approved" && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-3">
                            <p className="text-xs font-bold text-yellow-600 uppercase">Action Required: Eligibility Payment</p>
                            <p className="text-[10px] text-muted-foreground">Please pay the commodity listing fee to make this plan live for investors.</p>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="TX Hash" 
                                    className="h-8 text-xs" 
                                    id={`tx-${plan.id}`}
                                />
                                <Button 
                                    size="sm" 
                                    className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700"
                                    onClick={() => {
                                        const tx = (document.getElementById(`tx-${plan.id}`) as HTMLInputElement).value;
                                        handlePayEligibility(plan.id, tx);
                                    }}
                                >
                                    Submit
                                </Button>
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
                                <SelectItem value="Corn">Corn (₦50,000)</SelectItem>
                                <SelectItem value="Soybeans">Soybeans (₦50,000)</SelectItem>
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
                    <Label htmlFor="min">Min Investment ($)</Label>
                    <Input
                      id="min"
                      type="number"
                      className="h-12"
                      value={newPlan.min_investment}
                      onChange={(e) => setNewPlan({ ...newPlan, min_investment: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max">Max Investment ($) (Optional)</Label>
                    <Input
                      id="max"
                      type="number"
                      className="h-12"
                      value={newPlan.max_investment}
                      onChange={(e) => setNewPlan({ ...newPlan, max_investment: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (Days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      className="h-12"
                      value={newPlan.duration_days}
                      onChange={(e) => setNewPlan({ ...newPlan, duration_days: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return">Daily Return (%)</Label>
                    <Input
                      id="return"
                      type="number"
                      step="0.01"
                      className="h-12"
                      value={newPlan.daily_return_percent}
                      onChange={(e) => setNewPlan({ ...newPlan, daily_return_percent: e.target.value })}
                      required
                    />
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

                <div className="space-y-2">
                  <Label htmlFor="features">Plan Features (Comma separated)</Label>
                  <Input
                    id="features"
                    className="h-12"
                    value={newPlan.features}
                    onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                    placeholder="e.g., Instant withdrawals, 24/7 support, Verified source"
                  />
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
