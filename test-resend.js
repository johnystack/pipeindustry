import { Resend } from "resend";

const resend = new Resend("re_YGiQ6jYV_7vdyWCYUJcRY1AQ6zpEgUBvg");

async function testResend() {
  console.log("--- Testing Resend API Key ---");
  try {
    const { data, error } = await resend.emails.send({
      from: "TerrasInvestment <noreply@terrasinvestment.com>",
      to: ["delivered@resend.dev"], // Resend testing email or any email
      subject: "Test Email from Diagnostic Script",
      html: "<p>This is a test email to check API key status.</p>"
    });

    if (error) {
      console.error("Resend API returned an error:", error);
    } else {
      console.log("Resend API response:", data);
    }
  } catch (err) {
    console.error("Unexpected exception:", err);
  }
}

testResend();
