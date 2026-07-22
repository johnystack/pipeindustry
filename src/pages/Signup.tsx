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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp, Loader2, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabaseClient";
import { sendOtp } from "../lib/sendOtp";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    role: "trader",
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
    if (loading) return;

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password) {
        toast({ title: "Required Fields", description: "Please complete all identity parameters.", variant: "destructive" });
        return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Validation Error", description: "Security keys do not match.", variant: "destructive" });
      return;
    }

    if (!formData.terms) {
      toast({ title: "Compliance Required", description: "You must authorize the platform rules and policies.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            username: formData.username.trim(),
            referral_code: formData.referralCode.trim(),
            role: formData.role,
            status: "pending",
          },
        },
      });

      if (error) {
        setLoading(false);
        const isDuplicate = error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already exists");
        toast({
          title: isDuplicate ? "Account Exists" : "Provisioning Error",
          description: isDuplicate ? "An account with this email address already exists. Please sign in instead." : error.message,
          variant: "destructive"
        });
        return;
      }

      // Dispatch OTP in background so user transitions INSTANTLY to verification page
      sendOtp(cleanEmail).catch((otpErr) => {
        console.warn("Background OTP dispatch notice:", otpErr);
      });

      toast({ title: "Identity Provisioned", description: "Navigating to email verification..." });
      navigate(`/verify-email?email=${encodeURIComponent(cleanEmail)}`);
      // Keep loading = true during page transition to prevent duplicate clicks
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Unexpected Error", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 selection:bg-primary/30">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative z-10">
        <CardHeader className="p-8 pb-4 text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 bg-primary/20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">Create Identity</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Authorized Access Provisioning</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">First Name</Label>
              <Input id="firstName" value={formData.firstName} onChange={handleChange} className="bg-slate-950/50 border-white/10 h-11 rounded-xl focus:border-primary uppercase text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Last Name</Label>
              <Input id="lastName" value={formData.lastName} onChange={handleChange} className="bg-slate-950/50 border-white/10 h-11 rounded-xl focus:border-primary uppercase text-xs font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Global Alias</Label>
              <Input id="username" value={formData.username} onChange={handleChange} className="bg-slate-950/50 border-white/10 h-11 rounded-xl focus:border-primary text-xs font-bold" placeholder="unique_id" />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="referralCode" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Referral Code</Label>
                <Input id="referralCode" value={formData.referralCode} onChange={handleChange} className="bg-slate-950/50 border-white/10 h-11 rounded-xl focus:border-primary text-xs font-bold" placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">System Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} className="bg-slate-950/50 border-white/10 h-11 rounded-xl focus:border-primary text-xs font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Access Key</Label>
              <Input id="password" type="password" value={formData.password} onChange={handleChange} className="bg-slate-950/50 border-white/10 h-11 rounded-xl focus:border-primary text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Verify Key</Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="bg-slate-950/50 border-white/10 h-11 rounded-xl focus:border-primary text-xs font-bold" />
            </div>
          </div>

          <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-primary italic">Select Operational Role</Label>
            <RadioGroup defaultValue="trader" value={formData.role} onValueChange={(v) => setFormData(p => ({ ...p, role: v }))} className="flex gap-6">
              <div className="flex items-center space-x-2 group">
                <RadioGroupItem value="trader" id="trader" className="border-white/20 text-primary" />
                <Label htmlFor="trader" className="text-[10px] font-black uppercase tracking-wider text-slate-300 cursor-pointer group-hover:text-white transition-colors italic">Trader</Label>
              </div>
              <div className="flex items-center space-x-2 group">
                <RadioGroupItem value="vendor" id="vendor" className="border-white/20 text-primary" />
                <Label htmlFor="vendor" className="text-[10px] font-black uppercase tracking-wider text-slate-300 cursor-pointer group-hover:text-white transition-colors italic">Vendor</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start space-x-3 p-1">
                <Checkbox id="terms" checked={formData.terms} onCheckedChange={(c) => setFormData(p => ({ ...p, terms: !!c }))} className="mt-1 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <Label htmlFor="terms" className="text-[11px] font-medium leading-relaxed text-slate-400 cursor-pointer select-none">
                    I have audited and authorize the <Link to="/terms" className="text-primary font-black uppercase italic hover:underline">Platform Rules</Link> and <Link to="/privacy" className="text-primary font-black uppercase italic hover:underline">Privacy Policy</Link>.
                </Label>
            </div>
            
            <Button onClick={handleSignup} disabled={loading} className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="mr-2 h-4 w-4" /> Authorize Registration</>}
            </Button>
          </div>

          <div className="text-center space-y-4 pt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Existing Account? <Link to="/login" className="text-white hover:text-primary transition-colors ml-1">Sign In</Link>
            </p>
            <Link to="/" className="inline-flex items-center text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] hover:text-white transition-colors italic">
              ← Return to Global Hub
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
