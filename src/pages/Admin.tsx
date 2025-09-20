import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Edit,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import EditCryptoModal from "@/components/admin/EditCryptoModal";

const Admin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [editingCrypto, setEditingCrypto] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchCryptos = async () => {
      const { data, error } = await supabase.from('cryptocurrencies').select('*');
      if (error) {
        console.error('Error fetching cryptocurrencies:', error);
      } else {
        setCryptos(data || []);
      }
    };
    fetchCryptos();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(from, to);

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
        setTotalUsers(count || 0);
      }
      setLoading(false);
    };

    const debounceFetch = setTimeout(() => {
      fetchUsers();
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceFetch);
  }, [currentPage, itemsPerPage, searchTerm]);

  const handleVerify = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'verified' })
      .eq('id', userId);

    if (error) {
      console.error('Error verifying user:', error);
    } else {
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: 'verified' } : user
      ));
    }
  };

  const handleSuspend = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', userId);

    if (error) {
      console.error('Error suspending user:', error);
    } else {
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: 'suspended' } : user
      ));
    }
  };

  const [adminStats, setAdminStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminStats = async () => {
      const { data: users, error: usersError, count: usersCount } = await supabase.from('profiles').select('id', { count: 'exact' });
      const { data: investments, error: investmentsError } = await supabase.from('investments').select('amount');
      const { data: activePlans, error: activePlansError, count: activePlansCount } = await supabase.from('investments').select('plan_name', { count: 'exact' }).eq('status', 'active');
      const { data: pendingWithdrawals, error: pendingWithdrawalsError, count: pendingWithdrawalsCount } = await supabase.from('withdrawals').select('id', { count: 'exact' }).eq('status', 'pending');

      if (usersError || investmentsError || activePlansError || pendingWithdrawalsError) {
        console.error("Error fetching admin stats:", usersError, investmentsError, activePlansError, pendingWithdrawalsError);
      } else {
        const totalUsers = usersCount || 0;
        const totalInvestments = investments?.reduce((acc, investment) => acc + investment.amount, 0) || 0;
        const activePlans = activePlansCount || 0;
        const pendingWithdrawals = pendingWithdrawalsCount || 0;

        const newAdminStats = [
          {
            title: "Total Users",
            value: totalUsers.toLocaleString(),
            icon: Users,
            color: "text-blue-500"
          },
          {
            title: "Total Investments",
            value: `${totalInvestments.toLocaleString()}`,
            icon: DollarSign,
            color: "text-green-500"
          },
          {
            title: "Active Plans",
            value: activePlans.toLocaleString(),
            icon: TrendingUp,
            color: "text-yellow-500"
          },
          {
            title: "Pending Withdrawals",
            value: pendingWithdrawals.toLocaleString(),
            icon: AlertTriangle,
            color: "text-red-500"
          }
        ];
        setAdminStats(newAdminStats);
      }
    };

    fetchAdminStats();
  }, []);

  useEffect(() => {
    const profilesSubscription = supabase.channel('profiles-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Change received!', payload)
          fetchAdminStats();
        }
      )
      .subscribe()

    const investmentsSubscription = supabase.channel('investments-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments' },
        (payload) => {
          console.log('Change received!', payload)
          fetchAdminStats();
        }
      )
      .subscribe()

    const withdrawalsSubscription = supabase.channel('withdrawals-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        (payload) => {
          console.log('Change received!', payload)
          fetchAdminStats();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(investmentsSubscription);
      supabase.removeChannel(withdrawalsSubscription);
    };
  }, []);

  const withdrawalRequests = [
    {
      id: "WD001",
      user: "John Smith",
      amount: "$500",
      wallet: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
      date: "2024-01-16",
      status: "Pending"
    },
    {
      id: "WD002",
      user: "Emma Davis",
      amount: "$1,200",
      wallet: "0x742d35Cc6639C0532fF79e49Cd0891B5",
      date: "2024-01-15",
      status: "Pending"
    },
    {
      id: "WD003",
      user: "Mike Wilson",
      amount: "$800",
      wallet: "TQrZ4X5k2fV8yH3nNz7Gx9pK4mL8Qq1W",
      date: "2024-01-14",
      status: "Approved"
    }
  ];

  const investmentPlans = [
    {
      name: "Starter Plan",
      minAmount: "$100",
      maxAmount: "$999",
      dailyReturn: "0.5%",
      duration: "30 days",
      status: "Active"
    },
    {
      name: "Silver Plan",
      minAmount: "$1,000", 
      maxAmount: "$4,999",
      dailyReturn: "0.8%",
      duration: "60 days",
      status: "Active"
    },
    {
      name: "Gold Plan",
      minAmount: "$5,000",
      maxAmount: "$9,999", 
      dailyReturn: "1.2%",
      duration: "90 days",
      status: "Active"
    },
    {
      name: "VIP Plan",
      minAmount: "$10,000",
      maxAmount: "Unlimited",
      dailyReturn: "1.8%",
      duration: "180 days",
      status: "Active"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <EditCryptoModal
        crypto={editingCrypto}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(updatedCrypto) => {
          setCryptos(cryptos.map(c => c.id === updatedCrypto.id ? updatedCrypto : c));
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, investments, and platform settings</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
          <Settings className="h-4 w-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => (
          <Card key={index} className="bg-gradient-card border-border shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="cryptocurrencies">Cryptocurrencies</TabsTrigger>
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
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}</h4>
                            <Badge 
                              variant={user.status === 'verified' ? 'default' : (user.status === 'suspended' ? 'destructive' : 'secondary')}
                              className={user.status === 'verified' ? 'bg-success' : ''}
                            >
                              {user.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id} • Joined: {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/admin/users/${user.id}/investments`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </Link>
                          {user.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleVerify(user.id)}>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                          )}
                          {user.status === 'verified' && (
                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleSuspend(user.id)}>
                              <UserX className="h-3 w-3 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {user.status === 'suspended' && (
                            <Button variant="outline" size="sm" onClick={() => handleVerify(user.id)}>
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
                      Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalUsers)} to {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} users
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
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

        <TabsContent value="withdrawals" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>
                Review and process user withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawalRequests.map((request, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{request.user}</h4>
                        <Badge variant={request.status === 'Pending' ? 'secondary' : 'default'}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Amount: {request.amount} • Date: {request.date}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Wallet: {request.wallet}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'Pending' && (
                        <>
                          <Button variant="outline" size="sm" className="text-success border-success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive border-destructive">
                            <UserX className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === 'Approved' && (
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



        <TabsContent value="cryptocurrencies" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Cryptocurrency Management</CardTitle>
              <CardDescription>
                Manage cryptocurrency wallet addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptos.map((crypto) => (
                  <div key={crypto.id} className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
                    <div className="space-y-1">
                      <h4 className="font-medium">{crypto.name} ({crypto.symbol})</h4>
                      <p className="text-sm text-muted-foreground font-mono">{crypto.address}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setEditingCrypto(crypto); setIsEditModalOpen(true); }}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                ))}
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Platform Settings</h4>
                  <div className="space-y-2">
                    <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount</Label>
                    <Input id="minWithdrawal" defaultValue="$50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxWithdrawal">Maximum Withdrawal Amount</Label>
                    <Input id="maxWithdrawal" defaultValue="$10,000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalFee">Withdrawal Fee (%)</Label>
                    <Input id="withdrawalFee" defaultValue="2%" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Referral Settings</h4>
                  <div className="space-y-2">
                    <Label htmlFor="level1Commission">Level 1 Commission (%)</Label>
                    <Input id="level1Commission" defaultValue="10%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level2Commission">Level 2 Commission (%)</Label>
                    <Input id="level2Commission" defaultValue="5%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level3Commission">Level 3 Commission (%)</Label>
                    <Input id="level3Commission" defaultValue="2%" />
                  </div>
                </div>
              </div>
              
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
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