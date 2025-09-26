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
  Star,
  Crown,
  Diamond,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Starter Plan",
    icon: "Star", // Using string for icon for now, will import later
    popular: false,
    minInvestment: "300",
    maxInvestment: "999",
    duration: "7 days",
    dailyReturn: "4%",
    sevenDayReturn: "120%",
    totalReturn: "128%",
    profitPercentage: "28%",
    features: [
      "Daily profit withdrawal",
      "24/7 customer support",
      "Secure investment",
      "Instant deposits",
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "Silver Plan",
    icon: "Crown",
    popular: true,
    minInvestment: "1000",
    maxInvestment: "4,999",
    duration: "7 days",
    dailyReturn: "6%",
    sevenDayReturn: "180%",
    totalReturn: "142%",
    profitPercentage: "42%",
    features: [
      "Higher daily returns",
      "Priority customer support",
      "Advanced analytics",
      "Instant deposits",
      "Referral bonuses",
    ],
    color: "text-gray-400",
    bgColor: "bg-gray-400/10",
  },
  {
    name: "Gold Plan",
    icon: "Crown",
    popular: false,
    minInvestment: "5,000",
    maxInvestment: "9,999",
    duration: "7 days",
    dailyReturn: "8%",
    sevenDayReturn: "240%",
    totalReturn: "156%",
    profitPercentage: "56%",
    features: [
      "Premium daily returns",
      "Dedicated account manager",
      "Advanced portfolio tools",
      "Instant deposits",
      "Enhanced referral bonuses",
      "Market insights",
    ],
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    name: "VIP Plan",
    icon: "Diamond",
    popular: false,
    minInvestment: "10,000",
    maxInvestment: "Unlimited",
    duration: "7 days",
    dailyReturn: "10%",
    sevenDayReturn: "300%",
    totalReturn: "170%",
    profitPercentage: "70%",
    features: [
      "Maximum daily returns",
      "Personal investment advisor",
      "Exclusive market access",
      "Instant deposits",
      "VIP referral program",
      "Private telegram group",
      "Monthly strategy calls",
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
];

import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const InvestNow = () => {
  const { user } = useAuth();
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin");
  const [amount, setAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(plans[0].name);
  const { toast } = useToast();

  const [cryptos, setCryptos] = useState<any[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);

  useEffect(() => {
    const fetchCryptos = async () => {
      const { data, error } = await supabase
        .from("cryptocurrencies")
        .select("*, address"); // Explicitly select address

      if (error) {
        console.error("Error fetching cryptocurrencies:", error);
      } else {
        setCryptos(data);
      }
    };

    fetchCryptos();
  }, []);

  useEffect(() => {
    const fetchRecentDeposits = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "Deposit")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching recent deposits:", error);
        } else {
          setRecentDeposits(data);
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

    const plan = plans.find((p) => p.name === selectedPlan);
    if (!plan) {
      toast({
        title: "Error",
        description: "Invalid investment plan selected.",
        variant: "destructive",
      });
      return;
    }

    const dailyReturn = parseFloat(plan.dailyReturn) / 100;
    const duration = parseInt(plan.duration);
    const expectedProfit = Number(amount) * dailyReturn * duration;

    const { data, error } = await supabase.from("investments").insert([
      {
        user_id: user.id,
        plan_name: selectedPlan,
        amount: Number(amount),
        crypto: selectedCrypto,
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
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            type: "deposit",
            amount: Number(amount),
            status: "pending", // Or "processing"
            description: `Deposit for ${selectedCryptoData?.name}`,
            reference: `DEP-${Date.now()}`,
            // Add other relevant fields like crypto, fee, etc. if available
          },
        ]);

      if (transactionError) {
        console.error("Error creating deposit transaction:", transactionError);
        toast({
          title: "Error recording deposit",
          description: transactionError.message,
          variant: "destructive",
        });
        return; // Stop if transaction recording fails
      }

      // Check if user has invested before
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("has_invested")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (!profileData.has_invested) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ has_invested: true })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating has_invested:", updateError);
        }

        // Award referral commission
        const { data: referrerProfile, error: referrerProfileError } =
          await supabase
            .from("profiles")
            .select("referred_by, referral_earnings")
            .eq("id", user.id)
            .single();

        if (referrerProfileError) {
          console.error(
            "Error fetching referrer profile:",
            referrerProfileError,
          );
        } else if (referrerProfile.referred_by) {
          const commissionAmount = Number(amount) * 0.1; // 10% commission

          const { error: commissionError } = await supabase
            .from("transactions")
            .insert([
              {
                user_id: referrerProfile.referred_by,
                type: "Referral",
                amount: commissionAmount,
                status: "completed",
                description: `Referral commission from ${user.email}`,
                referred_user_id: user.id,
              },
            ]);

          if (commissionError) {
            console.error(
              "Error creating referral transaction:",
              commissionError,
            );
          } else {
            const { error: updateReferrerError } = await supabase
              .from("profiles")
              .update({
                referral_earnings:
                  referrerProfile.referral_earnings + commissionAmount,
              })
              .eq("id", referrerProfile.referred_by);

            if (updateReferrerError) {
              console.error(
                "Error updating referrer earnings:",
                updateReferrerError,
              );
            }
          }
        }
      }

      toast({
        title: "Investment created successfully",
      });
    }
  };

  const selectedCryptoData = cryptos.find((c) => c.id === selectedCrypto);
  const selectedPlanData = plans.find((p) => p.name === selectedPlan);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 flex flex-col items-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Invest Now
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose an investment plan and fund your account to start earning.
        </p>
      </div>

      <Tabs defaultValue="deposit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="deposit">Make Deposit</TabsTrigger>
          <TabsTrigger value="history">Deposit History</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Deposit Form */}
            <Card className="crypto-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Invest in a Plan
                </CardTitle>
                <CardDescription>
                  Select an investment plan and cryptocurrency to fund it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="plan">Select Investment Plan</Label>
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose investment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.name} value={plan.name}>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${plan.color}`}>
                              {plan.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crypto">Select Cryptocurrency</Label>
                  <Select
                    value={selectedCrypto}
                    onValueChange={setSelectedCrypto}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      {cryptos.map((crypto) => (
                        <SelectItem key={crypto.id} value={crypto.id}>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${crypto.color}`}>
                              {crypto.symbol}
                            </span>
                            <span>{crypto.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Optional)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Min: ${selectedPlanData?.minInvestment} (for selected plan)`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <Button onClick={handleInvest} className="w-full">
                  Invest
                </Button>

                {selectedPlanData && selectedCryptoData && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Network:</span>
                      <Badge variant="outline">
                        {selectedCryptoData?.network}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deposit Address */}
            {selectedCryptoData && (
              <Card className="crypto-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={selectedCryptoData?.color}>
                      {selectedCryptoData?.symbol}
                    </span>
                    Deposit Address
                  </CardTitle>
                  <CardDescription>
                    Send {selectedCryptoData?.name} to this address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-background border border-border rounded-lg">
                      <div className="w-32 h-32 bg-muted mx-auto rounded-lg flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Wallet Address</Label>
                      <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-lg">
                        <code className="text-xs flex-1 break-all">
                          {selectedCryptoData?.address}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(selectedCryptoData.address)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Important Notes</span>
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>
                        • Only send {selectedCryptoData?.name} to this address
                      </li>
                      <li>
                        • Funds will be credited automatically after
                        confirmation
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="crypto-card">
            <CardHeader>
              <CardTitle>Recent Deposits</CardTitle>
              <CardDescription>
                Track your cryptocurrency deposits and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(deposit.status)}
                        <div>
                          <div className="font-medium">
                            {deposit.amount} {deposit.crypto}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {deposit.usdValue}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          deposit.status === "completed"
                            ? "status-completed"
                            : "status-pending"
                        }
                      >
                        {deposit.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {deposit.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestNow;
