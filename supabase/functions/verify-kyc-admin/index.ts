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

    const { target_user_id, status, rejection_reason } = await req.json();

    if (!target_user_id || !status) {
      return new Response(
        JSON.stringify({ error: "target_user_id and status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["verified", "rejected"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "status must be verified or rejected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller has administrative privileges (role 'proprio' in bureau_assignments)
    const { data: assignments, error: assignErr } = await supabase
      .from("bureau_assignments")
      .select("association_id")
      .eq("user_id", user.id)
      .eq("role", "proprio");

    if (assignErr || !assignments || assignments.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Only association owners (proprio) can verify KYC" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify target_user_id is an active member of at least one association where caller is proprio
    const ownedAssocIds = assignments.map((a: { association_id: string }) => a.association_id);
    const { data: memberRecord, error: memberErr } = await supabase
      .from("association_members")
      .select("id")
      .eq("user_id", target_user_id)
      .eq("status", "active")
      .in("association_id", ownedAssocIds)
      .limit(1);

    if (memberErr || !memberRecord || memberRecord.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Target user is not an active member of any association where caller is proprio" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update kyc_submissions table
    const { error: updateSubErr } = await supabase
      .from("kyc_submissions")
      .update({
        status,
        rejection_reason: status === "rejected" ? rejection_reason : null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", target_user_id);

    if (updateSubErr) throw updateSubErr;

    // Update profiles table
    const { error: updateProfErr } = await supabase
      .from("profiles")
      .update({
        kyc_status: status,
        kyc_verified: status === "verified",
        kyc_verified_at: status === "verified" ? new Date().toISOString() : null
      })
      .eq("id", target_user_id);

    if (updateProfErr) throw updateProfErr;

    // Create an audit log entry
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: status === "verified" ? "kyc_approved" : "kyc_rejected",
      entity_type: "profile",
      entity_id: target_user_id,
      details: { status, reason: rejection_reason || "Admin decision" }
    });

    return new Response(
      JSON.stringify({ success: true, message: `KYC successfully ${status}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
