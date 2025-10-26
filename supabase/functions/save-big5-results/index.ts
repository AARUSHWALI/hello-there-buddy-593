import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Big5Results {
  candidateEmail: string;
  candidateName?: string;
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

    // Calculate fitment score (average of all traits, with neuroticism inverted)
    const fitmentScore = (
      results.extraversion +
      results.agreeableness +
      results.openness +
      (100 - results.neuroticism) + // Invert neuroticism for positive contribution
      results.conscientiousness
    ) / 5;

    console.log('Saving Big5 results for:', results.candidateEmail);
    console.log('Personality scores:', {
      extraversion: results.extraversion,
      agreeableness: results.agreeableness,
      openness: results.openness,
      neuroticism: results.neuroticism,
      conscientiousness: results.conscientiousness,
      fitmentScore
    });

    // Try to find existing candidate by email
    const { data: existingCandidate, error: findError } = await supabase
      .from('candidates')
      .select('id')
      .eq('email', results.candidateEmail)
      .maybeSingle();

    if (findError) {
      console.error('Error finding candidate:', findError);
    }

    let savedData;

    if (existingCandidate) {
      // Update existing candidate with Big5 scores
      console.log('Updating existing candidate:', existingCandidate.id);
      const { data: updateData, error: updateError } = await supabase
        .from('candidates')
        .update({
          extraversion: results.extraversion,
          agreeableness: results.agreeableness,
          openness: results.openness,
          neuroticism: results.neuroticism,
          conscientiousness: results.conscientiousness,
          fitment_score: fitmentScore,
        })
        .eq('id', existingCandidate.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating candidate with Big5 results:", updateError);
        throw updateError;
      }

      savedData = updateData;
      console.log("Big5 results updated successfully for existing candidate");
    } else {
      // Create new candidate with Big5 scores
      console.log('Creating new candidate for:', results.candidateEmail);
      const { data: insertData, error: insertError } = await supabase
        .from('candidates')
        .insert({
          name: results.candidateName || results.candidateEmail.split('@')[0],
          email: results.candidateEmail,
          extraversion: results.extraversion,
          agreeableness: results.agreeableness,
          openness: results.openness,
          neuroticism: results.neuroticism,
          conscientiousness: results.conscientiousness,
          fitment_score: fitmentScore,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating candidate with Big5 results:", insertError);
        throw insertError;
      }

      savedData = insertData;
      console.log("New candidate created successfully with Big5 results");
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: existingCandidate ? "Results updated successfully" : "Results saved successfully",
      data: savedData
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
