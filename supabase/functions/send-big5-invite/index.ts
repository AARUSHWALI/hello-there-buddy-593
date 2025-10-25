import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  candidateEmail: string;
  candidateName: string;
  resumeId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateEmail, candidateName, resumeId }: InviteRequest = await req.json();

    if (!candidateEmail || !candidateName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: candidateEmail and candidateName" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate a unique token for this test invitation
    const token = crypto.randomUUID();
    
    // Create the test URL with the token - use the production URL
    const baseUrl = 'https://ptxabbwxvwgrhmjwofms.supabase.co';
    const testUrl = `${baseUrl}/personality-test?token=${token}&email=${encodeURIComponent(candidateEmail)}&name=${encodeURIComponent(candidateName)}${resumeId ? `&resumeId=${resumeId}` : ''}`;

    console.log('Sending Big5 test invite to:', candidateEmail);

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "People AI <onboarding@resend.dev>",
      to: [candidateEmail],
      subject: "Complete Your Personality Assessment",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
              }
              .container { 
                max-width: 600px; 
                margin: 40px auto; 
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h1 { 
                color: #8B5CF6; 
                margin-bottom: 20px;
              }
              .button { 
                display: inline-block;
                padding: 12px 24px;
                background-color: #8B5CF6;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 600;
              }
              .button:hover {
                background-color: #7C3AED;
              }
              .info-box {
                background-color: #f9fafb;
                border-left: 4px solid #8B5CF6;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Hello ${candidateName}! 👋</h1>
              
              <p>Thank you for submitting your application. As part of our hiring process, we would like you to complete a personality assessment to help us better understand your work style and preferences.</p>
              
              <div class="info-box">
                <strong>📝 What to expect:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>The test consists of 50 questions</li>
                  <li>It takes approximately 10-15 minutes to complete</li>
                  <li>There are no right or wrong answers - just be honest</li>
                  <li>Your responses will help us find the best role fit for you</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${testUrl}" class="button">Start Personality Test</a>
              </div>
              
              <p style="margin-top: 20px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #8B5CF6; font-size: 14px;">${testUrl}</p>
              
              <div class="footer">
                <p>This link is unique to you. Please complete the assessment within the next 7 days.</p>
                <p>If you have any questions, feel free to reach out to us.</p>
                <p style="margin-top: 20px;">Best regards,<br>The People AI Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Big5 test invite sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Invitation sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-big5-invite function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send invitation",
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
