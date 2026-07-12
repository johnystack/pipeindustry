import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vtoxgygqabccaanrdqgf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0b3hneWdxYWJjY2FhbnJkcWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDY5ODksImV4cCI6MjA3MTg4Mjk4OX0.BuD3nllLNWc2d9JJj36BL5OS6PGiGcLkzWGYpAkZCKY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDirectAccess() {
  const testEmail = "direct-test@example.com";
  console.log("--- 1. Attempting direct insert into signup_otps ---");
  const { data: insertData, error: insertError } = await supabase
    .from("signup_otps")
    .insert({
      email: testEmail,
      code: "999999",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins
      verified: false
    })
    .select();

  if (insertError) {
    console.error("Direct insert failed:", insertError);
  } else {
    console.log("Direct insert succeeded. Returned data:", insertData);
  }

  console.log("\n--- 2. Attempting direct select from signup_otps ---");
  const { data: selectData, error: selectError } = await supabase
    .from("signup_otps")
    .select("*")
    .eq("email", testEmail);

  if (selectError) {
    console.error("Direct select failed:", selectError);
  } else {
    console.log("Direct select result:", selectData);
  }
}

testDirectAccess();
