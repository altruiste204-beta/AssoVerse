import { createClient } from "npm:@supabase/supabase-js@2.114.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const token = authHeader.split(" ")[1];
    const userClient = createClient(supabaseUrl, token);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, full_name, phone } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You cannot submit KYC for another user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic validation: check that name and phone are present
    if (!full_name || full_name.trim().length < 2) {
      // Update KYC status to rejected
      await supabase
        .from("profiles")
        .update({ kyc_status: "rejected" })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({ success: false, reason: "Name too short", status: "rejected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone format (basic Cameroon phone validation)
    const phoneClean = phone?.replace(/[\s\-]/g, "");
    if (!phoneClean || (phoneClean.length < 9 && !phoneClean.startsWith("+237"))) {
      await supabase
        .from("profiles")
        .update({ kyc_status: "rejected" })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({ success: false, reason: "Invalid phone number", status: "rejected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if ID document was uploaded
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id_document_url")
      .eq("id", user_id)
      .single();

    if (profileErr || !profile?.id_document_url) {
      return new Response(
        JSON.stringify({ success: false, reason: "No ID document uploaded", status: "pending" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic KYC verification passed — in production, this would call
    // an identity verification API. For now, we accept if all fields are present.
    await supabase
      .from("profiles")
      .update({
        kyc_status: "verified",
        kyc_verified_at: new Date().toISOString(),
        full_name: full_name,
        phone: phone,
      })
      .eq("id", user_id);

    // Audit log
    await supabase.from("audit_logs").insert({
      actor_id: user_id,
      action: "kyc_verified",
      entity_type: "profile",
      entity_id: user_id,
      details: { method: "basic_document_check" },
    });

    return new Response(
      JSON.stringify({ success: true, status: "verified" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
