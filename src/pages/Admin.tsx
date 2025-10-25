import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ... (imports)

const Admin = () => {
  // ... (state variables)

  const handleApprove = async (transaction: any) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'approved' })
      .eq('id', transaction.id);

    if (error) {
      console.error('Error approving transaction:', error);
    } else {
      setWithdrawalRequests(
        withdrawalRequests.map((req) =>
          req.id === transaction.id ? { ...req, status: 'approved' } : req,
        ),
      );

      // Generate PDF
      const receiptElement = document.createElement('div');
      receiptElement.innerHTML = `
        <div class="p-8 bg-white rounded-lg shadow-md">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold">Withdrawal Receipt</h1>
            <p class="text-gray-500">Transaction ID: ${transaction.id}</p>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-8">
            <div>
              <p class="font-bold">User Details</p>
              <p>${transaction.profiles.first_name} ${transaction.profiles.last_name}</p>
              <p>${transaction.profiles.email}</p>
            </div>
            <div>
              <p class="font-bold">Transaction Details</p>
              <p>Amount: ${transaction.amount}</p>
              <p>Date: ${new Date(transaction.created_at).toLocaleDateString()}</p>
              <p>Status: approved</p>
            </div>
          </div>
          <div class="text-center">
            <p class="text-gray-500">Thank you for your transaction.</p>
          </div>
        </div>
      `;
      document.body.appendChild(receiptElement);

      html2canvas(receiptElement).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`withdrawal-receipt-${transaction.id}.pdf`);
        document.body.removeChild(receiptElement);
      });
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

  // ... (rest of the component)
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


  useEffect(() => {
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
    fetchCryptos();
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchUsers();
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceFetch);
  }, [fetchUsers]);

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

  const [adminStats, setAdminStats] = useState<AdminStat[]>([]);

  useEffect(() => {
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
        .from("investments")
        .select("plan_name", { count: "exact" })
        .eq("status", "active");
      const {
        data: pendingWithdrawals,
        error: pendingWithdrawalsError,
        count: pendingWithdrawalsCount,
      } = await supabase
        .from("withdrawals")
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

    fetchAdminStats();
  }, []);

  useEffect(() => {
    const profilesSubscription = supabase
      .channel("profiles-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("Change received!", payload);
          fetchAdminStats();
        },
      )
      .subscribe();

    const investmentsSubscription = supabase
      .channel("investments-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investments" },
        (payload) => {
          console.log("Change received!", payload);
          fetchAdminStats();
        },
      )
      .subscribe();

    const withdrawalsSubscription = supabase
      .channel("withdrawals-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "withdrawals" },
        (payload) => {
          console.log("Change received!", payload);
          fetchAdminStats();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(investmentsSubscription);
      supabase.removeChannel(withdrawalsSubscription);
    };
  }, []);

  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchWithdrawalRequests = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, profiles(*)")
        .eq("type", "withdrawal")
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching withdrawal requests:", error);
      } else {
        setWithdrawalRequests(data || []);
      }
    };

    fetchWithdrawalRequests();
  }, []);

  const investmentPlans = [
    {
      name: "Starter Plan",
      minAmount: "$100",
      maxAmount: "$999",
      dailyReturn: "0.5%",
      duration: "30 days",
      status: "Active",
    },
    {
      name: "Silver Plan",
      minAmount: "$1,000",
      maxAmount: "$4,999",
      dailyReturn: "0.8%",
      duration: "60 days",
      status: "Active",
    },
    {
      name: "Gold Plan",
      minAmount: "$5,000",
      maxAmount: "$9,999",
      dailyReturn: "1.2%",
      duration: "90 days",
      status: "Active",
    },
    {
      name: "VIP Plan",
      minAmount: "$10,000",
      maxAmount: "Unlimited",
      dailyReturn: "1.8%",
      duration: "180 days",
      status: "Active",
    },
  ];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, investments, and platform settings
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
          <Settings className="h-4 w-4 mr-2" />
          System Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.email} - Balance: ${user.withdrawable_balance?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {user.id} • Joined:{" "}
                            {new Date(user.created_at).toLocaleDateString(
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
                            Give Bonus
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
                            Deduct Balance
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
                  <div
                    key={crypto.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {crypto.name} ({crypto.symbol})
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {crypto.address}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCrypto(crypto);
                        setIsEditModalOpen(true);
                      }}
                    >
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
                    <Label htmlFor="minWithdrawal">
                      Minimum Withdrawal Amount
                    </Label>
                    <Input id="minWithdrawal" defaultValue="$50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxWithdrawal">
                      Maximum Withdrawal Amount
                    </Label>
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
                    <Label htmlFor="level1Commission">
                      Level 1 Commission (%)
                    </Label>
                    <Input id="level1Commission" defaultValue="10%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level2Commission">
                      Level 2 Commission (%)
                    </Label>
                    <Input id="level2Commission" defaultValue="5%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level3Commission">
                      Level 3 Commission (%)
                    </Label>
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
