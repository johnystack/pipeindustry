import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

serve(async (req) => {
  try {
    const { email, type, payload } = await req.json();

    let subject = "";
    let html = "";

    if (type === "password_reset") {
      subject = "Your Password Reset Code";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Security Verification</h2>
          <p>You requested to reset your password. Use the code below to authorize this action:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
            ${payload.code}
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">TerrasInvestment Security Team</p>
        </div>
      `;
    } else if (type === "welcome") {
      subject = "Welcome to TerrasInvestment!";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">Identity Provisioned</h2>
          <p>Hello ${payload.first_name || "Chief"},</p>
          <p>Welcome to <strong>TerrasInvestment</strong>. Your professional trading account has been successfully created and your identity is now active on our global hub.</p>
          <p>You can now start trading, manage your portfolio, and track your progress in real-time.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://terrasinvestment.org/login" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Your Dashboard</a>
          </div>
          <p>If you have any questions, our support team is available 24/7 to assist you.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 TerrasInvestment Global. All rights reserved.</p>
        </div>
      `;
    } else if (type === "verification") {
      // Keep existing verification logic if needed, or unify it
      const verificationUrl = `https://terrasinvestment.org/verify-email?token=${payload.token}`;
      subject = "Verify your email address";
      html = `Please click the following link to verify your email address: <a href="${verificationUrl}">${verificationUrl}</a>`;
    }

    const { data, error } = await resend.emails.send({
      from: "TerrasInvestment <noreply@terrasinvestment.org>",
      to: [email],
      subject: subject,
      html: html,
    });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
