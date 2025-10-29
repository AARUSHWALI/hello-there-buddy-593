import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Big5App from '../../Big5/src/App';
import { calculateTraitScores } from '../../Big5/src/utils/scoring';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import '../../Big5/src/index.css';

export default function Big5Test() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const resumeId = searchParams.get('resumeId');

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleTestComplete = async (event: CustomEvent) => {
      const { scores } = event.detail;
      setIsSaving(true);

      try {
        // Calculate the trait scores
        const traitScores = calculateTraitScores(scores);
        
        // Map to Big5 traits (based on scoring.ts logic)
        const [extraversion, agreeableness, conscientiousness, neuroticism, openness] = traitScores;

        // Normalize scores to 0-100 range (each trait has 10 questions, max score 50)
        const normalizedScores = {
          extraversion: Math.round((extraversion / 50) * 100),
          agreeableness: Math.round((agreeableness / 50) * 100),
          conscientiousness: Math.round((conscientiousness / 50) * 100),
          neuroticism: Math.round((neuroticism / 50) * 100),
          openness: Math.round((openness / 50) * 100),
        };

        // Call the save-big5-results edge function
        const { data, error } = await supabase.functions.invoke('save-big5-results', {
          body: {
            candidateEmail: email,
            resumeId: resumeId,
            ...normalizedScores
          }
        });

        if (error) throw error;

        console.log('Results saved successfully:', data);
        setSaved(true);
      } catch (error) {
        console.error('Error saving results:', error);
        alert('Failed to save results. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    window.addEventListener('big5TestComplete', handleTestComplete as EventListener);
    return () => {
      window.removeEventListener('big5TestComplete', handleTestComplete as EventListener);
    };
  }, [email, resumeId]);

  if (!token || !email || !name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Invalid Test Link</CardTitle>
            <CardDescription>
              This personality test link is invalid or has expired. Please contact your recruiter for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <CardTitle>Saving your results...</CardTitle>
            <CardDescription>Please wait while we process your personality test</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Thank You, {name}!</CardTitle>
            <CardDescription>
              Your personality test has been submitted successfully. We'll review your results and get back to you soon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <Big5App isEmbedded={true} />;
}
