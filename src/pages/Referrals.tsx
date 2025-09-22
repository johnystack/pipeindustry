import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Copy,
  Share2,
  DollarSign,
  TrendingUp,
  Gift,
  Award,
} from "lucide-react";

const Referrals = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [referralStats, setReferralStats] = useState({
    total_referrals: 0,
    active_referrals: 0,
    total_earned: 0,
    currentLevel: "Bronze", // Default level
  });
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [commissionEarnings, setCommissionEarnings] = useState<any[]>([]);

  const handleWithdrawReferrals = async () => {
    if (!profile || profile.referral_earnings <= 0) {
      toast({
        title: "No earnings to withdraw",
        description: "You do not have any referral earnings to withdraw.",
        variant: "destructive",
      });
      return;
    }

    const newWithdrawableBalance =
      profile.withdrawable_balance + profile.referral_earnings;

    const { error } = await supabase
      .from("profiles")
      .update({
        withdrawable_balance: newWithdrawableBalance,
        referral_earnings: 0,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error withdrawing earnings",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            type: "withdrawal",
            amount: profile.referral_earnings,
            status: "completed",
            description: "Referral earnings to withdrawable balance",
            withdrawal_type: "to_balance",
          },
        ]);

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
      }

      setProfile({
        ...profile,
        withdrawable_balance: newWithdrawableBalance,
        referral_earnings: 0,
      });
      toast({
        title: "Withdrawal successful",
        description: `Your referral earnings of ${profile.referral_earnings.toLocaleString()} have been added to your withdrawable balance.`,
      });
    }
  };

  useEffect(() => {
    const fetchReferralPageData = async () => {
      if (user) {
        const { data, error } = await supabase.rpc('get_referral_data', { p_user_id: user.id });

        if (error) {
          console.error('Error fetching referral data:', error);
        } else {
          setProfile(data.profile);
          setReferralStats(data.referral_stats);
          setRecentReferrals(data.recent_referrals || []);
          setCommissionEarnings(data.commission_earnings || []);
        }
      }
    };

    fetchReferralPageData();
  }, [user]);

  const commissionStructure = [
    {
      level: "Direct Referral",
      percentage: "$5",
      description: "Bonus for each user you directly refer",
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Earn generous commissions by inviting friends to join PipIndustry.
          Build your network and increase your passive income.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referrals
            </CardTitle>
            <Users className={`h-4 w-4 text-blue-500`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralStats.total_referrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total users referred
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Referrals
            </CardTitle>
            <TrendingUp className={`h-4 w-4 text-green-500`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralStats.active_referrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Users who have invested
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className={`h-4 w-4 text-yellow-500`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(referralStats.total_earned || 0).toLocaleString()}
            </div>
            <Button
              size="sm"
              className="mt-2"
              onClick={handleWithdrawReferrals}
            >
              Withdraw
            </Button>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Award className={`h-4 w-4 text-purple-500`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralStats.currentLevel}
            </div>
            <p className="text-xs text-muted-foreground">Your referral tier</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with friends and earn commissions on their
            investments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://pipindustry.org'}/ref/${profile?.username}`}
              readOnly
              className="bg-background/50"
            />
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share on Social
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commission Structure */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Commission Structure
          </CardTitle>
          <CardDescription>
            Earn commissions on multiple levels of referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {commissionStructure.map((level, index) => (
              <div key={index} className="text-center space-y-3">
                <div
                  className={`w-16 h-16 ${level.color} rounded-full flex items-center justify-center mx-auto`}
                >
                  <span className="text-white font-bold text-lg">
                    {level.percentage}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{level.level}</h3>
                  <p className="text-sm text-muted-foreground">
                    {level.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-background/50 rounded-lg">
            <h4 className="font-semibold mb-2">How it works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Earn 10% commission on direct referrals' investments</li>
              <li>• Earn 5% on second-level referrals</li>
              <li>• Earn 2% on third-level referrals</li>
              <li>• Commissions are paid instantly when referrals invest</li>
              <li>• No limit on the number of referrals</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Tabs defaultValue="referrals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="referrals">My Referrals</TabsTrigger>
          <TabsTrigger value="earnings">Commission Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>
                Track your referred users and their investment activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{referral.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {referral.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {referral.joinDate}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant={
                          referral.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {referral.status}
                      </Badge>
                      <div className="text-sm">
                        <div>Invested: {referral.invested}</div>
                        <div className="text-success">
                          Earned: {referral.commission}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle>Commission Earnings History</CardTitle>
              <CardDescription>
                Detailed breakdown of your referral commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissionEarnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
                  >
                    <div>
                      <h4 className="font-medium">{earning.description}</h4>
                      <p className="text-sm text-muted-foreground">
                        {earning.reference}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-success font-semibold">
                      +${earning.amount.toLocaleString()}
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

export default Referrals;
