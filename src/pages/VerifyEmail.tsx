import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, ShieldCheck, Mail, RefreshCcw } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Link } from "react-router-dom";

const VerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("Verifying your email...");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [hasToken, setHasToken] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const emailParam = params.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (token) {
      setHasToken(true);
      const verifyToken = async () => {
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
          type: "email",
          token: token,
        });
        setLoading(false);

        if (error) {
          setStatus("Error verifying email. Please try again.");
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setStatus("Email verified successfully! Redirecting to login...");
          toast({
            title: "Success",
            description: "Email verified successfully!",
            variant: "success",
          });
          setTimeout(() => navigate("/login"), 3000);
        }
      };
      verifyToken();
    }
  }, [location, navigate, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOTP = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your identity email.", variant: "destructive" });
      return;
    }
    if (otp.length < 6) {
      toast({ title: "Invalid Code", description: "Security code must be 6 digits.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("verify_signup_otp", {
        p_email: email,
        p_code: otp,
      });
      setSubmitting(false);

      if (error || !data?.success) {
        toast({
          title: "Verification Failed",
          description: error?.message || data?.message || "Invalid or expired code.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Identity Verified",
          description: "Your account is active. Redirecting to access hub...",
          variant: "success",
        });
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: any) {
      setSubmitting(false);
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred during verification.",
        variant: "destructive",
      });
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your identity email.", variant: "destructive" });
      return;
    }
    setResending(true);
    // Clear current OTP input so user enters the fresh one
    setOtp("");
    try {
      const { data, error } = await supabase.rpc("send_signup_otp", {
        p_email: email,
      });
      setResending(false);

      if (error || !data?.success) {
        toast({ 
          title: "Resend Failed", 
          description: error?.message || data?.message || "Failed to dispatch verification code.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "New Code Sent", description: "A fresh 10-minute OTP code has been sent to your email." });
        setTimer(60);
      }
    } catch (err: any) {
      setResending(false);
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred during resending.",
        variant: "destructive",
      });
    }
  };

  if (hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold text-white">
            {status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 selection:bg-primary/30 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative z-10">
        <CardHeader className="p-8 pb-4 text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 bg-primary/20 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">Identity Activation</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Enter the 6-digit code sent to your email. Valid for 10 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Registered Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.03] border-white/10 h-12 pl-11 rounded-xl text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 flex flex-col items-center">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 w-full text-left">
                Security Code (OTP)
              </Label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(val) => setOtp(val)}
                className="gap-2"
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                  <InputOTPSlot index={1} className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                  <InputOTPSlot index={2} className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                  <InputOTPSlot index={3} className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                  <InputOTPSlot index={4} className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                  <InputOTPSlot index={5} className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all mt-2"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Authorize Identity"
              )}
            </Button>

            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500 pt-2 px-1">
              <Link to="/signup" className="hover:text-white transition-colors">
                Back to Sign Up
              </Link>
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || resending}
                className="flex items-center gap-1 hover:text-white transition-colors disabled:opacity-50 disabled:hover:text-slate-500"
              >
                <RefreshCcw className={`h-3 w-3 ${resending && "animate-spin"}`} />
                {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
