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
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabaseClient";
import { sendEmail } from "../lib/email";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { username } = useParams();

  useEffect(() => {
    if (username) {
      setFormData((prev) => ({ ...prev, referralCode: username }));
    }
  }, [username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignup = async () => {
    if (!formData.username) {
      toast({
        title: "Error",
        description: "Please enter a username.",
        variant: "destructive",
      });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.terms) {
      toast({
        title: "Error",
        description: "You must agree to the terms of service.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          referral_code: formData.referralCode,
          role: "user",
          status: "pending",
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Signup Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verify Email",
        description:
          "Please check your email for a confirmation link to complete your registration.",
        variant: "success",
      });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-8">
      <Card className="w-full max-w-md bg-gradient-card border-border shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join PipIndustry</CardTitle>
          <CardDescription>
            Create your account and start investing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                className="bg-background/50"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                className="bg-background/50"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                className="bg-background/50"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="bg-background/50"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              className="bg-background/50"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="bg-background/50"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              className="bg-background/50"
              value={formData.referralCode}
              onChange={handleChange}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.terms}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, terms: !!checked }))
              }
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          <Button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">
              Go back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
