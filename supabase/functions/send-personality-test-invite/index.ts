
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "npm:emailjs@4.0.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SMTP Configuration for personal email
const smtpClient = new SMTPClient({
  user: Deno.env.get("PERSONAL_EMAIL")!,
  password: Deno.env.get("PERSONAL_EMAIL_PASSWORD")!,
  host: Deno.env.get("SMTP_HOST")!,
  port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
  ssl: Deno.env.get("SMTP_SSL") === "true",
  tls: Deno.env.get("SMTP_TLS") === "true" || true,
});

// Function to generate a secure random token
function generateToken() {
  return crypto.randomUUID();
}

// Function to extract email from a string (including hyperlinks)
function extractEmail(text: string): string | null {
  // Regular expression for matching email addresses
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  
  // Try to find an email in the text
  const match = text.match(emailRegex);
  
  if (match && match.length > 0) {
    return match[0];
  }
  
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      resumeId, 
      email, 
      emailText,
      name, 
      personalityTestUrl = 'http://localhost:5173/personality-test',
      testResults
    } = await req.json();

    // If we have test results, store them and update invitation status
    if (testResults) {
      console.log("Received test results:", testResults);
      
      // Update invitation status
      const { error: updateError } = await supabase
        .from('personality_test_invitations')
        .update({ is_completed: true })
        .eq('token', testResults.token);
      
      if (updateError) {
        console.error("Error updating invitation status:", updateError);
        throw updateError;
      }
      
      // Store results in fitment_score table
      const { data: scoreData, error: scoreError } = await supabase
        .from('fitment_score')
        .insert({
          name: testResults.name,
          fitment_score: testResults.fitmentScore,
          extroversion_score: testResults.personalityScores?.extroversion || 0,
          agreeableness_score: testResults.personalityScores?.agreeableness || 0,
          openness_score: testResults.personalityScores?.openness || 0,
          neuroticism_score: testResults.personalityScores?.neuroticism || 0,
          conscientiousness_score: testResults.personalityScores?.conscientiousness || 0
        })
        .select()
        .single();
        
      if (scoreError) {
        console.error("Error storing fitment score:", scoreError);
        throw scoreError;
      }

      // Get candidate resume information to update the users table
      const { data: resumeData, error: resumeError } = await supabase
        .from('candidate_resume')
        .select('*')
        .eq('email', testResults.email)
        .single();

      if (!resumeError && resumeData) {
        // Check if user exists in users table
        const { data: existingUser, error: userQueryError } = await supabase
          .from('users')
          .select('*')
          .eq('email', testResults.email)
          .maybeSingle();

        if (userQueryError) {
          console.error("Error checking for existing user:", userQueryError);
        }

        if (!existingUser) {
          // Create new user if doesn't exist
          const { error: userInsertError } = await supabase
            .from('users')
            .insert({
              name: testResults.name,
              email: testResults.email,
              score: testResults.fitmentScore
            });

          if (userInsertError) {
            console.error("Error creating user record:", userInsertError);
          }
        } else {
          // Update existing user with new score
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({ score: testResults.fitmentScore })
            .eq('email', testResults.email);

          if (userUpdateError) {
            console.error("Error updating user score:", userUpdateError);
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Results stored successfully',
        scoreId: scoreData?.id
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      });
    }

    // Extract email from hyperlink or text if provided
    let candidateEmail = email;
    if (emailText) {
      const extractedEmail = extractEmail(emailText);
      if (extractedEmail) {
        candidateEmail = extractedEmail;
      }
    }
    
    if (!candidateEmail) {
      throw new Error("No valid email found");
    }

    // Generate unique token for new invitation
    const token = generateToken();

    // Store invitation in database using the correct schema
    const { data, error: insertError } = await supabase
      .from('personality_test_invitations')
      .insert({
        candidate_email: candidateEmail,
        token,
        is_completed: false
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Construct invitation link - use absolute URL with token
    const invitationLink = `${personalityTestUrl}?token=${token}`;

    // Send email using SMTP from personal email
    const message = {
      from: Deno.env.get("PERSONAL_EMAIL")!,
      to: candidateEmail,
      subject: 'Complete Your Personality Assessment',
      text: `Hello ${name},
      
We invite you to complete a brief personality assessment (Big Five) as part of your job application process.

Please click the link below to start the test:
${invitationLink}

This link is unique to you and will expire in 48 hours.

Best regards,
The Hiring Team`,
      html: `
        <h1>Hello ${name},</h1>
        <p>We invite you to complete a brief personality assessment (Big Five) as part of your job application process.</p>
        <p>Please click the link below to start the test:</p>
        <a href="${invitationLink}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Take the Personality Test</a>
        <p>This link is unique to you and will expire in 48 hours.</p>
        <p>Best regards,<br>The Hiring Team</p>
      `
    };

    try {
      await smtpClient.sendAsync(message);
      console.log("Email sent successfully to:", candidateEmail);
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      throw emailError;
    }

    return new Response(JSON.stringify({ 
      message: 'Invitation sent successfully', 
      invitationId: data.id 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 200
    });

  } catch (error) {
    console.error('Error in personality test invite function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
      status: 500
    });
  }
});
