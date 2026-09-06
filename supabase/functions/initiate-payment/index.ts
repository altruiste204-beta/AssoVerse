import { createClient } from "npm:@supabase/supabase-js@2.114.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const notchpayKey = Deno.env.get("NOTCHPAY_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { transaction_request_id, type, amount, currency, beneficiary_name, beneficiary_phone, association_id, related_entity_type, related_entity_id } = await req.json();

    // Verify the transaction request exists and has enough approvals
    const { data: txReq, error: txErr } = await supabase
      .from("transaction_requests")
      .select("*, bureau_approvals(*)")
      .eq("id", transaction_request_id)
      .single();

    if (txErr || !txReq) {
      return new Response(
        JSON.stringify({ error: "Transaction request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const approvedCount = (txReq.bureau_approvals || []).filter((a: { approved: boolean }) => a.approved).length;
    if (approvedCount < txReq.required_approvals) {
      return new Response(
        JSON.stringify({ error: "Insufficient approvals" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to executing
    await supabase
      .from("transaction_requests")
      .update({ status: "executing" })
      .eq("id", transaction_request_id);

    let notchpayResponse: Record<string, unknown>;
    let notchpayReference: string;

    if (notchpayKey) {
      // Real NotchPay API call
      const endpoint = type === "collection"
        ? "https://api.notchpay.co/payments/initialize"
        : "https://api.notchpay.co/disbursements";

      const payload = type === "collection"
        ? {
            amount: amount,
            currency: currency || "XAF",
            reference: `assomboa-${transaction_request_id}`,
            description: `AssoMboa - ${type}`,
            customer: { name: beneficiary_name, phone: beneficiary_phone },
          }
        : {
            amount: amount,
            currency: currency || "XAF",
            recipient: { name: beneficiary_name, phone: beneficiary_phone },
            reference: `assomboa-${transaction_request_id}`,
          };

      const apiResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${notchpayKey}`,
        },
        body: JSON.stringify(payload),
      });

      notchpayResponse = await apiResponse.json() as Record<string, unknown>;
      notchpayReference = (notchpayResponse as { reference?: string }).reference || `mock-${Date.now()}`;
    } else {
      // Mock response — clearly identified as such
      notchpayResponse = {
        mock: true,
        message: "MOCK RESPONSE — No NotchPay API key configured. Set NOTCHPAY_API_KEY environment variable.",
        status: "success",
        reference: `mock-${Date.now()}`,
      };
      notchpayReference = notchpayResponse.reference as string;
    }

    // Create transaction record
    await supabase.from("transactions").insert({
      association_id: association_id || txReq.association_id,
      transaction_request_id: transaction_request_id,
      type: type,
      amount: amount,
      currency: currency || "XAF",
      status: "success",
      external_reference: notchpayReference,
      notchpay_response: notchpayResponse,
      description: `${type} - ${beneficiary_name || ""}`,
    });

    // Update transaction request
    await supabase
      .from("transaction_requests")
      .update({
        status: "completed",
        notchpay_reference: notchpayReference,
        notchpay_response: notchpayResponse,
        executed_at: new Date().toISOString(),
      })
      .eq("id", transaction_request_id);

    // If related to a Main Levee, update collected amount
    if (related_entity_type === "main_levee" && related_entity_id && type === "collection") {
      const { data: ml } = await supabase
        .from("main_levees")
        .select("collected_amount, target_amount")
        .eq("id", related_entity_id)
        .single();

      if (ml) {
        const newCollected = ml.collected_amount + amount;
        const updateData: Record<string, unknown> = { collected_amount: newCollected };
        if (newCollected >= ml.target_amount) {
          updateData.status = "succeeded";
          updateData.disbursed_at = new Date().toISOString();
        }
        await supabase.from("main_levees").update(updateData).eq("id", related_entity_id);
      }
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      association_id: association_id || txReq.association_id,
      action: `payment_${type}_executed`,
      entity_type: "transaction_request",
      entity_id: transaction_request_id,
      details: { reference: notchpayReference, amount, mock: !notchpayKey },
    });

    return new Response(
      JSON.stringify({ success: true, reference: notchpayReference, mock: !notchpayKey, response: notchpayResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
