import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  QrCode,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { Crypto, Deposit, VendorPlan } from "@/lib/types";

const InvestNow = () => {
  const { user } = useAuth();
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const { toast } = useToast();

  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [vendorPlans, setVendorPlans] = useState<VendorPlan[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch Cryptos
      const { data: cryptoData, error: cryptoError } = await supabase
        .from("cryptocurrencies")
        .select("*");

      if (cryptoError) {
        console.error("Error fetching cryptocurrencies:", cryptoError);
      } else {
        setCryptos(cryptoData || []);
        if (cryptoData && cryptoData.length > 0) {
          setSelectedCrypto(cryptoData[0].id);
        }
      }

      // Fetch Vendor Plans
      const { data: planData, error: planError } = await supabase
        .from("vendor_plans")
        .select(`
          *,
          profiles(username, first_name, last_name)
        `)
        .eq("status", "active")
        .eq("eligibility_status", "approved")
        .order("created_at", { ascending: false });

      if (planError) {
        console.error("Error fetching vendor plans:", planError);
      } else {
        const mappedPlans = planData?.map((plan: any) => ({
          ...plan,
          vendor_name: plan.profiles?.username || `${plan.profiles?.first_name} ${plan.profiles?.last_name}`.trim() || "Unknown Vendor"
        })) || [];
        setVendorPlans(mappedPlans);
        if (mappedPlans.length > 0) {
          setSelectedPlanId(mappedPlans[0].id);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchRecentDeposits = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "deposit")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching recent deposits:", error);
        } else {
          setRecentDeposits(data as any || []);
        }
      }
    };

    fetchRecentDeposits();
  }, [user]);

  const handleInvest = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to invest.",
        variant: "destructive",
      });
      return;
    }

    if (!amount) {
      toast({
        title: "Error",
        description: "Please enter an amount to invest.",
        variant: "destructive",
      });
      return;
    }

    const plan = vendorPlans.find((p) => p.id === selectedPlanId);
    if (!plan) {
      toast({
        title: "Error",
        description: "Invalid investment plan selected.",
        variant: "destructive",
      });
      return;
    }

    const fixedAmount = plan.min_investment;

    const dailyReturn = plan.daily_return_percent / 100;
    const duration = plan.duration_days;
    const expectedProfit = fixedAmount * dailyReturn * duration;

    const selectedCryptoData = cryptos.find((c) => c.id === selectedCrypto);

    const { error } = await supabase.from("investments").insert([
      {
        user_id: user.id,
        plan_id: selectedPlanId,
        plan_name: plan.name,
        amount: fixedAmount,
        crypto: selectedCryptoData?.symbol || selectedCrypto,
        status: "pending",
        address: selectedCryptoData?.address,
        expected_profit: expectedProfit,
        daily_return: dailyReturn,
        duration: duration,
        due_date: new Date(
          new Date().getTime() + duration * 24 * 60 * 60 * 1000,
        ),
      },
    ]);

    if (error) {
      toast({
        title: "Error creating investment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Insert into transactions table for deposit
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            type: "deposit",
            amount: fixedAmount,
            status: "pending",
            description: `Investment in ${plan.name} (${plan.asset_type})`,
            reference: `INV-${Date.now()}`,
            crypto: selectedCryptoData?.symbol || selectedCrypto,
            address: selectedCryptoData?.address,
          },
        ]);

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
      }

      toast({
        title: "Success",
        description: "Your investment request has been submitted. Please complete the payment using the vendor's details.",
      });
      setAmount("");
    }
  };

  const selectedCryptoData = cryptos.find((c) => c.id === selectedCrypto);
  const selectedPlanData = vendorPlans.find((p) => p.id === selectedPlanId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading plans and cryptos...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8 flex flex-col items-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black bg-gradient-primary bg-clip-text text-transparent">
          Secure Investment Portal
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Fund your chosen asset plan. Please use the vendor's payment details provided below.
        </p>
      </div>

      <Tabs defaultValue="deposit" className="space-y-6 w-full max-w-5xl">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="deposit">Deposit Funds</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Investment Selection */}
            <Card className="bg-gradient-card border-border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Select Your Plan
                </CardTitle>
                <CardDescription>
                  Choose an asset and the crypto you want to use.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="plan">Asset Investment Plan</Label>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose investment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.asset_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPlanData && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mt-2">
                        <p className="text-xs font-bold text-primary uppercase">Plan Details</p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">Min: ${selectedPlanData.min_investment}</span>
                            <span className="text-xs text-muted-foreground text-right">
                                {selectedPlanData.fixed_limit ? `Limit: $${selectedPlanData.fixed_limit}` : `Max: ${selectedPlanData.max_investment ? `$${selectedPlanData.max_investment}` : "∞"}`}
                            </span>
                        </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crypto">Payment Currency</Label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select crypto" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto.id} value={crypto.id}>
                          {crypto.name} ({crypto.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Investment Amount (Fixed)</Label>
                  <div className="h-12 flex items-center px-4 bg-muted rounded-md font-black text-xl text-primary border-2 border-primary/20">
                    ₦{selectedPlanData ? selectedPlanData.min_investment.toLocaleString() : "0"}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    The investment amount is fixed by the platform for this commodity.
                  </p>
                </div>

                <Button className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20" onClick={handleInvest}>
                  Confirm Investment
                </Button>
              </CardContent>
            </Card>

            {/* Right: Vendor Payment Info */}
            <Card className="bg-gradient-card border-border shadow-xl overflow-hidden">
              <div className="h-2 bg-emerald-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-emerald-500" />
                    Vendor Payment Details
                </CardTitle>
                <CardDescription>
                  Send your funds directly to the vendor's account below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedPlanData ? (
                  <>
                    <div className="p-6 bg-emerald-500/5 rounded-2xl border-2 border-emerald-500/10 space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-emerald-600 uppercase">Vendor Name</Label>
                            <p className="font-bold text-lg">{selectedPlanData.vendor_name}</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-emerald-600 uppercase">Account / Payment Details</Label>
                            <div className="bg-background p-4 rounded-xl border-2 border-emerald-500/20 relative group">
                                <p className="whitespace-pre-wrap font-mono text-sm break-all pr-10">
                                    {selectedPlanData.payment_details || "No details provided by vendor."}
                                </p>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-2 right-2 hover:bg-emerald-500/10"
                                    onClick={() => copyToClipboard(selectedPlanData.payment_details || "")}
                                >
                                    <Copy className="h-4 w-4 text-emerald-500" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {selectedCryptoData && (
                        <div className="space-y-4">
                            <div className="flex justify-center p-4 bg-white rounded-xl">
                                <QrCode className="h-32 w-32 text-black" />
                            </div>
                            <div className="p-4 bg-muted rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount to send:</span>
                                    <span className="font-bold text-primary">₦{selectedPlanData ? selectedPlanData.min_investment.toLocaleString() : "0.00"}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                                    <span className="text-muted-foreground">Currency:</span>
                                    <span className="font-bold">{selectedCryptoData.name} ({selectedCryptoData.symbol})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Network:</span>
                                    <span className="font-bold text-primary">{selectedCryptoData.network || "Default"}</span>
                                </div>
                            </div>
                        </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-muted-foreground italic">
                    Select an investment plan to view vendor payment details.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
            <Card className="bg-gradient-card border-border shadow-xl">
                <CardHeader>
                    <CardTitle>Investment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentDeposits.map((deposit) => (
                            <div key={deposit.id} className="flex items-center justify-between p-5 border-2 rounded-2xl hover:bg-muted/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-black text-lg">₦{deposit.amount.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{deposit.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(deposit.status)}
                                        <span className="text-sm font-bold capitalize">{deposit.status}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{new Date(deposit.created_at || "").toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {recentDeposits.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No investment history found.</p>
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

export default InvestNow;
