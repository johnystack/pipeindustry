import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const UserInvestmentDetails = () => {
  const { userId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) return;

      setLoading(true);

      // Call the function to update due investments
      await supabase.rpc('update_due_investments');

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user details:', userError);
      } else {
        setUser(userData);
      }

      // Fetch user investments
      const { data: investmentData, error: investmentError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId);

      if (investmentError) {
        console.error('Error fetching user investments:', investmentError);
      } else {
        setInvestments(investmentData || []);
      }

      setLoading(false);
    };

    fetchUserDetails();
  }, [userId]);

  const handleApprove = async (investmentId: string) => {
    const { error } = await supabase
      .from('investments')
      .update({ status: 'active', approved_at: new Date().toISOString() })
      .eq('id', investmentId);

    if (error) {
      console.error('Error approving investment:', error);
    } else {
      setInvestments(investments.map(inv =>
        inv.id === investmentId ? { ...inv, status: 'active', approved_at: new Date().toISOString() } : inv
      ));
    }
  };

  const handleDeny = async (investmentId: string) => {
    const { error } = await supabase
      .from('investments')
      .update({ status: 'denied' })
      .eq('id', investmentId);

    if (error) {
      console.error('Error denying investment:', error);
    } else {
      setInvestments(investments.map(inv =>
        inv.id === investmentId ? { ...inv, status: 'denied' } : inv
      ));
    }
  };

  const calculateProgress = (investment: any) => {
    if (investment.status !== 'active' || !investment.approved_at) {
      return { progress: 0, days_left: investment.duration };
    }

    const approvedAt = new Date(investment.approved_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24));
    const progress = Math.min(Math.floor((daysPassed / investment.duration) * 100), 100);
    const daysLeft = Math.max(investment.duration - daysPassed, 0);

    return { progress, days_left: daysLeft };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Link to="/admin">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            {user.first_name} {user.last_name}'s Profile
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p>{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p>{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p>{user.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investments.map((investment) => {
              const { progress, days_left } = calculateProgress(investment);
              return (
                <div key={investment.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">{investment.crypto}</p>
                    <p className="text-sm text-muted-foreground">Amount: {investment.amount}</p>
                    <p className="text-sm text-muted-foreground">Return: {investment.return}</p>
                    <p className="text-sm text-muted-foreground">Progress: {progress}%</p>
                    <p className="text-sm text-muted-foreground">Days Left: {days_left}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={investment.status === 'pending' ? 'secondary' : (investment.status === 'active' ? 'default' : 'destructive')}>
                      {investment.status}
                    </Badge>
                    {investment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-success border-success" onClick={() => handleApprove(investment.id)}>Approve</Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => handleDeny(investment.id)}>Deny</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInvestmentDetails;