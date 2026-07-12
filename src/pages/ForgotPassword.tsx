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
import { Loader2, Mail, ShieldCheck, RefreshCcw, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabaseClient";
import { invokeEmail } from "../lib/sendOtp";
import { cn } from "@/lib/utils";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const ForgotPassword = () => {
  const [email, setEmail]         = useState("");
  const [otp, setOtp]             = useState("");
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer]         = useState(0);
  const { toast } = useToast();
  const navigate  = useNavigate();

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Generate code → send email via edge function → store in DB
  const requestOtp = async (targetEmail: string) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const emailResult = await invokeEmail("password_reset", targetEmail, { code });
    if (!emailResult.success) throw new Error(emailResult.message);

    const { data, error } = await supabase.rpc("store_password_reset_otp", {
      p_email: targetEmail.toLowerCase().trim(),
      p_code:  code,
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.message || "Failed to save code.");
  };

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      toast({ title: "Email Required", description: "Enter your registered email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await requestOtp(email.trim());
      toast({ title: "Code Sent", description: "Check your email for the 6-digit code." });
      setStep(2);
      setTimer(60);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: "Incomplete Code", description: "Enter all 6 digits.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("verify_password_reset_otp", {
        p_email: email.toLowerCase().trim(),
        p_code:  otp,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Verification failed.");

      toast({ title: "Identity Verified", description: "Set your new password." });
      navigate("/reset-password", { state: { email, otp_id: data.otp_id } });
    } catch (err: any) {
      toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      await requestOtp(email.trim());
      toast({ title: "New Code Sent", description: "A fresh code has been sent to your email." });
      setTimer(60);
      setOtp("");
    } catch (err: any) {
      toast({ title: "Resend Failed", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative z-10">
        <CardHeader className="p-8 pb-4 text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 bg-primary/20 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">
            {step === 1 ? "Password Reset" : "Enter Code"}
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {step === 1 ? "We'll send a 6-digit code to your email" : "Enter the code sent to your email"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-4 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                  Registered Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    onKeyDown={e => e.key === "Enter" && handleRequestOTP()}
                    className="bg-slate-950/50 border-white/10 h-12 pl-10 rounded-xl focus:border-primary text-xs font-bold"
                  />
                </div>
              </div>
              <Button
                onClick={handleRequestOTP}
                disabled={loading}
                className="w-full h-12 bg-primary font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-primary/10"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center">
              <div className="space-y-3 w-full flex flex-col items-center">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-full text-left">
                  6-Digit Code
                </Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="w-11 h-12 rounded-xl border border-white/10 bg-white/[0.03] text-white text-lg font-bold data-[active]:border-primary data-[active]:ring-1 data-[active]:ring-primary"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="w-full space-y-3">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 6}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 font-black text-[10px] uppercase tracking-widest rounded-xl"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
                </Button>

                <div className="flex justify-between items-center pt-1">
                  <button
                    onClick={() => setStep(1)}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change Email
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={timer > 0 || resending}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors disabled:opacity-40"
                  >
                    <RefreshCcw className={cn("h-3 w-3", resending && "animate-spin")} />
                    {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
