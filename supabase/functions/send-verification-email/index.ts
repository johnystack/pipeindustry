import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

serve(async (req) => {
  const { email, token } = await req.json();

  const verificationUrl = `https://pipindustry.org/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "noreply@pipindustry.org",
    to: [email],
    subject: "Verify your email address",
    html: `Please click the following link to verify your email address: <a href="${verificationUrl}">${verificationUrl}</a>`,
  });

  if (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
