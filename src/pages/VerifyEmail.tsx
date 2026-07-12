import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Mail, RefreshCcw, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

// OTP valid for 10 minutes
const OTP_VALID_SECONDS = 10 * 60;
// Resend cooldown — 60 seconds
const RESEND_COOLDOWN = 60;

const pad = (n: number) => String(n).padStart(2, "0");
const formatCountdown = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

// Generate a random 6-digit code
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

// Send OTP email directly via Resend API
const sendOtpEmail = async (email: string, code: string): Promise<{ ok: boolean; error?: string }> => {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer re_YGiQ6jYV_7vdyWCYUJcRY1AQ6zpEgUBvg`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TerrasInvestment <noreply@terrasinvestment.com>",
        to: [email],
        subject: "Your Verification Code — TerrasInvestment",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#0f172a;border-radius:20px;color:#fff;text-align:center;">
            <div style="margin-bottom:24px;">
              <div style="display:inline-block;background:#059669;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;">✓</div>
            </div>
            <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;letter-spacing:-0.5px;">Email Verification</h2>
            <p style="color:#94a3b8;font-size:14px;margin:0 0 32px;">Enter this 6-digit code to activate your TerrasInvestment account.</p>
            <div style="background:#1e293b;border-radius:16px;padding:24px;margin-bottom:24px;letter-spacing:12px;font-size:42px;font-weight:900;color:#059669;">
              ${code}
            </div>
            <p style="color:#64748b;font-size:12px;margin:0;">This code expires in <strong style="color:#f59e0b;">10 minutes</strong>.<br/>If you didn't create an account, ignore this email.</p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.message || `Resend error ${res.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error" };
  }
};

const VerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Validity countdown (10 min)
  const [validity, setValidity] = useState(OTP_VALID_SECONDS);
  // Resend cooldown (60 s)
  const [cooldown, setCooldown] = useState(0);

  const validityRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Start the validity countdown
  const startValidityTimer = () => {
    if (validityRef.current) clearInterval(validityRef.current);
    setValidity(OTP_VALID_SECONDS);
    validityRef.current = setInterval(() => {
      setValidity((prev) => {
        if (prev <= 1) { clearInterval(validityRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Start resend cooldown
  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    return () => {
      if (validityRef.current) clearInterval(validityRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Send OTP: generate code → send email → store in DB → start timer
  const sendOtp = async (targetEmail: string) => {
    if (!targetEmail.trim()) {
      toast({ title: "Email required", description: "Enter your registered email first.", variant: "destructive" });
      return;
    }
    setSending(true);
    setErrorMsg("");
    setOtp("");

    const code = generateCode();

    // 1. Send the email via Resend
    const { ok, error: emailError } = await sendOtpEmail(targetEmail.trim().toLowerCase(), code);
    if (!ok) {
      setSending(false);
      setErrorMsg(`Failed to send email: ${emailError}`);
      toast({ title: "Email Failed", description: emailError, variant: "destructive" });
      return;
    }

    // 2. Store the code in the DB
    const { data, error: dbError } = await supabase.rpc("store_signup_otp", {
      p_email: targetEmail.trim().toLowerCase(),
      p_code: code,
    });

    setSending(false);

    if (dbError || !data?.success) {
      setErrorMsg(dbError?.message || "Failed to store verification code.");
      toast({ title: "Error", description: dbError?.message || "Could not save code.", variant: "destructive" });
      return;
    }

    // 3. Start timers
    startValidityTimer();
    startCooldown();

    toast({ title: "Code Sent", description: `A 6-digit code was sent to ${targetEmail}.` });
  };

  // Handle resend button
  const handleResend = () => {
    if (cooldown > 0 || sending) return;
    sendOtp(email);
  };

  // Verify entered OTP against DB
  const handleVerify = async () => {
    if (!email.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    if (otp.length < 6) {
      toast({ title: "Enter all 6 digits", variant: "destructive" });
      return;
    }
    if (validity <= 0) {
      setErrorMsg("Code has expired. Please request a new one.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const { data, error } = await supabase.rpc("verify_signup_otp", {
      p_email: email.trim().toLowerCase(),
      p_code: otp.trim(),
    });

    setSubmitting(false);

    if (error || !data?.success) {
      const msg = error?.message || data?.message || "Verification failed.";
      setErrorMsg(msg);
      toast({ title: "Verification Failed", description: msg, variant: "destructive" });
    } else {
      setVerified(true);
      if (validityRef.current) clearInterval(validityRef.current);
      toast({ title: "Verified ✓", description: "Your account is now active. Redirecting..." });
      setTimeout(() => navigate("/login"), 2500);
    }
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && !submitting && !verified && validity > 0) {
      handleVerify();
    }
  }, [otp]);

  const isExpired = validity <= 0;
  const isExpiringSoon = validity > 0 && validity <= 120;

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
                : <ShieldCheck className="h-7 w-7 text-primary" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">
            {verified ? "Account Activated!" : "Verify Your Email"}
          </CardTitle>
          <CardDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {verified
              ? "Redirecting you to login..."
              : "Enter the 6-digit code sent to your email"}
          </CardDescription>

          {/* Countdown badge — only show when a code has been sent */}
          {!verified && validity < OTP_VALID_SECONDS && (
            <div className={`inline-flex items-center gap-2 mx-auto px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
              isExpired
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : isExpiringSoon
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}>
              <Clock className="h-3 w-3 shrink-0" />
              {isExpired ? "Code expired" : `Code valid for ${formatCountdown(validity)}`}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-8 pt-2 space-y-5">
          {/* Email input */}
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
                onChange={(e) => setEmail(e.target.value)}
                disabled={verified}
                className="bg-white/[0.03] border-white/10 h-12 pl-11 rounded-xl text-white placeholder:text-slate-600 focus-visible:ring-primary focus-visible:border-primary/50 font-medium"
              />
            </div>
          </div>

          {/* OTP input */}
          <div className="space-y-2 flex flex-col items-center">
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
              Auto-submits when all 6 digits are entered
            </p>
          </div>

          {/* Error message */}
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

          {/* Send / Resend button */}
          <Button
            onClick={handleResend}
            disabled={sending || cooldown > 0 || verified}
            variant="outline"
            className="w-full h-11 rounded-xl border-white/10 bg-white/[0.02] hover:bg-white/[0.05] font-black text-xs uppercase tracking-widest transition-all"
          >
            {sending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
              : cooldown > 0
              ? <><Clock className="mr-2 h-3.5 w-3.5" />Resend in {cooldown}s</>
              : <><RefreshCcw className="mr-2 h-3.5 w-3.5" />{validity === OTP_VALID_SECONDS ? "Send Code" : "Resend New Code"}</>}
          </Button>

          <div className="text-center pt-1">
            <Link to="/signup" className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">
              ← Back to Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
