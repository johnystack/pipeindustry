import { supabase } from "./supabaseClient";

// Generic helper — calls the Edge Function for all email types
export const invokeEmail = async (
  type: string,
  email: string,
  payload: Record<string, any> = {}
): Promise<{ success: boolean; message: string }> => {
  const { data, error } = await supabase.functions.invoke("send-verification-email", {
    body: { type, email: email.toLowerCase().trim(), payload },
  });
  if (error) return { success: false, message: error.message };
  if (!data?.success) return { success: false, message: data?.error || "Failed." };
  return { success: true, message: data?.message || "Done." };
};

// Shorthand for OTP
export const sendOtp = (email: string) => invokeEmail("signup_otp", email);

// Shorthand for welcome email
export const sendWelcomeEmail = (email: string, firstName: string) =>
  invokeEmail("welcome", email, { first_name: firstName });

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
