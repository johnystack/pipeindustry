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
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const { toast } = useToast();

  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [vendorPlans, setVendorPlans] = useState<VendorPlan[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [userInvestments, setUserInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);

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

      // Fetch User Investments
      if (user) {
        const { data: investmentData, error: investmentError } = await supabase
          .from("investments")
          .select(`
            *,
            vendor_plans(name, asset_type)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (investmentError) {
          console.error("Error fetching user investments:", investmentError);
        } else {
          setUserInvestments(investmentData || []);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

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

    const plan = vendorPlans.find((p) => p.id === selectedPlanId);
    if (!plan) {
      toast({
        title: "Error",
        description: "Invalid investment plan selected.",
        variant: "destructive",
      });
      return;
    }

    // Check if plan has available slots
    if (plan.max_traders > 0 && (plan.current_traders || 0) >= plan.max_traders) {
      toast({
        title: "Plan Full",
        description: "This investment plan has reached its maximum number of traders. Please select another plan.",
        variant: "destructive",
      });
      return;
    }

    const fixedAmount = plan.min_investment;
    const fixedDuration = 24;
    const fixedTotalReturn = 0.5; // 50%
    const expectedProfit = fixedAmount * fixedTotalReturn;

    const { error } = await supabase.from("investments").insert([
      {
        user_id: user.id,
        plan_id: selectedPlanId,
        plan_name: plan.name,
        amount: fixedAmount,
        crypto: "NGN", // Traders pay in Naira
        status: "awaiting_proof", // Changed from "pending" to "awaiting_proof"
        expected_profit: expectedProfit,
        daily_return: fixedTotalReturn / fixedDuration,
        duration: fixedDuration,
        due_date: new Date(
          new Date().getTime() + fixedDuration * 24 * 60 * 60 * 1000,
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
            crypto: "NGN", // Traders pay in Naira
          },
        ]);

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
      }

      toast({
        title: "Success",
        description: "Your investment request has been submitted. Please upload your payment proof to complete the process.",
      });
      
      // Refresh user investments to show the new one
      if (user) {
        const { data: investmentData } = await supabase
          .from("investments")
          .select(`
            *,
            vendor_plans(name, asset_type)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setUserInvestments(investmentData || []);
      }
    }
  };

  const handleUploadPaymentProof = async (investmentId: string, proofText: string) => {
    if (!proofText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your payment proof/transaction hash.",
        variant: "destructive",
      });
      return;
    }

    setUploadingProof(investmentId);
    
    const { error } = await supabase
      .from("investments")
      .update({ 
        payment_proof: proofText,
        status: "pending" // Change from "awaiting_proof" to "pending" for admin review
      })
      .eq("id", investmentId);

    if (error) {
      console.error("Error uploading payment proof:", error);
      toast({
        title: "Error",
        description: "Failed to upload payment proof. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Payment proof uploaded successfully! Your investment is now pending admin approval.",
      });
      
      // Refresh user investments
      if (user) {
        const { data: investmentData } = await supabase
          .from("investments")
          .select(`
            *,
            vendor_plans(name, asset_type)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setUserInvestments(investmentData || []);
      }
    }
    
    setUploadingProof(null);
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
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="deposit">Deposit Funds</TabsTrigger>
          <TabsTrigger value="my-investments">My Investments</TabsTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label>Investment Amount (Fixed)</Label>
                  <div className="h-12 flex items-center px-4 bg-muted rounded-md font-black text-xl text-primary border-2 border-primary/20">
                    ₦{selectedPlanData ? selectedPlanData.min_investment.toLocaleString() : "0"}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    The investment amount is fixed by the platform for this commodity. Traders pay in Naira (₦) directly to the vendor.
                  </p>
                </div>

                {/* Trader Slots Information */}
                {selectedPlanData && (
                  <div className="space-y-2">
                    <Label>Available Trader Slots</Label>
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Slots Filled</span>
                        <span className="font-bold">
                          {selectedPlanData.current_traders || 0} / {selectedPlanData.max_traders || 0}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ 
                            width: `${selectedPlanData.max_traders > 0 ? ((selectedPlanData.current_traders || 0) / selectedPlanData.max_traders) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {selectedPlanData.max_traders > 0 && (selectedPlanData.current_traders || 0) >= selectedPlanData.max_traders ? (
                          <span className="text-red-500 font-medium">⚠️ This plan is full</span>
                        ) : selectedPlanData.max_traders > 0 ? (
                          <span className="text-green-600 font-medium">✅ Slots available</span>
                        ) : (
                          <span className="text-blue-500 font-medium">🔄 Unlimited slots</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20" 
                  onClick={handleInvest}
                  disabled={selectedPlanData && selectedPlanData.max_traders > 0 && (selectedPlanData.current_traders || 0) >= selectedPlanData.max_traders}
                >
                  {selectedPlanData && selectedPlanData.max_traders > 0 && (selectedPlanData.current_traders || 0) >= selectedPlanData.max_traders 
                    ? "Plan Full - No Slots Available" 
                    : "Confirm Investment"
                  }
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

                    <div className="p-4 bg-muted rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Amount to Pay:</span>
                            <span className="font-black text-xl text-primary">₦{selectedPlanData ? selectedPlanData.min_investment.toLocaleString() : "0.00"}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground italic mt-2">
                            * Please ensure you send the exact amount mentioned above to the vendor's account to avoid delays in approval.
                        </div>
                    </div>
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

        <TabsContent value="my-investments">
          <Card className="bg-gradient-card border-border shadow-xl">
            <CardHeader>
              <CardTitle>My Investments</CardTitle>
              <CardDescription>
                Track your investments and upload payment proof
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userInvestments.map((investment) => (
                  <div key={investment.id} className="p-6 border-2 rounded-2xl bg-background/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-black text-lg">{investment.vendor_plans?.name}</h4>
                        <p className="text-sm text-muted-foreground">{investment.vendor_plans?.asset_type}</p>
                      </div>
                      <Badge variant={
                        investment.status === 'approved' ? 'default' : 
                        investment.status === 'pending' ? 'secondary' : 
                        investment.status === 'awaiting_proof' ? 'outline' : 'destructive'
                      }>
                        {investment.status === 'awaiting_proof' ? 'Awaiting Proof' : investment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Amount</p>
                        <p className="font-black text-primary">₦{investment.amount.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Expected Profit</p>
                        <p className="font-black text-emerald-500">₦{investment.expected_profit?.toLocaleString() || 0}</p>
                      </div>
                    </div>

                    {investment.status === 'awaiting_proof' && (
                      <div className="space-y-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                        <Label className="text-sm font-bold text-yellow-600">Upload Payment Proof</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter transaction hash or payment reference..."
                            id={`proof-${investment.id}`}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById(`proof-${investment.id}`) as HTMLInputElement;
                              if (input) {
                                handleUploadPaymentProof(investment.id, input.value);
                              }
                            }}
                            disabled={uploadingProof === investment.id}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            {uploadingProof === investment.id ? "Uploading..." : "Upload Proof"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Please provide your transaction hash, receipt number, or payment reference for verification.
                        </p>
                      </div>
                    )}

                    {investment.payment_proof && (
                      <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <Label className="text-xs font-bold text-blue-600 uppercase">Payment Proof Submitted</Label>
                        <p className="text-sm font-mono break-all mt-1">{investment.payment_proof}</p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                      Created: {new Date(investment.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                ))}
                
                {userInvestments.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No investments found.</p>
                    <p className="text-sm">Create your first investment using the "Deposit Funds" tab.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
