import { useState } from "react";
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
import { TrendingUp, Loader2, Key } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
        toast({ title: "Required", description: "Identity keys are mandatory.", variant: "destructive" });
        return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message === "Email not confirmed") {
        toast({
          title: "Verification Pending",
          description: "Authorize your account via system email first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Access Denied",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({ title: "Authorized", description: "Elite access granted." });
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-center bg-slate-950 px-4 py-12 selection:bg-primary/30">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] overflow-hidden relative z-10">
        <CardHeader className="p-8 pb-4 text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 bg-primary/20 rounded-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase italic text-white tracking-tight">Access Hub</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sign in to authorize operations</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">System Email</Label>
            <Input
              id="email"
              type="email"
              className="bg-slate-950/50 border-white/10 h-12 rounded-xl focus:border-primary text-xs font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Access Key</Label>
            <Input
              id="password"
              type="password"
              className="bg-slate-950/50 border-white/10 h-12 rounded-xl focus:border-primary text-xs font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <Link
              to="/forgot-password"
              className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline italic"
            >
              Forgot Key?
            </Link>
            <Link
              to="/resend-email"
              className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Resend Auth
            </Link>
          </div>
          
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Key className="mr-2 h-4 w-4" /> Authorize Session</>}
          </Button>

          <div className="text-center space-y-4 pt-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              No Identity Yet? <Link to="/signup" className="text-white hover:text-primary transition-colors ml-1">Create One</Link>
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

export default Login;
