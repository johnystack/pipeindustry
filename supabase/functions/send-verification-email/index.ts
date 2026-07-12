import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY       = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM             = "TerrasInvestment <noreply@terrasinvestment.com>";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: object, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// ── Send via Resend ──────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body:    JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Resend ${res.status}`);
  }
}

// ── Email Templates ──────────────────────────────────────────────────────────
const wrap = (content: string) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif;">
<div style="max-width:520px;margin:40px auto;padding:40px 32px;background:#1e293b;border-radius:20px;color:#fff;text-align:center;">
  ${content}
</div></body></html>`;

const templates: Record<string, (p: any) => { subject: string; html: string }> = {

  signup_otp: (p) => ({
    subject: "Your Verification Code — TerrasInvestment",
    html: wrap(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;">Verify Your Email</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;">Enter this code to activate your account. Do not share it.</p>
      <div style="background:#0f172a;border-radius:14px;padding:24px;margin-bottom:24px;letter-spacing:14px;font-size:42px;font-weight:900;color:#059669;border:1px solid #1e3a2f;">
        ${p.code}
      </div>
      <p style="color:#64748b;font-size:12px;">Expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>
    `),
  }),

  welcome: (p) => ({
    subject: "Welcome to TerrasInvestment — Identity Provisioned",
    html: wrap(`
      <div style="width:56px;height:56px;background:#059669;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;">✓</div>
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#059669;">Welcome, ${p.first_name || "Chief"}!</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;line-height:1.7;">
        Your trading identity is now active. You can log in and start managing your portfolio on TerrasInvestment.
      </p>
      <a href="https://terrasinvestment.com/login"
         style="display:inline-block;background:#059669;color:#fff;padding:14px 36px;border-radius:10px;font-weight:900;text-decoration:none;font-size:13px;letter-spacing:1px;">
        ACCESS DASHBOARD
      </a>
    `),
  }),

  password_reset: (p) => ({
    subject: "Password Reset Code — TerrasInvestment",
    html: wrap(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;">Password Reset</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;">Use this code to reset your access key:</p>
      <div style="background:#0f172a;border-radius:14px;padding:24px;margin-bottom:24px;letter-spacing:14px;font-size:42px;font-weight:900;color:#059669;border:1px solid #1e3a2f;">
        ${p.code}
      </div>
      <p style="color:#64748b;font-size:12px;">Expires in <strong style="color:#f59e0b;">10 minutes</strong>. If you did not request this, ignore this email.</p>
    `),
  }),

  investment_confirmed: (p) => ({
    subject: "Investment Activated — TerrasInvestment",
    html: wrap(`
      <div style="width:56px;height:56px;background:#059669;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;">📈</div>
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#059669;">Investment Confirmed</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Hello ${p.first_name || "Chief"}, your investment is now active and generating returns.</p>
      <div style="background:#0f172a;border-radius:14px;padding:20px;margin-bottom:24px;text-align:left;border:1px solid #1e3a2f;">
        <table style="width:100%;font-size:13px;border-collapse:collapse;color:#94a3b8;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">Plan</td>
              <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;font-weight:900;color:#fff;">${p.plan_name || "—"}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">Amount</td>
              <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;font-weight:900;color:#059669;">₦${Number(p.amount || 0).toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;">Status</td>
              <td style="padding:8px 0;text-align:right;font-weight:900;color:#059669;">ACTIVE</td></tr>
        </table>
      </div>
      <a href="https://terrasinvestment.com/dashboard"
         style="display:inline-block;background:#059669;color:#fff;padding:14px 36px;border-radius:10px;font-weight:900;text-decoration:none;font-size:13px;">
        VIEW PORTFOLIO
      </a>
    `),
  }),

  withdrawal_approved: (p) => ({
    subject: "Withdrawal Approved — TerrasInvestment",
    html: wrap(`
      <div style="width:56px;height:56px;background:#d97706;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;">💸</div>
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#d97706;">Withdrawal Dispatched</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Hello ${p.first_name || "Chief"}, your withdrawal has been processed.</p>
      <div style="background:#0f172a;border-radius:14px;padding:20px;margin-bottom:24px;text-align:left;border:1px solid #1e3a2f;">
        <table style="width:100%;font-size:13px;border-collapse:collapse;color:#94a3b8;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">Amount</td>
              <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;font-weight:900;color:#d97706;">₦${Number(p.amount || 0).toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">Fee</td>
              <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;color:#fff;">₦${Number(p.fee || 0).toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #1e293b;">Method</td>
              <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;color:#fff;">${p.method || "Bank Transfer"}</td></tr>
          <tr><td style="padding:8px 0;">Status</td>
              <td style="padding:8px 0;text-align:right;font-weight:900;color:#d97706;">COMPLETED</td></tr>
        </table>
      </div>
      <a href="https://terrasinvestment.com/transactions"
         style="display:inline-block;background:#d97706;color:#fff;padding:14px 36px;border-radius:10px;font-weight:900;text-decoration:none;font-size:13px;">
        VIEW TRANSACTIONS
      </a>
    `),
  }),

  withdrawal_rejected: (p) => ({
    subject: "Withdrawal Update — TerrasInvestment",
    html: wrap(`
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#ef4444;">Withdrawal Rejected</h2>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Hello ${p.first_name || "Chief"}, your withdrawal of <strong style="color:#fff;">₦${Number(p.amount || 0).toLocaleString()}</strong> has been rejected and the amount has been refunded to your balance.</p>
      <p style="color:#64748b;font-size:12px;">Please contact support if you have any questions.</p>
    `),
  }),
};

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { type, email, payload = {} } = await req.json();
    const to = email?.toLowerCase()?.trim();
    if (!to) throw new Error("Email is required");

    // ── signup_otp: generate code, store in DB, send email ──────────────
    if (type === "signup_otp") {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const db   = createClient(SUPABASE_URL, SUPABASE_SERVICE);

      // Expire old OTPs
      await db.from("signup_otps")
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq("email", to)
        .eq("verified", false);

      // Store new OTP (10 min expiry)
      const { error: dbErr } = await db.from("signup_otps").insert({
        email:      to,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified:   false,
      });
      if (dbErr) throw new Error(`DB: ${dbErr.message}`);

      const tpl = templates.signup_otp({ code });
      await sendEmail(to, tpl.subject, tpl.html);
      return json({ success: true, message: "Verification code sent." });
    }

    // ── All other types: just send the email ────────────────────────────
    const tpl = templates[type];
    if (!tpl) throw new Error(`Unknown type: ${type}`);

    const { subject, html } = tpl(payload);
    await sendEmail(to, subject, html);
    return json({ success: true });

  } catch (err: any) {
    console.error("[send-verification-email]", err.message);
    return json({ success: false, error: err.message }, 500);
  }
});
