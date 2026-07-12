import { useEffect, useState, useCallback } from "react";
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
import { Loader2, ShieldCheck, Mail, RefreshCcw, Clock, CheckCircle2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Link } from "react-router-dom";

// OTP valid for 30 minutes — countdown displayed in mm:ss
const OTP_DURATION_SECONDS = 30 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const VerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("Verifying your email...");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  // Two separate timers: validity countdown + resend cooldown
  const [validityTimer, setValidityTimer] = useState(OTP_DURATION_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [hasToken, setHasToken] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Tick validity countdown
  useEffect(() => {
    if (validityTimer <= 0 || verified) return;
    const id = setInterval(() => setValidityTimer((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [validityTimer, verified]);

  // Tick resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((p) => Math.max(p - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const emailParam = params.get("email");

    if (emailParam) setEmail(decodeURIComponent(emailParam));

    if (token) {
      setHasToken(true);
      (async () => {
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({ type: "email", token });
        setLoading(false);
        if (error) {
          setStatus("Error verifying email. Please try again.");
        } else {
          setStatus("Email verified! Redirecting...");
          setTimeout(() => navigate("/login"), 2500);
        }
      })();
    }
  }, [location, navigate]);

  const handleVerifyOTP = async () => {
    if (!email.trim()) {
      toast({ title: "Email Required", description: "Please enter your registered email.", variant: "destructive" });
      return;
    }
    if (otp.length < 6) {
      toast({ title: "Incomplete Code", description: "Enter all 6 digits of the verification code.", variant: "destructive" });
      return;
    }
    if (validityTimer <= 0) {
      toast({ title: "Code Expired", description: "Your code has expired. Please request a new one.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("verify_signup_otp", {
        p_email: email.trim().toLowerCase(),
        p_code: otp.trim(),
      });
      setSubmitting(false);

      if (error || !data?.success) {
        toast({
          title: "Verification Failed",
          description: error?.message || data?.message || "Invalid or expired code.",
          variant: "destructive",
        });
      } else {
        setVerified(true);
        toast({
          title: "Identity Verified ✓",
          description: "Your account is now active. Redirecting to login...",
        });
        setTimeout(() => navigate("/login"), 2500);
      }
    } catch (err: any) {
      setSubmitting(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleResend = useCallback(async () => {
    if (!email.trim()) {
      toast({ title: "Email Required", description: "Please enter your registered email.", variant: "destructive" });
      return;
    }
    if (resendCooldown > 0) return;

    setResending(true);
    setOtp(""); // Clear old code so user enters fresh one
    try {
      const { data, error } = await supabase.rpc("send_signup_otp", {
        p_email: email.trim().toLowerCase(),
      });
      setResending(false);

      if (error || !data?.success) {
        toast({
          title: "Resend Failed",
          description: error?.message || data?.message || "Could not send a new code. Try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "New Code Sent",
          description: "A fresh 30-minute code has been sent to your email.",
        });
        // Reset both timers
        setValidityTimer(OTP_DURATION_SECONDS);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err: any) {
      setResending(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [email, resendCooldown, toast]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !submitting && !verified) {
      handleVerifyOTP();
    }
  }, [otp]);

  if (hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="text-center relative z-10 space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-white">{status}</p>
        </div>
      </div>
    );
  }

  const isExpired = validityTimer <= 0;
  const isExpiringSoon = validityTimer > 0 && validityTimer <= 120; // last 2 minutes

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative z-10">
        <CardHeader className="p-8 pb-4 text-center space-y-3">
          <div className="flex justify-center">
            <div className={`p-3 rounded-xl transition-colors ${verified ? "bg-emerald-500/20" : "bg-primary/20"}`}>
              {verified
                ? <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                : <ShieldCheck className="h-7 w-7 text-primary" />
              }
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">
            {verified ? "Verified!" : "Identity Activation"}
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {verified
              ? "Redirecting you to login..."
              : "Enter the 6-digit code sent to your email"
            }
          </CardDescription>

          {/* Countdown timer */}
          {!verified && (
            <div className={`inline-flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-colors ${
              isExpired
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : isExpiringSoon
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}>
              <Clock className="h-3 w-3" />
              {isExpired ? "Code expired" : `Expires in ${formatTime(validityTimer)}`}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-2 space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
              Registered Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={verified}
                className="bg-white/[0.03] border-white/10 h-12 pl-11 rounded-xl text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary/50 font-medium disabled:opacity-50"
              />
            </div>
          </div>

          {/* OTP input */}
          <div className="space-y-2 flex flex-col items-center">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1 w-full text-left">
              6-Digit Code
            </Label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(val) => setOtp(val)}
              disabled={submitting || verified || isExpired}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="w-11 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold data-[active]:border-primary data-[active]:ring-1 data-[active]:ring-primary"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              Code auto-submits when all 6 digits are entered
            </p>
          </div>

          {/* Verify button */}
          <Button
            onClick={handleVerifyOTP}
            disabled={submitting || verified || isExpired || otp.length < 6}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all"
          >
            {submitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              : verified
              ? <><CheckCircle2 className="mr-2 h-4 w-4" />Verified</>
              : "Verify Account"
            }
          </Button>

          {/* Expired state — show prominent resend */}
          {isExpired && !verified && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-center space-y-3">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Your code has expired</p>
              <Button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="w-full h-10 bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest rounded-xl"
              >
                {resending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                  : resendCooldown > 0
                  ? `Wait ${resendCooldown}s to resend`
                  : "Send New Code"
                }
              </Button>
            </div>
          )}

          {/* Bottom row */}
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 pt-1">
            <Link to="/signup" className="hover:text-white transition-colors">
              ← Back to Sign Up
            </Link>
            {!isExpired && !verified && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCcw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
