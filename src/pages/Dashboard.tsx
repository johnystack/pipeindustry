import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { User, Investment, StatsData, Transaction } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [statsData, setStatsData] = useState<StatsData>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const { data, error } = await supabase.rpc('get_dashboard_data', { p_user_id: user.id });

        if (error) {
          console.error('Error fetching dashboard data:', error);
        } else {
          setProfile(data.profile);
          setInvestments(data.investments || []);
          setRecentTransactions(data.recent_transactions || []);

          const activeInvestments = (data.investments || []).filter(
            (investment: Investment) => investment.status === 'active'
          );

          const totalBalance = activeInvestments.reduce(
            (acc: number, investment: Investment) => acc + investment.amount,
            0
          );

          const activeInvestmentsCount = activeInvestments.length;

          const completedInvestments = (data.investments || []).filter((investment: Investment) =>
            ['completed', 'withdrawn'].includes(
              investment.status.trim().toLowerCase()
            )
          );

          const totalEarnings =
            completedInvestments.reduce(
              (acc: number, investment: Investment) => acc + Number(investment.return),
              0
            ) || 0;

          setStatsData({
            totalBalance,
            activeInvestments: activeInvestmentsCount,
            totalEarnings,
            withdrawableBalance: data.profile.withdrawable_balance,
            referralEarnings: data.profile.referral_earnings,
          });
        }
      }
    };

    fetchData();
  }, [user]);

  const getDailyPercentage = (planName: string) => {
    switch (planName) {
      case "Starter Plan":
        return 0.04;
      case "Silver Plan":
        return 0.06;
      case "Gold Plan":
        return 0.08;
      case "VIP Plan":
        return 0.1;
      default:
        return 0;
    }
  };

  const calculateProgress = (investment: Investment) => {
    if (investment.status !== "active" || !investment.approved_at) {
      return { progress: 0, days_left: 7 };
    }

    const approvedAt = new Date(investment.approved_at);
    const now = new Date();
    const daysPassed = Math.floor(
      (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const progress = Math.min(Math.floor((daysPassed / 7) * 100), 100);
    const daysLeft = Math.max(7 - daysPassed, 0);

    return { progress, days_left: daysLeft };
  };

  return (
    <div className="container mx-auto p-6 space-y-8 flex flex-col items-center">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.first_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your investments today.
          </p>
        </div>
        <Link to="/invest-now">
          <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
            New Investment
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Balance",
            value: `${statsData.totalBalance?.toLocaleString() || "0.00"}`,
            icon: Wallet,
            positive: true,
          },
          {
            title: "Active Investments",
            value: statsData.activeInvestments?.toLocaleString() || "0",
            icon: TrendingUp,
            positive: true,
          },
          {
            title: "Total Earnings",
            value: `${statsData.totalEarnings?.toLocaleString() || "0.00"}`,
            icon: DollarSign,
            positive: true,
          },
          {
            title: "Referral Earnings",
            value: `${statsData.referralEarnings?.toLocaleString() || "0.00"}`,
            icon: Users,
            positive: true,
          },
          {
            title: "Withdrawable Balance",
            value: `${statsData.withdrawableBalance?.toLocaleString() || "0.00"}`,
            icon: Wallet,
            positive: true,
          },
        ].map((stat, index) => (
          <Card
            key={index}
            className="bg-gradient-card border-border shadow-card"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="investments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="investments">Active Investments</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Active Investment Plans</CardTitle>
              <CardDescription>
                Monitor your current investments and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {investments.map((investment, index) => {
                  const { progress, days_left } = calculateProgress(investment);
                  const dailyPercentage = getDailyPercentage(
                    investment.plan_name,
                  );
                  const dailyProfit = investment.amount * dailyPercentage;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {investment.plan_name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-success border-success"
                          >
                            {investment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Amount: {investment.amount} •{" "}
                          <span className="text-green-500">
                            Profit Earned (
                            {(() => {
                              const daysPassed = Math.floor(
                                (new Date().getTime() -
                                  new Date(investment.approved_at).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              );
                              return Math.min(daysPassed, 7);
                            })()}{" "}
                            days):{" "}
                            {(() => {
                              const daysPassed = Math.floor(
                                (new Date().getTime() -
                                  new Date(investment.approved_at).getTime()) /
                                  (1000 * 60 * 60 * 24),
                              );
                              const dailyPercentage = getDailyPercentage(
                                investment.plan_name,
                              );
                              const dailyEarning =
                                investment.amount * dailyPercentage;
                              const accumulatedProfit =
                                dailyEarning * Math.min(daysPassed, 7);
                              return accumulatedProfit.toFixed(2);
                            })()}
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="w-32" />
                          <span className="text-xs text-muted-foreground">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {days_left} days left
                        </div>
                        <Link
                          to={`/manage-investment/${investment.id}`}
                          state={{
                            investment,
                            withdrawableBalance: statsData.withdrawableBalance,
                          }}
                        >
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest investment activities and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions &&
                  recentTransactions.map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "Investment"
                              ? "bg-primary/10"
                              : transaction.type === "Withdrawal"
                                ? "bg-warning/10"
                                : "bg-success/10"
                          }`}
                        >
                          {transaction.type === "Investment" && (
                            <TrendingUp className="h-4 w-4 text-primary" />
                          )}
                          {transaction.type === "Withdrawal" && (
                            <ArrowDownRight className="h-4 w-4 text-warning" />
                          )}
                          {transaction.type === "Referral" && (
                            <Users className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{transaction.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {transaction.plan}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            transaction.amount.toString().startsWith("+")
                              ? "text-success"
                              : "text-warning"
                          }`}
                        >
                          {transaction.amount}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {transaction.status === "Completed" ? (
                            <CheckCircle className="h-3 w-3 text-success" />
                          ) : (
                            <Clock className="h-3 w-3 text-warning" />
                          )}
                          {transaction.status}
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

export default Dashboard;
