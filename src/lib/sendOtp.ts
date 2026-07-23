import { supabase } from "./supabaseClient";

export const invokeEmail = async (
  type: string,
  email: string,
  payload: Record<string, any> = {}
): Promise<{ success: boolean; message: string }> => {
  const cleanEmail = email.toLowerCase().trim();

  // If OTP email, generate 6-digit code and store in DB table signup_otps
  if (type === "signup_otp" || type === "password_reset") {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { error: rpcErr } = await supabase.rpc("store_signup_otp", {
      p_email: cleanEmail,
      p_code: code,
    });
    if (rpcErr) {
      console.warn("Could not store OTP code in DB:", rpcErr.message);
    }
    payload.code = code;
  }

  const { data, error } = await supabase.functions.invoke("send-verification-email", {
    body: { type, email: cleanEmail, payload },
  });

  if (error) {
    return { success: false, message: error.message };
  }
  if (!data?.success) {
    return { success: false, message: data?.error || "Failed to dispatch email." };
  }
  return { success: true, message: data?.message || "Done." };
};

// Shorthand for OTP
export const sendOtp = (email: string) => invokeEmail("signup_otp", email);

// Shorthand for welcome email
export const sendWelcomeEmail = (email: string, firstName?: string, username?: string) =>
  invokeEmail("welcome", email, { first_name: firstName, username: username || firstName });

// Shorthand for investment confirmed
export const sendInvestmentConfirmedEmail = (
  email: string,
  firstName: string,
  planName: string,
  amount: number
) => invokeEmail("investment_confirmed", email, { first_name: firstName, plan_name: planName, amount });

// Shorthand for withdrawal approved
export const sendWithdrawalApprovedEmail = (
  email: string,
  firstName: string,
  amount: number,
  fee: number,
  method: string
) => invokeEmail("withdrawal_approved", email, { first_name: firstName, amount, fee, method });

// Shorthand for withdrawal rejected
export const sendWithdrawalRejectedEmail = (
  email: string,
  firstName: string,
  amount: number
) => invokeEmail("withdrawal_rejected", email, { first_name: firstName, amount });
