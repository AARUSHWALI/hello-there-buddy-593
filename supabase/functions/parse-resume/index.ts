import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParseResumeRequest {
  resumeText: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText }: ParseResumeRequest = await req.json();

    if (!resumeText) {
      throw new Error("Resume text is required");
    }

    console.log("Parsing resume with Lovable AI...");

    const prompt = `
Extract structured information from the following resume and return ONLY valid JSON (no markdown, no code blocks, no explanations).
Use double quotes for all keys and string values.

Required structure:
{
  "name": string,
  "email": string,
  "phone": string,
  "address": string,
  "summary": string,
  "education": [{"degree": string, "institution": string, "year": string, "field": string}],
  "experience": [{"title": string, "company": string, "duration": string, "description": string}],
  "skills": [string array],
  "Candidate_Type": boolean (true if experienced, false if fresher),
  "Longevity_Years": number (total working years),
  "No_of_Jobs": number,
  "Experience_Average": number (Longevity_Years / No_of_Jobs),
  "Skills_No": number,
  "Achievements_No": number,
  "Achievements": [string array],
  "Trainings_No": number,
  "Trainings": [string array],
  "Workshops_No": number,
  "Workshops": [string array],
  "Research_Papers_No": number,
  "Research_Papers": [string array],
  "Patents_No": number,
  "Patents": [string array],
  "Books_No": number,
  "Books": [string array],
  "State_JK": number (0 or 1),
  "Projects_No": number,
  "Projects": [string array],
  "Best_Fit_For": string (suggest suitable job role),
  "Profile_Score": number (0-100, based on experience, skills, achievements)
}

Return ONLY the JSON object, nothing else.`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `${prompt}\n\nResume Content:\n${resumeText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", errorText);
      throw new Error(`AI request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("Raw AI response:", aiResponse);

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    cleanedResponse = cleanedResponse.replace(/^```json\s*/i, "").replace(/^```\s*/, "");
    cleanedResponse = cleanedResponse.replace(/```\s*$/, "");
    cleanedResponse = cleanedResponse.trim();

    // Parse the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Attempted to parse:", cleanedResponse);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log("Successfully parsed resume data");

    return new Response(
      JSON.stringify({ success: true, data: parsedData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in parse-resume function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to parse resume",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
