import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const [status, setStatus] = useState("Verifying your email...");
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (token) {
        const { error } = await supabase.auth.verifyOtp({
          type: "email",
          token: token,
        });

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
      } else {
        setStatus("No verification token found.");
      }
    };

    verify();
  }, [location, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg font-semibold text-primary-foreground">
          {status}
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
