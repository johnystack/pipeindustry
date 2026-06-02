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
import { Wallet, Loader2, ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabaseClient";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get email and verification ID from ForgotPassword navigation state
  const { email, otp_id } = location.state || {};

  useEffect(() => {
    if (!email || !otp_id) {
      toast({ 
        title: "Session Invalid", 
        description: "Please request a fresh security code to reset your password.", 
        variant: "destructive" 
      });
      navigate("/forgot-password");
    }
  }, [email, otp_id, navigate, toast]);

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      toast({ title: "Security Risk", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Validation Error", description: "Security keys do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('reset_password_with_otp', {
        p_email: email,
        p_otp_id: otp_id,
        p_new_password: password
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Access Key Updated", description: "Your identity security has been restored. Please sign in." });
        navigate("/login");
      } else {
        toast({ title: "Reset Failed", description: data.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative z-10">
        <CardHeader className="p-8 pb-4 text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <Lock className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">Set New Access Key</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure your trading identity</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">New Security Key</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-slate-950/50 border-white/10 h-12 rounded-xl focus:border-primary text-xs font-bold pr-10" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 italic">Verify New Key</Label>
              <Input 
                id="confirm-password" 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="bg-slate-950/50 border-white/10 h-12 rounded-xl focus:border-primary text-xs font-bold" 
              />
            </div>
          </div>

          <Button 
            onClick={handleResetPassword} 
            disabled={loading} 
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] italic rounded-xl shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Key Update"}
          </Button>

          <div className="text-center pt-2">
            <button 
              onClick={() => navigate("/login")}
              className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
            >
              Abort Restoration
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
