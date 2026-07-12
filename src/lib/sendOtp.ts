import { supabase } from "./supabaseClient";

// Calls the Edge Function to generate, store, and email the OTP.
// No CORS issues — runs on Supabase's servers.
export const sendOtp = async (email: string): Promise<{ success: boolean; message: string }> => {
  const { data, error } = await supabase.functions.invoke("send-verification-email", {
    body: { type: "signup_otp", email: email.toLowerCase().trim() },
  });

  if (error) return { success: false, message: error.message };
  if (!data?.success) return { success: false, message: data?.error || "Failed to send code." };
  return { success: true, message: "Verification code sent." };
};
