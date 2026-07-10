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
import { Wallet, Loader2, Mail, ShieldCheck, RefreshCcw, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabaseClient";
import { cn } from "@/lib/utils";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestOTP = async () => {
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your identity email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_password_reset_otp', { p_email: email });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Security Code Sent", description: "Check your neural inbox for the 6-digit access key." });
        setStep(2);
        setTimer(60);
      } else {
        toast({ title: "Provisioning Error", description: data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: "Incomplete Code", description: "Please enter the full 6-digit access key.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_password_reset_otp', { 
        p_email: email, 
        p_code: otp 
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Identity Verified", description: "Access granted. Please set your new security key." });
        navigate("/reset-password", { state: { email, otp_id: data.otp_id } });
      } else {
        toast({ title: "Verification Failed", description: data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      const { data, error } = await supabase.rpc('request_password_reset_otp', { p_email: email });
      if (error) throw error;
      if (data.success) {
        toast({ title: "New Code Sent", description: "A fresh security key has been dispatched." });
        setTimer(60);
        setOtp("");
      }
    } catch (error: any) {
      toast({ title: "Resend Failed", description: error.message, variant: "destructive" });
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
            {step === 1 ? "Identity Recovery" : "Verification"}
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {step === 1 ? "Neural Access Restoration" : "Enter dispatch code to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Authorized Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="CHIEF@EXAMPLE.COM" 
                    className="bg-slate-950/50 border-white/10 h-12 pl-10 rounded-xl focus:border-primary text-xs font-bold uppercase" 
                  />
                </div>
              </div>
              <Button 
                onClick={handleRequestOTP} 
                disabled={loading} 
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-[0.2em] italic rounded-xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Request Access Key"}
              </Button>
            </div>
          ) : (
            <div className="space-y-8 flex flex-col items-center">
              <div className="space-y-4 w-full flex flex-col items-center">
                <Label className="text-[9px] font-black uppercase tracking-widest text-primary italic text-center">Neural Payload (6-Digit OTP)</Label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  render={({ slots }) => (
                    <InputOTPGroup className="gap-2">
                      {slots.map((slot, index) => (
                        <InputOTPSlot 
                          key={index} 
                          {...slot} 
                          className="w-12 h-14 bg-slate-950/80 border-white/10 text-xl font-black italic text-primary rounded-xl" 
                        />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>

              <div className="w-full space-y-4">
                <Button 
                  onClick={handleVerifyOTP} 
                  disabled={loading} 
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] italic rounded-xl shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Key"}
                </Button>

                <div className="flex flex-col items-center gap-3">
                  <button 
                    onClick={handleResend}
                    disabled={timer > 0 || resending}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <RefreshCcw className={cn("h-3 w-3", resending && "animate-spin")} />
                    {timer > 0 ? `Resend Code in ${timer}s` : "Resend Security Code"}
                  </button>
                  <button 
                    onClick={() => setStep(1)}
                    className="text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="h-2 w-2" /> Change Email
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
              Return to Authentication Hub
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
