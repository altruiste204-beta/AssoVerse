import { createClient } from "npm:@supabase/supabase-js@2.114.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function base64ToUint8Array(base64: string): Uint8Array {
  const rawBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  const binaryString = atob(rawBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

    const { document_type, cni_base64, selfie_base64, liveness_base64 } = await req.json();

    if (!document_type || !cni_base64 || !selfie_base64 || !liveness_base64) {
      return new Response(
        JSON.stringify({ error: "All files and document_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["cni", "passeport", "permis"].includes(document_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid document type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert base64 to binary
    const cniBytes = base64ToUint8Array(cni_base64);
    const selfieBytes = base64ToUint8Array(selfie_base64);
    const livenessBytes = base64ToUint8Array(liveness_base64);

    // Enforce max 3MB per file
    const maxBytes = 3 * 1024 * 1024;
    if (cniBytes.length > maxBytes || selfieBytes.length > maxBytes || livenessBytes.length > maxBytes) {
      return new Response(
        JSON.stringify({ error: "Files exceed maximum size limit of 3MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Define storage paths inside bucket kyc_docs under user folder
    const cniPath = `${user.id}/cni_${Date.now()}.png`;
    const selfiePath = `${user.id}/selfie_${Date.now()}.png`;
    const livenessPath = `${user.id}/liveness_${Date.now()}.png`;

    // Upload CNI
    const { error: cniErr } = await supabase.storage
      .from("kyc_docs")
      .upload(cniPath, cniBytes, { contentType: "image/png", upsert: true });
    if (cniErr) throw new Error(`CNI upload failed: ${cniErr.message}`);

    // Upload Selfie
    const { error: selfieErr } = await supabase.storage
      .from("kyc_docs")
      .upload(selfiePath, selfieBytes, { contentType: "image/png", upsert: true });
    if (selfieErr) throw new Error(`Selfie upload failed: ${selfieErr.message}`);

    // Upload Liveness
    const { error: livenessErr } = await supabase.storage
      .from("kyc_docs")
      .upload(livenessPath, livenessBytes, { contentType: "image/png", upsert: true });
    if (livenessErr) throw new Error(`Liveness upload failed: ${livenessErr.message}`);

    // Insert pending submission into kyc_submissions
    const { error: insertErr } = await supabase
      .from("kyc_submissions")
      .upsert({
        user_id: user.id,
        document_type,
        cni_path: cniPath,
        selfie_path: selfiePath,
        liveness_path: livenessPath,
        status: "pending",
        rejection_reason: null,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (insertErr) throw insertErr;

    // Also update kyc_status to pending in profiles
    await supabase
      .from("profiles")
      .update({ kyc_status: "pending" })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "KYC liveness submitted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
