import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (req.method === "GET") {
      console.log("📊 Fetching fitment criteria");

      const { data, error } = await supabase
        .from("fitment_criteria")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      // Return default values if no criteria exists
      if (!data || data.length === 0) {
        console.log("⚠️ No criteria found, returning defaults");
        return new Response(
          JSON.stringify({
            id: null,
            best_fit: 80,
            average_fit: 50,
            not_fit: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log("✅ Criteria fetched successfully");
      return new Response(JSON.stringify(data[0]), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (req.method === "PUT") {
      const { best_fit, average_fit, not_fit } = await req.json();

      console.log("📝 Updating criteria:", { best_fit, average_fit, not_fit });

      // Validate input
      if (best_fit === undefined || average_fit === undefined || not_fit === undefined) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Validate the criteria values
      if (best_fit <= average_fit || average_fit <= not_fit || not_fit < 0) {
        return new Response(
          JSON.stringify({
            error: "Invalid criteria values. Must satisfy: best_fit > average_fit > not_fit >= 0",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Get current criteria
      const { data: current, error: fetchError } = await supabase
        .from("fitment_criteria")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      let result;
      if (current && current.length > 0) {
        // Update existing
        const { data: updated, error: updateError } = await supabase
          .from("fitment_criteria")
          .update({
            best_fit,
            average_fit,
            not_fit,
            updated_at: new Date().toISOString(),
          })
          .eq("id", current[0].id)
          .select();

        if (updateError) throw updateError;
        result = updated[0];
      } else {
        // Insert new
        const { data: inserted, error: insertError } = await supabase
          .from("fitment_criteria")
          .insert([{ best_fit, average_fit, not_fit }])
          .select();

        if (insertError) throw insertError;
        result = inserted[0];
      }

      console.log("✅ Criteria updated successfully");
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
