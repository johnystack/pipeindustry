import { useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Wallet,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCryptos } from "@/hooks/useCryptos";
import { useWithdrawableBalance } from "@/hooks/useWithdrawableBalance";
import { useWithdrawalHistory } from "@/hooks/useWithdrawalHistory";
import { getConversionRate } from "@/lib/utils";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Withdraw = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptDataUrl, setReceiptDataUrl] = useState('');

  const { cryptos, loading: loadingCryptos } = useCryptos();
  const { balance: withdrawableBalance, loading: loadingBalance } = useWithdrawableBalance();
  const { history: withdrawalHistory, loading: loadingHistory, setHistory } = useWithdrawalHistory();

  const selectedCryptoData = cryptos.find((c) => c.id === selectedCrypto);
  const receiveAmount =
    selectedCryptoData && amount
      ? (parseFloat(amount) - selectedCryptoData.fee).toFixed(6)
      : "0";

  const handleWithdraw = async () => {
    if (!amount || !address) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedCryptoData && parseFloat(amount) > withdrawableBalance) {
      toast({
        title: "Error",
        description: "You cannot withdraw more than your available balance.",
        variant: "destructive",
      });
      return;
    }

    setIsWithdrawing(true);
    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        type: "withdrawal",
        amount: Number(amount),
        status: "pending",
        description: `Withdrawal to ${address}`,
        withdrawal_type: "to_wallet",
        crypto: selectedCrypto,
        address: address,
      },
    ]);

    if (error) {
      console.error("Error inserting withdrawal:", error);
      toast({
        title: "Error requesting withdrawal",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Withdrawal Requested",
        description:
          "Your withdrawal request has been submitted for processing",
      });
      setAmount("");
      setAddress("");
    }
    setIsWithdrawing(false);
  };

  const handleGenerateReceipt = async (transaction: any) => {
    console.log("Generating receipt for transaction:", transaction);
    // Fetch user details for the receipt
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user details for receipt:', userError);
      toast({ title: "Error generating receipt", description: "Could not fetch user details.", variant: "destructive" });
      return;
    }
    console.log("User data for receipt:", userData);

    const companyName = "Pipe Industry"; // Replace with actual company name

    const receiptElement = document.createElement('div');
    receiptElement.style.width = '300px';
    receiptElement.style.fontFamily = 'Courier New, monospace';
    receiptElement.style.fontSize = '12px';
    receiptElement.style.padding = '10px';
    receiptElement.style.backgroundColor = 'white';

    receiptElement.innerHTML = `
      <div style="text-align: center; margin-bottom: 10px;">
        <h1 style="font-size: 16px; margin: 0;">${companyName}</h1>
        <p style="font-size: 10px; margin: 0;">Official Withdrawal Receipt</p>
      </div>

      <div style="margin-bottom: 10px;">
        <p><strong>Receipt No:</strong> ${transaction.id.substring(0, 8).toUpperCase()}</p>
        <p><strong>Date:</strong> ${new Date(transaction.created_at).toLocaleString()}</p>
      </div>

      <div style="margin-bottom: 10px;">
        <p><strong>Recipient:</strong> ${userData.first_name} ${userData.last_name}</p>
        <p><strong>Email:</strong> ${userData.email}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 1px solid #000;">Description</th>
            <th style="text-align: right; border-bottom: 1px solid #000;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Withdrawal to ${transaction.crypto}</td>
            <td style="text-align: right;">$${transaction.amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Wallet Address</td>
            <td style="text-align: right;">${transaction.address}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td style="text-align: right;">${transaction.status}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 10px;">
        <p style="font-size: 14px; font-weight: bold;">TOTAL: $${transaction.amount.toLocaleString()}</p>
        <p style="font-size: 10px;">Thank you for your transaction!</p>
      </div>
    `;
    document.body.appendChild(receiptElement); // Append to body

    const canvas = await html2canvas(receiptElement, { scale: 2, width: 300, height: receiptElement.scrollHeight }); // Increase scale for better quality
    const imgData = canvas.toDataURL('image/png');
    document.body.removeChild(receiptElement); // Remove from body

    setReceiptDataUrl(imgData);
    setShowReceiptModal(true);
  };

    const handleShare = async () => {
    if (navigator.share) {
      try {
        const response = await fetch(receiptDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'withdrawal-receipt.png', { type: 'image/png' });

        await navigator.share({
          title: 'Withdrawal Receipt',
          text: 'Check out my withdrawal receipt!',
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing receipt:', error);
        toast({ title: "Error sharing receipt", description: "Could not share receipt.", variant: "destructive" });
      }
    } else {
      toast({ title: "Share not supported", description: "Your browser does not support the Web Share API.", variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "pending":
        return <Clock className="h-4 w-4 text-warning" />;
      case "processing":
        return <ArrowDownToLine className="h-4 w-4 text-accent" />;
      default:
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Withdraw Funds
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Withdraw your earnings to your personal cryptocurrency wallet. All
          withdrawals are processed within 24 hours.
        </p>
      </div>

      <Tabs defaultValue="withdraw" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="withdraw">New Withdrawal</TabsTrigger>
          <TabsTrigger value="history">Withdrawal History</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Withdrawal Form */}
            <Card className="crypto-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Withdrawal Request
                </CardTitle>
                <CardDescription>
                  Enter details for your cryptocurrency withdrawal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingCryptos ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
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
                                <span className="text-xs text-muted-foreground">
                                  (
                                  {(
                                    withdrawableBalance *
                                    getConversionRate(crypto.symbol)
                                  ).toFixed(6)}{" "}
                                  available)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder={`Min: ${selectedCryptoData?.min_withdraw} ${selectedCryptoData?.symbol}`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-background/50"
                      />
                      {selectedCryptoData && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            Available:{" "}
                            {(
                              withdrawableBalance *
                              getConversionRate(selectedCryptoData.symbol)
                            ).toFixed(6)}{" "}
                            {selectedCryptoData.symbol}
                          </span>

                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() =>
                              setAmount(
                                (
                                  withdrawableBalance *
                                  getConversionRate(selectedCryptoData.symbol)
                                ).toFixed(6),
                              )
                            }
                          >
                            Use Max
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Wallet Address</Label>
                      <Input
                        id="address"
                        placeholder={`Enter ${selectedCryptoData?.name} address`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>

                    {selectedCryptoData && (
                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Network:</span>
                          <Badge variant="outline">
                            {selectedCryptoData.network}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Withdrawal Fee:</span>
                          <span>
                            {selectedCryptoData.fee} {selectedCryptoData.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>You will receive:</span>
                          <span className="font-medium">
                            {receiveAmount} {selectedCryptoData.symbol}
                          </span>
                        </div>
                      </div>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full crypto-button-primary" disabled={isWithdrawing}>
                          {isWithdrawing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            "Request Withdrawal"
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-warning" />
                            Confirm Withdrawal
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleWithdraw}>
                            Confirm Withdrawal
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Withdrawable Balance */}
            <Card className="crypto-card">
              <CardHeader>
                <CardTitle>Withdrawable Balance</CardTitle>
                <CardDescription>
                  Your current cryptocurrency holdings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingBalance ? (
                  <div className="flex justify-center items-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                    <div>
                      <div className="font-medium">
                        Withdrawable Balance
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        $
                        {(withdrawableBalance || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <Wallet className="h-8 w-8 text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="crypto-card">
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>
                Track your recent withdrawal requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawalHistory.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(withdrawal.status)}
                          <div>
                            <div className="font-medium">
                              {withdrawal.description}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {withdrawal.withdrawal_type === "to_balance"
                                ? "Internal Transfer"
                                : "External Withdrawal"}
                            </div>
                            {withdrawal.withdrawal_type === "to_wallet" && (
                              <div className="text-xs text-muted-foreground">
                                To:{" "}
                                {withdrawal.address
                                  ? `${withdrawal.address.slice(0, 10)}...${withdrawal.address.slice(-6)}`
                                  : "N/A"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            withdrawal.status === "completed"
                              ? "status-completed"
                              : withdrawal.status === "pending"
                                ? "status-pending"
                                : "status-active"
                          }
                        >
                          {withdrawal.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-lg font-semibold">
                          ${withdrawal.amount.toLocaleString()}
                        </div>
                        {withdrawal.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleGenerateReceipt(withdrawal)}
                          >
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Modal */}
      <AlertDialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <AlertDialogContent className="max-w-sm w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Withdrawal Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              <img src={receiptDataUrl} alt="Withdrawal Receipt" className="" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowReceiptModal(false)}>Close</Button>
            <Button onClick={handleShare}>Share</Button>
            <Button asChild>
              <a href={receiptDataUrl} download="withdrawal-receipt.png">
                Download
              </a>
            </Button>
            {/* Share button can be added here, but requires more complex implementation */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Withdraw;
