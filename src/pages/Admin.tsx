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
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Minus,
  Edit,
  Loader2,
  Copy,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import EditCryptoModal from "@/components/admin/EditCryptoModal";
import GiveBonusModal from '@/components/admin/GiveBonusModal';
import { DeductBalanceModal } from '@/components/admin/DeductBalanceModal';
import { User, Crypto, AdminStat, Transaction, VendorPlan, VendorPaymentWallet } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [editingCrypto, setEditingCrypto] = useState<Crypto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isDeductBalanceModalOpen, setIsDeductBalanceModalOpen] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<Transaction[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStat[]>([]);
  const [pendingPlans, setPendingPlans] = useState<VendorPlan[]>([]);
  const [approvedPlans, setApprovedPlans] = useState<VendorPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [vendorWallets, setVendorWallets] = useState<VendorPaymentWallet[]>([]);
  const [newWallet, setNewWallet] = useState({ name: '', address: '', network: '' });
  const [traderInvestments, setTraderInvestments] = useState<any[]>([]);
  const [vendorInvestments, setVendorInvestments] = useState<VendorPlan[]>([]);

  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
      } else {
        setSettings(data || {});
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    const { error } = await supabase
      .from('settings')
      .update(settings)
      .eq('id', 1);

    if (error) {
      console.error('Error saving settings:', error);
    } else {
      // Optionally, show a success toast
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .range(from, to);

    if (searchTerm) {
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
      setTotalUsers(count || 0);
    }
    setLoading(false);
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchCryptos = async () => {
    const { data, error } = await supabase
      .from("cryptocurrencies")
      .select("*");
    if (error) {
      console.error("Error fetching cryptocurrencies:", error);
    } else {
      setCryptos(data || []);
    }
  };

  const fetchAdminStats = async () => {
    const {
      data: users,
      error: usersError,
      count: usersCount,
    } = await supabase.from("profiles").select("id", { count: "exact" });
    const { data: investments, error: investmentsError } = await supabase
      .from("investments")
      .select("amount");
    const {
      data: activePlans,
      error: activePlansError,
      count: activePlansCount,
    } = await supabase
      .from("vendor_plans")
      .select("id", { count: "exact" })
      .eq("status", "active")
      .eq("eligibility_status", "approved");
    const {
      data: pendingWithdrawals,
      error: pendingWithdrawalsError,
      count: pendingWithdrawalsCount,
    } = await supabase
      .from("transactions")
      .select("id", { count: "exact" })
      .eq("status", "pending");

    if (
      usersError ||
      investmentsError ||
      activePlansError ||
      pendingWithdrawalsError
    ) {
      console.error(
        "Error fetching admin stats:",
        usersError,
        investmentsError,
        activePlansError,
        pendingWithdrawalsError,
      );
    } else {
      const totalUsers = usersCount || 0;
      const totalInvestments =
        investments?.reduce(
          (acc, investment: { amount: number }) => acc + investment.amount,
          0,
        ) || 0;
      const activePlans = activePlansCount || 0;
      const pendingWithdrawals = pendingWithdrawalsCount || 0;

      const newAdminStats = [
        {
          title: "Total Users",
          value: totalUsers.toLocaleString(),
          icon: Users,
          color: "text-blue-500",
        },
        {
          title: "Total Investments",
          value: `${totalInvestments.toLocaleString()}`,
          icon: DollarSign,
          color: "text-green-500",
        },
        {
          title: "Active Plans",
          value: activePlans.toLocaleString(),
          icon: TrendingUp,
          color: "text-yellow-500",
        },
        {
          title: "Pending Withdrawals",
          value: pendingWithdrawals.toLocaleString(),
          icon: AlertTriangle,
          color: "text-red-500",
        },
      ];
      setAdminStats(newAdminStats);
    }
  };

  const fetchWithdrawalRequests = async () => {
    setLoadingWithdrawals(true);
    console.log("Fetching withdrawal requests...");
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "withdrawal")
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching withdrawal requests:", error);
      console.log("Error details:", error);
      setLoadingWithdrawals(false);
      return;
    }

    if (!transactions) {
      setWithdrawalRequests([]);
      setLoadingWithdrawals(false);
      return;
    }

    const userIds = transactions.map((t) => t.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email") // Select only necessary profile fields
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setWithdrawalRequests(transactions); // Show transactions without profiles
      setLoadingWithdrawals(false);
      return;
    }

    const withdrawals = transactions.map((t) => {
      const profile = profiles.find((p) => p.id === t.user_id);
      return { ...t, profiles: profile };
    });

    console.log("Fetched withdrawal requests:", withdrawals);
    setWithdrawalRequests(withdrawals);
    setLoadingWithdrawals(false);
  };

  const fetchPendingPlans = async () => {
    setLoadingPlans(true);
    const { data, error } = await supabase
      .from("vendor_plans")
      .select(`
        *,
        profiles(username, first_name, last_name, email)
      `)
      .eq("eligibility_status", "pending");

    if (error) {
      console.error("Error fetching pending plans:", error);
    } else {
      const mappedPlans = data?.map((plan: any) => ({
        ...plan,
        vendor_name: plan.profiles?.username || `${plan.profiles?.first_name} ${plan.profiles?.last_name}`.trim() || plan.profiles?.email || "Unknown Vendor"
      })) || [];
      setPendingPlans(mappedPlans);
    }
    setLoadingPlans(false);
  };

  const fetchApprovedPlans = async () => {
    const { data, error } = await supabase
      .from("vendor_plans")
      .select(`
        *,
        profiles(username, first_name, last_name, email)
      `)
      .eq("eligibility_status", "approved");

    if (error) {
      console.error("Error fetching approved plans:", error);
    } else {
      const mappedPlans = data?.map((plan: any) => ({
        ...plan,
        vendor_name: plan.profiles?.username || `${plan.profiles?.first_name} ${plan.profiles?.last_name}`.trim() || plan.profiles?.email || "Unknown Vendor"
      })) || [];
      setApprovedPlans(mappedPlans);
    }
  };

  const fetchVendorWallets = async () => {
    const { data, error } = await supabase
      .from("vendor_payment_wallets")
      .select("*")
      .order("name");
    if (error) {
      console.error("Error fetching vendor wallets:", error);
    } else {
      setVendorWallets(data || []);
    }
  };

  const fetchTraderInvestments = async () => {
    try {
      // First try simple query
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching trader investments:", error);
        setTraderInvestments([]);
        return;
      }

      console.log("Raw trader investments:", data);

      // Enrich with user and plan data if available
      if (data && data.length > 0) {
        const enrichedInvestments = await Promise.all(
          data.map(async (investment) => {
            let enrichedInvestment = { ...investment };

            // Fetch user profile
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

            // Fetch vendor plan
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

        setTraderInvestments(enrichedInvestments);
      } else {
        setTraderInvestments([]);
      }
    } catch (error) {
      console.error("Unexpected error fetching trader investments:", error);
      setTraderInvestments([]);
    }
  };

  const fetchVendorInvestments = async () => {
    const { data, error } = await supabase
      .from("vendor_plans")
      .select(`
        *,
        profiles(first_name, last_name, email, username)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vendor investments:", error);
    } else {
      const mappedPlans = data?.map((plan: any) => ({
        ...plan,
        vendor_name: plan.profiles?.username || `${plan.profiles?.first_name} ${plan.profiles?.last_name}`.trim() || plan.profiles?.email || "Unknown Vendor"
      })) || [];
      setVendorInvestments(mappedPlans);
    }
  };

  const handleApproveTraderInvestment = async (investmentId: string) => {
    const { error } = await supabase
      .from("investments")
      .update({ status: "approved" })
      .eq("id", investmentId);

    if (error) {
      console.error("Error approving investment:", error);
      alert(`Error approving investment: ${error.message}`);
    } else {
      alert("Investment approved successfully! It will now appear in the vendor's dashboard.");
      fetchTraderInvestments();
    }
  };

  const handleRejectTraderInvestment = async (investmentId: string) => {
    const { error } = await supabase
      .from("investments")
      .update({ status: "rejected" })
      .eq("id", investmentId);

    if (error) {
      console.error("Error rejecting investment:", error);
    } else {
      fetchTraderInvestments();
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCryptos();
    fetchAdminStats();
    fetchWithdrawalRequests();
    fetchPendingPlans();
    fetchApprovedPlans();
    fetchVendorWallets();
    fetchTraderInvestments();
    fetchVendorInvestments();
  }, [fetchUsers]);

  const handleApprovePlan = async (planId: string) => {
    console.log("Approving plan:", planId);
    const { data, error } = await supabase
      .from("vendor_plans")
      .update({ eligibility_status: "approved", status: "active" })
      .eq("id", planId)
      .select();

    if (error) {
      console.error("Error approving plan:", error);
      alert(`Error approving plan: ${error.message}`);
    } else {
      console.log("Plan approved successfully:", data);
      setPendingPlans(pendingPlans.filter((p) => p.id !== planId));
      fetchApprovedPlans(); // Refresh approved plans
      fetchAdminStats(); // Refresh stats
      alert("Plan approved successfully!");
    }
  };

  const handleRejectPlan = async (planId: string) => {
    const { error } = await supabase
      .from("vendor_plans")
      .update({ eligibility_status: "rejected" })
      .eq("id", planId);

    if (error) {
      console.error("Error rejecting plan:", error);
    } else {
      setPendingPlans(pendingPlans.filter((p) => p.id !== planId));
    }
  };

  const handleVerify = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "verified" })
      .eq("id", userId);

    if (error) {
      console.error("Error verifying user:", error);
    } else {
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: "verified" } : user,
        ),
      );
    }
  };

  const handleSuspend = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "suspended" })
      .eq("id", userId);

    if (error) {
      console.error("Error suspending user:", error);
    } else {
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: "suspended" } : user,
        ),
      );
    }
  };

  const handleApprove = async (transaction: any) => {
    const { error } = await supabase.rpc('approve_withdrawal', {
      withdrawal_id: transaction.id,
    });

    if (error) {
      console.error('Error approving transaction:', error);
      alert(`Error approving transaction: ${error.message}`);
    } else {
      setWithdrawalRequests(
        withdrawalRequests.filter((req) => req.id !== transaction.id),
      );
    }
  };

  const handleReject = async (transactionId: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', transactionId);

    if (error) {
      console.error('Error rejecting transaction:', error);
    } else {
      setWithdrawalRequests(
        withdrawalRequests.map((req) =>
          req.id === transactionId ? { ...req, status: 'rejected' } : req,
        ),
      );
    }
  };

  const handleAddVendorWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding wallet:', newWallet);

    if (!newWallet.name || !newWallet.address) {
      alert('Please fill in wallet name and address');
      return;
    }

    const walletData = {
      name: newWallet.name,
      symbol: newWallet.name, // Use name as symbol
      address: newWallet.address,
      network: newWallet.network || newWallet.name
    };

    console.log('Inserting wallet data:', walletData);

    const { data, error } = await supabase
      .from('vendor_payment_wallets')
      .insert([walletData])
      .select();

    if (error) {
      console.error('Error adding vendor wallet:', error);
      alert(`Error adding wallet: ${error.message}`);
    } else {
      console.log('Wallet added successfully:', data);
      setNewWallet({ name: '', address: '', network: '' });
      fetchVendorWallets();
      alert('Wallet added successfully!');
    }
  };

  const handleToggleVendorWallet = async (walletId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('vendor_payment_wallets')
      .update({ is_active: !isActive })
      .eq('id', walletId);

    if (error) {
      console.error('Error toggling vendor wallet:', error);
    } else {
      fetchVendorWallets();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {selectedUser && (
        <GiveBonusModal
          isOpen={isBonusModalOpen}
          onClose={() => setIsBonusModalOpen(false)}
          user={selectedUser}
          onBonusAdded={() => {
            fetchUsers(); // Refetch users to show updated balance
          }}
        />
      )}
      {selectedUser && (
        <DeductBalanceModal
          userId={selectedUser.id}
          isOpen={isDeductBalanceModalOpen}
          onOpenChange={setIsDeductBalanceModalOpen}
          onClose={() => {
            fetchUsers(); // Refetch users to show updated balance
            setIsDeductBalanceModalOpen(false);
          }}
        />
      )}
      <EditCryptoModal
        crypto={editingCrypto}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(updatedCrypto) => {
          setCryptos(
            cryptos.map((c) => (c.id === updatedCrypto.id ? updatedCrypto : c)),
          );
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, investments, and platform settings
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-glow w-auto">
          <Settings className="h-4 w-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {adminStats.map((stat, index) => (
          <Card
            key={index}
            className="bg-gradient-card border-border shadow-card"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="plans">Asset Plans</TabsTrigger>
          <TabsTrigger value="investments">Trader Investments</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="vendor-wallets">Company Wallets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, statuses, and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Input
                    placeholder="Search users..."
                    className="max-w-sm bg-background/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.email}
                            </h4>
                            <Badge
                              variant={
                                user.status === "verified"
                                  ? "default"
                                  : user.status === "suspended"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className={
                                user.status === "verified" ? "bg-success" : ""
                              }
                            >
                              {user.status}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {user.role || 'trader'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email} - Balance: ₦{user.withdrawable_balance?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id} • Joined:{" "}
                            {new Date(user.created_at || "").toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsBonusModalOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Bonus
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeductBalanceModalOpen(true);
                            }}
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Deduct
                          </Button>
                          <Link to={`/admin/users/${user.id}/investments`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </Link>
                          {user.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerify(user.id)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                          )}
                          {user.status === "verified" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleSuspend(user.id)}
                            >
                              <UserX className="h-3 w-3 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {user.status === "suspended" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerify(user.id)}
                            >
                              <UserCheck className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Showing{" "}
                      {Math.min(
                        (currentPage - 1) * itemsPerPage + 1,
                        totalUsers,
                      )}{" "}
                      to {Math.min(currentPage * itemsPerPage, totalUsers)} of{" "}
                      {totalUsers} users
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={currentPage * itemsPerPage >= totalUsers}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          {/* Pending Plans Section */}
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Asset Plan Approvals</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchPendingPlans} disabled={loadingPlans}>
                  {loadingPlans ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
              <CardDescription>
                Review commodity listing requests from vendors (₦5M Fee Verification)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-6 rounded-xl border bg-background/50 gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg">{plan.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="bg-primary/20 text-primary font-black uppercase text-[10px]">
                              {plan.asset_type}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-bold">
                              Vendor: {plan.vendor_name}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 bg-slate-900 rounded-lg border border-white/5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Expected ROI</p>
                          <p className="font-black text-emerald-500">50% / 24 Days</p>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg border border-white/5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Fixed Price</p>
                          <p className="font-black text-primary">₦{plan.min_investment.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <p className="text-[10px] font-bold uppercase text-yellow-600">Verification Proof (TX Hash)</p>
                        <div className="bg-slate-950 p-3 rounded-lg border border-yellow-500/20 relative group">
                          <code className="text-xs text-muted-foreground break-all block pr-8">
                            {plan.eligibility_tx || "No TX submitted"}
                          </code>
                          {plan.eligibility_tx && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 hover:bg-white/5"
                              onClick={() => {
                                navigator.clipboard.writeText(plan.eligibility_tx || "");
                                alert("TX Hash copied to clipboard");
                              }}
                            >
                              <Plus className="h-3 w-3 rotate-45" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs h-12 px-6 rounded-xl shadow-lg shadow-emerald-600/20"
                        onClick={() => handleApprovePlan(plan.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Plan
                      </Button>
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10 font-black uppercase text-xs h-12 px-6 rounded-xl"
                        onClick={() => handleRejectPlan(plan.id)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingPlans.length === 0 && !loadingPlans && (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground font-bold">No pending asset plans to approve.</p>
                    <p className="text-xs text-muted-foreground mt-1">Vendor plans will appear here after ₦5M fee submission.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Approved Plans Section */}
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Asset Plans</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchApprovedPlans}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Currently active and approved vendor asset plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-6 rounded-xl border bg-emerald-500/5 border-emerald-500/20 gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="font-black text-lg">{plan.name}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 font-black uppercase text-[10px]">
                              {plan.asset_type}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30">
                              Vendor: {plan.vendor_name}
                            </Badge>
                            <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                              ACTIVE
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-2 bg-slate-900 rounded-lg border border-emerald-500/20">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">ROI</p>
                          <p className="font-black text-emerald-500">50% / 24 Days</p>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg border border-emerald-500/20">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Price</p>
                          <p className="font-black text-primary">₦{plan.min_investment.toLocaleString()}</p>
                        </div>
                        <div className="p-2 bg-slate-900 rounded-lg border border-emerald-500/20">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                          <p className="font-black text-emerald-500">Live</p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(plan.created_at).toLocaleDateString()} •
                        TX: {plan.eligibility_tx ? `${plan.eligibility_tx.slice(0, 10)}...` : 'N/A'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Badge className="bg-emerald-500 text-white font-bold px-4 py-2">
                        ✓ APPROVED & LIVE
                      </Badge>
                    </div>
                  </div>
                ))}
                {approvedPlans.length === 0 && (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground font-bold">No approved asset plans yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Approved plans will appear here after vendor verification.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Trader Investments Pending Review */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-500" />
                  Pending Investment Reviews
                </CardTitle>
                <CardDescription>
                  Trader investments with payment proof awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {traderInvestments.filter(inv => inv.status === 'pending').map((investment) => (
                    <div
                      key={investment.id}
                      className="flex items-center justify-between p-4 rounded-xl border bg-background/50"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">
                            {investment.profiles?.first_name && investment.profiles?.last_name
                              ? `${investment.profiles.first_name} ${investment.profiles.last_name}`
                              : investment.profiles?.username || investment.profiles?.email || "Unknown User"}
                          </h4>
                          <Badge variant="secondary" className="text-blue-600">Pending Review</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {investment.vendor_plans?.name} ({investment.vendor_plans?.asset_type})
                        </p>
                        <p className="font-bold text-primary">₦{investment.amount.toLocaleString()}</p>
                        {investment.payment_proof && (
                          <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded">
                            <p className="text-xs font-bold text-blue-600 uppercase">Payment Proof</p>
                            <p className="text-xs font-mono break-all">{investment.payment_proof}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(investment.created_at || "").toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApproveTraderInvestment(investment.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => handleRejectTraderInvestment(investment.id)}
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}

                  {traderInvestments.filter(inv => inv.status === 'pending').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No investments pending review.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Awaiting Payment Proof */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Awaiting Payment Proof
                </CardTitle>
                <CardDescription>
                  Investments waiting for traders to upload payment proof
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {traderInvestments.filter(inv => inv.status === 'awaiting_proof').map((investment) => (
                    <div
                      key={investment.id}
                      className="p-4 rounded-xl border bg-background/50"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">
                            {investment.profiles?.first_name && investment.profiles?.last_name
                              ? `${investment.profiles.first_name} ${investment.profiles.last_name}`
                              : investment.profiles?.username || investment.profiles?.email || "Unknown User"}
                          </h4>
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">Awaiting Proof</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {investment.vendor_plans?.name} ({investment.vendor_plans?.asset_type})
                        </p>
                        <p className="font-bold text-primary">₦{investment.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(investment.created_at || "").toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {traderInvestments.filter(inv => inv.status === 'awaiting_proof').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No investments awaiting payment proof.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{traderInvestments.length}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <AlertTriangle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{traderInvestments.filter(inv => inv.status === 'pending').length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Awaiting Proof</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{traderInvestments.filter(inv => inv.status === 'awaiting_proof').length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{traderInvestments.filter(inv => inv.status === 'approved').length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Link to Full Investment Management */}
          <Card className="bg-gradient-card border-border shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Full Investment Management</h3>
                  <p className="text-muted-foreground">Access detailed investment management with advanced filtering and bulk actions</p>
                </div>
                <Button asChild className="bg-gradient-primary text-primary-foreground shadow-glow">
                  <Link to="/admin/investments">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Manage All Investments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Withdrawal Requests</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchWithdrawalRequests} disabled={loadingWithdrawals}>
                  {loadingWithdrawals ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
              <CardDescription>
                Review and process user withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawalRequests.map((request, index) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{request.profiles.first_name} {request.profiles.last_name}</h4>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Amount: ${request.amount} • Date: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Wallet: {request.address}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success border-success"
                            onClick={() => handleApprove(request)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive"
                            onClick={() => handleReject(request.id)}
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === "approved" && (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Processed
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-wallets" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Company Payment Wallets</CardTitle>
              <CardDescription>
                Manage company wallet addresses where vendors pay the ₦5M commitment fee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add New Wallet Form */}
                <form onSubmit={handleAddVendorWallet} className="grid grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                  <Input
                    placeholder="Wallet Name (e.g., Bitcoin)"
                    value={newWallet.name}
                    onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Network (e.g., Bitcoin)"
                    value={newWallet.network}
                    onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
                  />
                  <Input
                    placeholder="Wallet Address"
                    value={newWallet.address}
                    onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                    required
                  />
                  <Button type="submit" className="bg-gradient-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Wallet
                  </Button>
                </form>

                {/* Existing Wallets */}
                <div className="space-y-3">
                  {vendorWallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{wallet.name} ({wallet.symbol})</h4>
                          <Badge variant={wallet.is_active ? "default" : "secondary"}>
                            {wallet.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{wallet.network}</p>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {wallet.address}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(wallet.address);
                            alert('Address copied to clipboard');
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleVendorWallet(wallet.id, wallet.is_active)}
                        >
                          {wallet.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {vendorWallets.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No vendor payment wallets configured yet.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure platform settings and parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Platform Settings</h4>
                  <div className="space-y-2">
                    <Label htmlFor="minWithdrawal">
                      Minimum Withdrawal Amount
                    </Label>
                    <Input
                      id="minWithdrawal"
                      type="number"
                      value={settings.min_withdrawal_amount || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          min_withdrawal_amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxWithdrawal">
                      Maximum Withdrawal Amount
                    </Label>
                    <Input
                      id="maxWithdrawal"
                      type="number"
                      value={settings.max_withdrawal_amount || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          max_withdrawal_amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalFee">Withdrawal Fee (%)</Label>
                    <Input
                      id="withdrawalFee"
                      type="number"
                      value={settings.withdrawal_fee_percent || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          withdrawal_fee_percent: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Referral Settings</h4>
                  <div className="space-y-2">
                    <Label htmlFor="level1Commission">
                      Level 1 Commission (%)
                    </Label>
                    <Input
                      id="level1Commission"
                      type="number"
                      value={settings.level1_commission_percent || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          level1_commission_percent: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level2Commission">
                      Level 2 Commission (%)
                    </Label>
                    <Input
                      id="level2Commission"
                      type="number"
                      value={settings.level2_commission_percent || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          level2_commission_percent: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level3Commission">
                      Level 3 Commission (%)
                    </Label>
                    <Input
                      id="level3Commission"
                      type="number"
                      value={settings.level3_commission_percent || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          level3_commission_percent: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                className="bg-gradient-primary text-primary-foreground shadow-glow"
                onClick={handleSaveSettings}
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;