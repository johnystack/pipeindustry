import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { sendOtp, sendWelcomeEmail } from "../lib/sendOtp";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ShieldCheck, Mail, RefreshCcw,
  Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// OTP is valid for 10 minutes in the DB
const OTP_VALID_SECONDS = 10 * 60;
const RESEND_COOLDOWN   = 60;

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

const VerifyEmail = () => {
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  // Countdown for OTP validity (starts at 10:00 when page loads)
  const [validity, setValidity]   = useState(OTP_VALID_SECONDS);
  // Cooldown before user can resend again
  const [cooldown, setCooldown]   = useState(0);

  const validityRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Timers ────────────────────────────────────────────────
  const startValidityTimer = () => {
    if (validityRef.current) clearInterval(validityRef.current);
    setValidity(OTP_VALID_SECONDS);
    validityRef.current = setInterval(() => {
      setValidity(p => { if (p <= 1) { clearInterval(validityRef.current!); return 0; } return p - 1; });
    }, 1000);
  };

  const startCooldownTimer = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown(p => { if (p <= 1) { clearInterval(cooldownRef.current!); return 0; } return p - 1; });
    }, 1000);
  };

  // ── On mount: read email from URL, start validity timer ──
  // OTP was already sent by handle_new_user trigger on signup
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const em = params.get("email");
    if (em) setEmail(decodeURIComponent(em));

    // Start the countdown — the DB OTP is already live
    startValidityTimer();

    return () => {
      if (validityRef.current) clearInterval(validityRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // ── Resend: calls Edge Function which sends email + stores OTP ──
  const handleResend = async () => {
    if (!email.trim()) {
      toast({ title: "Email required", description: "Enter your registered email.", variant: "destructive" });
      return;
    }
    if (cooldown > 0 || resending) return;

    setResending(true);
    setErrorMsg("");
    setOtp("");

    const result = await sendOtp(email.trim());

    setResending(false);

    if (!result.success) {
      setErrorMsg(result.message);
      toast({ title: "Resend Failed", description: result.message, variant: "destructive" });
    } else {
      toast({ title: "New Code Sent", description: "Check your email for the fresh 6-digit code." });
      startValidityTimer();
      startCooldownTimer();
    }
  };

  // ── Verify: check code against DB ────────────────────────
  const handleVerify = async () => {
    if (!email.trim()) {
      toast({ title: "Email required", variant: "destructive" }); return;
    }
    if (otp.length < 6) {
      toast({ title: "Enter all 6 digits", variant: "destructive" }); return;
    }
    if (validity <= 0) {
      setErrorMsg("Code expired. Click 'Resend Code' to get a new one."); return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const { data, error } = await supabase.rpc("verify_signup_otp", {
      p_email: email.trim().toLowerCase(),
      p_code:  otp.trim(),
    });

    setSubmitting(false);

    if (error || !data?.success) {
      const msg = error?.message || data?.message || "Verification failed.";
      setErrorMsg(msg);
      setOtp("");
    } else {
      setVerified(true);
      if (validityRef.current) clearInterval(validityRef.current);
      // Send welcome email now that account is verified
      sendWelcomeEmail(email.trim(), "");
      toast({ title: "Verified ✓", description: "Account activated. Redirecting to login..." });
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otp.length === 6 && !submitting && !verified && validity > 0) {
      handleVerify();
    }
  }, [otp]);

  const isExpired      = validity <= 0;
  const isExpiringSoon = validity > 0 && validity <= 120;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative z-10">
        {/* Header */}
        <CardHeader className="p-8 pb-4 text-center space-y-3">
          <div className="flex justify-center">
            <div className={`p-3 rounded-xl transition-colors ${verified ? "bg-emerald-500/20" : "bg-primary/20"}`}>
              {verified
                ? <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                : <ShieldCheck   className="h-7 w-7 text-primary" />}
            </div>
          </div>

          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">
            {verified ? "Account Activated!" : "Verify Your Email"}
          </CardTitle>

          <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {verified
              ? "Redirecting to login..."
              : "A 6-digit code was sent to your email on signup"}
          </CardDescription>

          {/* Live countdown */}
          {!verified && (
            <div className={`inline-flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
              isExpired
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : isExpiringSoon
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}>
              <Clock className="h-3 w-3 shrink-0" />
              {isExpired ? "Code expired — request a new one below" : `Code valid for ${fmt(validity)}`}
            </div>
          )}
        </CardHeader>

        {/* Body */}
        <CardContent className="p-8 pt-2 space-y-5">

          {/* Email field */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Registered Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={verified}
                className="bg-white/[0.03] border-white/10 h-12 pl-11 rounded-xl text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary/50 font-medium"
              />
            </div>
          </div>

          {/* OTP input */}
          <div className="flex flex-col items-center space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest w-full text-left">
              6-Digit Code
            </Label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={submitting || verified || isExpired}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <InputOTPSlot
                    key={i} index={i}
                    className="w-11 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold data-[active]:border-primary data-[active]:ring-1 data-[active]:ring-primary"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              Auto-submits when all 6 digits are entered
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Verify button */}
          <Button
            onClick={handleVerify}
            disabled={submitting || verified || isExpired || otp.length < 6}
            className="w-full h-12 rounded-xl bg-primary font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all"
          >
            {submitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              : verified
              ? <><CheckCircle2 className="mr-2 h-4 w-4" />Verified</>
              : "Verify Account"}
          </Button>

          {/* Resend button — only for when code was missed or expired */}
          <Button
            onClick={handleResend}
            disabled={resending || cooldown > 0 || verified}
            variant="outline"
            className="w-full h-11 rounded-xl border-white/10 bg-white/[0.02] hover:bg-white/[0.05] font-black text-xs uppercase tracking-widest transition-all"
          >
            {resending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              : cooldown > 0
              ? <><Clock className="mr-2 h-3.5 w-3.5" />Resend in {cooldown}s</>
              : <><RefreshCcw className="mr-2 h-3.5 w-3.5" />Resend Code</>}
          </Button>

          <div className="text-center pt-1">
            <Link
              to="/signup"
              className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors"
            >
              ← Back to Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
