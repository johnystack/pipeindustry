import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL    = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    "TerrasInvestment <noreply@terrasinvestment.com>",
      to:      [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Resend error ${res.status}`);
  }
  return await res.json();
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, email, payload } = await req.json();
    const normalizedEmail = email?.toLowerCase()?.trim();

    if (!normalizedEmail) throw new Error("Email is required");

    // ── OTP: generate, store, send ─────────────────────────────────────
    if (type === "signup_otp") {
      const code = String(Math.floor(100000 + Math.random() * 900000));

      // Store OTP in DB using service role (bypasses RLS)
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Expire previous unverified OTPs
      await supabase
        .from("signup_otps")
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq("email", normalizedEmail)
        .eq("verified", false);

      // Insert new OTP — expires in 10 minutes
      const { error: insertError } = await supabase
        .from("signup_otps")
        .insert({
          email:      normalizedEmail,
          code,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          verified:   false,
        });

      if (insertError) throw new Error(`DB error: ${insertError.message}`);

      // Send email
      await sendEmail(
        normalizedEmail,
        "Your Verification Code — TerrasInvestment",
        `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;">
          <div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:40px 32px;background:#1e293b;border-radius:20px;color:#fff;text-align:center;">
            <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff;">Verify Your Email</h2>
            <p style="color:#94a3b8;font-size:14px;margin:0 0 32px;line-height:1.6;">
              Use the code below to activate your TerrasInvestment account.<br/>Do not share this code with anyone.
            </p>
            <div style="background:#0f172a;border-radius:16px;padding:28px 16px;margin-bottom:28px;letter-spacing:14px;font-size:44px;font-weight:900;color:#059669;border:1px solid #1e3a2f;">
              ${code}
            </div>
            <p style="color:#64748b;font-size:13px;line-height:1.6;">
              This code expires in <strong style="color:#f59e0b;">10 minutes</strong>.<br/>
              If you did not create an account, ignore this email.
            </p>
          </div>
        </body></html>`
      );

      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Password reset ─────────────────────────────────────────────────
    if (type === "password_reset") {
      await sendEmail(
        normalizedEmail,
        "Your Password Reset Code — TerrasInvestment",
        `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;background:#1e293b;border-radius:20px;color:#fff;text-align:center;">
          <h2 style="color:#fff;">Password Reset</h2>
          <p style="color:#94a3b8;">Use this code to reset your access key:</p>
          <div style="background:#0f172a;border-radius:12px;padding:24px;font-size:40px;font-weight:900;letter-spacing:12px;color:#059669;margin:24px 0;">
            ${payload?.code}
          </div>
          <p style="color:#64748b;font-size:13px;">Expires in 10 minutes.</p>
        </div>`
      );
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Welcome email ──────────────────────────────────────────────────
    if (type === "welcome") {
      await sendEmail(
        normalizedEmail,
        "Welcome to TerrasInvestment!",
        `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;background:#1e293b;border-radius:20px;color:#fff;text-align:center;">
          <h2 style="color:#059669;">Identity Provisioned</h2>
          <p style="color:#94a3b8;">Hello ${payload?.first_name || "Chief"}, your account is now active.</p>
          <a href="https://terrasinvestment.com/login" style="display:inline-block;margin-top:24px;background:#059669;color:#fff;padding:14px 32px;border-radius:10px;font-weight:bold;text-decoration:none;">
            Access Dashboard
          </a>
        </div>`
      );
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown email type: ${type}`);

  } catch (err: any) {
    console.error("Edge function error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
