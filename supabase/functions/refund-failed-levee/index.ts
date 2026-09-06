import { createClient } from "npm:@supabase/supabase-js@2.114.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const notchpayKey = Deno.env.get("NOTCHPAY_API_KEY");
const cronSecret = Deno.env.get("CRON_SECRET");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Cette fonction traite de vrais remboursements et n'exige pas de JWT
  // utilisateur (verify_jwt = false) pour permettre son déclenchement
  // automatique par pg_cron. Elle doit donc vérifier elle-même un secret
  // partagé, sans quoi n'importe qui connaissant l'URL pourrait la déclencher.
  if (!cronSecret) {
    return new Response(
      JSON.stringify({ error: "CRON_SECRET not configured on the server" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const providedSecret = req.headers.get("x-cron-secret");
  if (providedSecret !== cronSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Find expired tout_ou_rien Main Levees that didn't reach target
    const { data: expiredLevees, error: findErr } = await supabase
      .from("main_levees")
      .select("*, main_levee_contributions(*)")
      .eq("mode", "tout_ou_rien")
      .eq("status", "active")
      .lt("deadline", new Date().toISOString());

    if (findErr) throw findErr;

    const results: { levee_id: string; refunds: number; errors: number }[] = [];

    for (const levee of expiredLevees || []) {
      // Check if target was NOT reached
      if (levee.collected_amount >= levee.target_amount) {
        continue; // Target reached, no refund needed
      }

      // Update status to refunding
      await supabase
        .from("main_levees")
        .update({ status: "refunding" })
        .eq("id", levee.id);

      let refundCount = 0;
      let errorCount = 0;

      // Refund each contributor
      const contributions = levee.main_levee_contributions || [];
      for (const contrib of contributions) {
        if (contrib.status !== "success") continue;

        let refundRef: string;

        if (notchpayKey) {
          // Real NotchPay refund API call
          const apiResponse = await fetch("https://api.notchpay.co/payments/refund", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${notchpayKey}`,
            },
            body: JSON.stringify({
              reference: contrib.notchpay_reference,
              amount: contrib.amount,
            }),
          });
          const refundData = await apiResponse.json() as Record<string, unknown>;
          refundRef = (refundData as { reference?: string }).reference || `refund-${Date.now()}`;
        } else {
          // Mock refund
          refundRef = `mock-refund-${Date.now()}`;
        }

        // Update contribution status
        const { error: updateErr } = await supabase
          .from("main_levee_contributions")
          .update({
            status: "refunded",
            refund_reference: refundRef,
          })
          .eq("id", contrib.id);

        if (updateErr) {
          errorCount++;
        } else {
          refundCount++;
        }

        // Create refund transaction record
        await supabase.from("transactions").insert({
          association_id: levee.association_id,
          type: "refund",
          amount: contrib.amount,
          currency: "XAF",
          status: "success",
          external_reference: refundRef,
          description: `Refund - Main Levée ${levee.title}`,
        });
      }

      // Update Main Levée status to refunded
      await supabase
        .from("main_levees")
        .update({ status: "refunded" })
        .eq("id", levee.id);

      // Audit log
      await supabase.from("audit_logs").insert({
        association_id: levee.association_id,
        action: "main_levee_refunds_processed",
        entity_type: "main_levee",
        entity_id: levee.id,
        details: { refund_count: refundCount, error_count: errorCount, mock: !notchpayKey },
      });

      results.push({ levee_id: levee.id, refunds: refundCount, errors: errorCount });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
        mock: !notchpayKey,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
