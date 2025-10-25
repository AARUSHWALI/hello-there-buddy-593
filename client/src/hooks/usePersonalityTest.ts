import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type PersonalityScores = {
  extraversion: number;
  agreeableness: number;
  openness: number;
  neuroticism: number;
  conscientiousness: number;
};

export type TestResults = {
  token: string;
  name: string;
  email: string;
  fitmentScore: number;
  personalityScores: PersonalityScores;
};

export type InviteParams = {
  email?: string;
  emailText?: string;
  name: string;
};

// Helper function to extract email from text or hyperlink
const extractEmail = (text: string): string | null => {
  // Check if it's a hyperlink with mailto:
  const mailtoRegex = /mailto:([^"'?]+)/i;
  const mailtoMatch = text.match(mailtoRegex);
  
  if (mailtoMatch && mailtoMatch[1]) {
    return mailtoMatch[1];
  }
  
  // Regular expression for matching email addresses in text
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emailMatch = text.match(emailRegex);
  
  if (emailMatch && emailMatch.length > 0) {
    return emailMatch[0];
  }
  
  return null;
};

export function usePersonalityTest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const submitTestResults = async (results: TestResults) => {
    try {
      setIsSubmitting(true);
      
      // Calculate the overall fitment score if not provided
      if (!results.fitmentScore) {
        const scores = Object.values(results.personalityScores);
        results.fitmentScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }

      // Submit to Supabase via edge function
      const { data, error } = await supabase.functions.invoke('save-big5-results', {
        body: {
          candidateEmail: results.email,
          resumeId: results.token,
          extraversion: results.personalityScores.extraversion,
          agreeableness: results.personalityScores.agreeableness,
          openness: results.personalityScores.openness,
          neuroticism: results.personalityScores.neuroticism,
          conscientiousness: results.personalityScores.conscientiousness,
        }
      });

      if (error) {
        console.error('Error submitting test results:', error);
        throw error;
      }

      console.log('Test results submitted successfully:', data);

      // Show success message
      toast({
        title: "Test submitted successfully",
        description: "Your personality test results have been recorded.",
      });
      
      sonnerToast.success("Test submitted successfully");
      
      return true;
    } catch (error) {
      console.error('Error submitting test results:', error);
      
      toast({
        title: "Failed to submit test",
        description: "Please try again later.",
        variant: "destructive"
      });
      
      sonnerToast.error("Failed to submit test");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendTestInvite = async ({ email, emailText, name }: InviteParams) => {
    try {
      setIsSending(true);
      
      // If emailText is provided, try to extract email from it
      let candidateEmail = email;
      if (emailText && !email) {
        const extractedEmail = extractEmail(emailText);
        if (extractedEmail) {
          candidateEmail = extractedEmail;
        } else {
          throw new Error("Could not extract a valid email address");
        }
      }
      
      if (!candidateEmail) {
        throw new Error("No valid email provided");
      }
      
      // Send invitation via edge function
      const { data, error } = await supabase.functions.invoke('send-big5-invite', {
        body: {
          candidateEmail,
          candidateName: name,
        }
      });

      if (error) {
        console.error('Error sending test invitation:', error);
        throw error;
      }

      console.log('Test invitation sent successfully:', data);

      // Show success message
      toast({
        title: "Invitation sent",
        description: `A personality test invitation has been sent to ${candidateEmail}.`,
      });
      
      sonnerToast.success("Invitation sent successfully");
      return true;
    } catch (error) {
      console.error('Error sending test invitation:', error);
      
      toast({
        title: "Failed to send invitation",
        description: "Please try again later.",
        variant: "destructive"
      });
      
      sonnerToast.error("Failed to send invitation");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSubmitting,
    isSending,
    submitTestResults,
    sendTestInvite
  };
}
