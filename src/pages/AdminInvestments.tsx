import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Copy,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Investment {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  crypto: string;
  status: string;
  expected_profit: number;
  daily_return: number;
  duration: number;
  due_date: string;
  payment_proof?: string;
  payment_proof_uploaded_at?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    username?: string;
  };
  vendor_plans?: {
    name: string;
    asset_type: string;
    vendor_name?: string;
  };
}

const AdminInvestments = () => {
  const [pendingInvestments, setPendingInvestments] = useState<Investment[]>([]);
  const [awaitingProofInvestments, setAwaitingProofInvestments] = useState<Investment[]>([]);
  const [approvedInvestments, setApprovedInvestments] = useState<Investment[]>([]);
  const [allInvestments, setAllInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchInvestments = async () => {
    setLoading(true);
    
    try {
      // First, let's try a simple query to see what's available
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching investments:", error);
        toast({
          title: "Error",
          description: `Failed to fetch investments: ${error.message}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("Raw investments data:", data);

      // If we have investments, try to enrich them with user and plan data
      if (data && data.length > 0) {
        const enrichedInvestments = await Promise.all(
          data.map(async (investment) => {
            let enrichedInvestment = { ...investment };

            // Fetch user profile if user_id exists
            if (investment.user_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name, email, username")
                .eq("id", investment.user_id)
                .single();
              
              if (profile) {
                enrichedInvestment.profiles = profile;
              }
            }

            // Fetch vendor plan if plan_id exists
            if (investment.plan_id) {
              const { data: plan } = await supabase
                .from("vendor_plans")
                .select("name, asset_type")
                .eq("id", investment.plan_id)
                .single();
              
              if (plan) {
                enrichedInvestment.vendor_plans = plan;
              }
            }

            return enrichedInvestment;
          })
        );

        const investments = enrichedInvestments;
        
        // Separate investments by status
        setPendingInvestments(investments.filter(inv => inv.status === 'pending'));
        setAwaitingProofInvestments(investments.filter(inv => inv.status === 'awaiting_proof'));
        setApprovedInvestments(investments.filter(inv => inv.status === 'approved'));
        setAllInvestments(investments);
      } else {
        // No investments found
        setPendingInvestments([]);
        setAwaitingProofInvestments([]);
        setApprovedInvestments([]);
        setAllInvestments([]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching investments",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleApproveInvestment = async (investmentId: string) => {
    const { error } = await supabase
      .from("investments")
      .update({ 
        status: "approved",
        approved_at: new Date().toISOString()
      })
      .eq("id", investmentId);

    if (error) {
      console.error("Error approving investment:", error);
      toast({
        title: "Error",
        description: "Failed to approve investment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Investment approved successfully!",
      });
      fetchInvestments();
    }
  };

  const handleRejectInvestment = async (investmentId: string) => {
    const { error } = await supabase
      .from("investments")
      .update({ status: "rejected" })
      .eq("id", investmentId);

    if (error) {
      console.error("Error rejecting investment:", error);
      toast({
        title: "Error",
        description: "Failed to reject investment",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Investment rejected",
      });
      fetchInvestments();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "awaiting_proof":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Awaiting Proof</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-blue-600">Pending Review</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awaiting_proof":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const InvestmentCard = ({ investment, showActions = false }: { investment: Investment; showActions?: boolean }) => (
    <div className="p-6 border-2 rounded-2xl bg-background/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-black text-lg">{investment.plan_name}</h4>
            <p className="text-sm text-muted-foreground">
              {investment.vendor_plans?.asset_type} • {investment.profiles?.first_name} {investment.profiles?.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(investment.status)}
          {getStatusBadge(investment.status)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground uppercase font-bold">Investment Amount</p>
          <p className="font-black text-primary">₦{investment.amount.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground uppercase font-bold">Expected Profit</p>
          <p className="font-black text-emerald-500">₦{investment.expected_profit?.toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">User Email:</span>
          <span className="font-medium">{investment.profiles?.email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-medium">{investment.duration} days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Created:</span>
          <span className="font-medium">{new Date(investment.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {investment.payment_proof && (
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-bold text-blue-600 uppercase">Payment Proof</Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(investment.payment_proof || "")}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-sm font-mono break-all">{investment.payment_proof}</p>
          {investment.payment_proof_uploaded_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Uploaded: {new Date(investment.payment_proof_uploaded_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {showActions && investment.status === 'pending' && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={() => handleApproveInvestment(investment.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Investment
          </Button>
          <Button
            onClick={() => handleRejectInvestment(investment.id)}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject Investment
          </Button>
        </div>
      )}
    </div>
  );

  const filteredInvestments = (investments: Investment[]) => {
    if (!searchTerm) return investments;
    return investments.filter(inv => 
      inv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investment Management</h1>
          <p className="text-muted-foreground">
            Manage trader investments and payment approvals
          </p>
        </div>
        <Button onClick={fetchInvestments} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvestments.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Proof</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awaitingProofInvestments.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedInvestments.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allInvestments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending Review ({pendingInvestments.length})
          </TabsTrigger>
          <TabsTrigger value="awaiting">
            Awaiting Proof ({awaitingProofInvestments.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedInvestments.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Investments ({allInvestments.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center">
          <Input
            placeholder="Search by user email, name, or plan..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <TabsContent value="pending" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-blue-600">Investments Pending Admin Review</CardTitle>
              <CardDescription>
                These investments have payment proof uploaded and need admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvestments(pendingInvestments).map((investment) => (
                  <InvestmentCard key={investment.id} investment={investment} showActions={true} />
                ))}
                {filteredInvestments(pendingInvestments).length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No investments pending review</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="awaiting" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-yellow-600">Investments Awaiting Payment Proof</CardTitle>
              <CardDescription>
                These investments are waiting for traders to upload payment proof
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvestments(awaitingProofInvestments).map((investment) => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}
                {filteredInvestments(awaitingProofInvestments).length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No investments awaiting payment proof</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-green-600">Approved Investments</CardTitle>
              <CardDescription>
                These investments have been approved and are active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvestments(approvedInvestments).map((investment) => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}
                {filteredInvestments(approvedInvestments).length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No approved investments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>All Investments</CardTitle>
              <CardDescription>
                Complete list of all investments in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvestments(allInvestments).map((investment) => (
                  <InvestmentCard key={investment.id} investment={investment} />
                ))}
                {filteredInvestments(allInvestments).length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No investments found</p>
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

export default AdminInvestments;