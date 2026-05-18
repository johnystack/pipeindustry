import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
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
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Copy, Clock, CheckCircle2, AlertCircle, Wallet } from "lucide-react";

const VendorVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState<string>("not_applied");

  // Company verification wallet (static for now)
  const VERIFICATION_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
  const VERIFICATION_FEE = "$5,000,000.00";

  useEffect(() => {
    const fetchStatus = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("vendor_verification_status")
          .eq("id", user.id)
          .single();
        
        if (!error && data) {
          setStatus(data.vendor_verification_status || "not_applied");
        }
      }
    };
    fetchStatus();
  }, [user]);

  const handleApply = async () => {
    if (!txHash) {
      toast({
        title: "Transaction Hash Required",
        description: "Please provide the blockchain transaction hash for verification.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        vendor_verification_status: "pending",
        vendor_verification_tx: txHash,
      })
      .eq("id", user?.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStatus("pending");
      toast({
        title: "Application Submitted",
        description: "Your vendor application is now under review by our team.",
      });
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  if (status === "approved") {
      return (
          <div className="container mx-auto p-6 max-w-2xl text-center space-y-8">
              <div className="p-6 bg-emerald-500/10 rounded-full w-fit mx-auto">
                <CheckCircle2 className="h-20 w-20 text-emerald-500" />
              </div>
              <h1 className="text-4xl font-black">Vendor Verified!</h1>
              <p className="text-muted-foreground">Congratulations! You are now a verified vendor and can start posting commodity plans.</p>
              <Button onClick={() => navigate("/vendor-dashboard")} className="h-14 px-10 font-bold rounded-xl">
                  Go to Vendor Dashboard
              </Button>
          </div>
      );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-3">
            <ShieldCheck className="h-10 w-10 text-primary" />
            Vendor Verification
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Become a verified commodity supplier. Complete the blockchain verification to start listing your assets.
        </p>
      </div>

      <div className="grid gap-8">
        {status === "pending" ? (
            <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-black">Verification Pending</CardTitle>
                    <CardDescription className="text-lg">
                        Our administrative team is currently verifying your transaction. This process usually takes 2-6 hours.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                    <Button variant="outline" onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
                </CardContent>
            </Card>
        ) : (
            <>
                <Card className="border-2 shadow-xl overflow-hidden">
                    <div className="h-2 bg-primary" />
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Step 1: Elite Verification Payment</CardTitle>
                        <CardDescription>
                            To maintain the highest level of market integrity, all vendors must pay a minimal entry fee of $5 Million. 
                            Additionally, vendors are charged a monthly commission based on their active investor volume.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-6 bg-muted rounded-2xl space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-muted-foreground uppercase text-xs">Fee Amount</span>
                                <Badge className="bg-primary text-white text-lg px-4 py-1">{VERIFICATION_FEE}</Badge>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-muted-foreground">Company Verification Wallet (USDT/BTC/ETH)</Label>
                                <div className="flex gap-2">
                                    <Input value={VERIFICATION_WALLET} readOnly className="bg-background font-mono text-sm" />
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(VERIFICATION_WALLET)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground font-medium">
                                Please ensure you send the exact amount. Verification will be automatically processed once the transaction is confirmed on the blockchain.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">Step 2: Submit Proof</CardTitle>
                        <CardDescription>
                            Provide your transaction hash below for our team to verify your payment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="tx">Transaction Hash (TXID)</Label>
                            <Input 
                                id="tx" 
                                placeholder="Enter your transaction hash..." 
                                className="h-12"
                                value={txHash}
                                onChange={(e) => setTxHash(e.target.value)}
                            />
                        </div>
                        <Button 
                            className="w-full h-14 text-lg font-black shadow-xl shadow-primary/20" 
                            onClick={handleApply}
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Submit Application"}
                        </Button>
                    </CardContent>
                </Card>
            </>
        )}
      </div>
    </div>
  );
};

export default VendorVerification;
