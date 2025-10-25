import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Big5Results {
  candidateEmail: string;
  resumeId?: string;
  extraversion: number;
  agreeableness: number;
  openness: number;
  neuroticism: number;
  conscientiousness: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results: Big5Results = await req.json();

    if (!results.candidateEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required field: candidateEmail" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role key for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate total score (average of all traits)
    const totalScore = (
      results.extraversion +
      results.agreeableness +
      results.openness +
      (100 - results.neuroticism) + // Invert neuroticism for positive contribution
      results.conscientiousness
    ) / 5;

    console.log('Saving Big5 results for:', results.candidateEmail);

    // Insert the results into the big5_scores table
    const { data, error } = await supabase
      .from('big5_scores')
      .insert({
        candidate_email: results.candidateEmail,
        resume_id: results.resumeId || null,
        extraversion: results.extraversion,
        agreeableness: results.agreeableness,
        openness: results.openness,
        neuroticism: results.neuroticism,
        conscientiousness: results.conscientiousness,
        total_score: totalScore,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving Big5 results:", error);
      throw error;
    }

    console.log("Big5 results saved successfully:", data);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Results saved successfully",
      data: data
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in save-big5-results function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to save results",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
