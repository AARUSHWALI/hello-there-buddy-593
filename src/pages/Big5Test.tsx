import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Dice6, ArrowLeft, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import { questions } from '../../Big5/src/data/questions';
import { calculateTraitScores } from '../../Big5/src/utils/scoring';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Big5Test() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const resumeId = searchParams.get('resumeId');

  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<number[]>(new Array(questions.length).fill(0));
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleStart = () => setStarted(true);

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(curr => curr + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(curr => curr - 1);
    }
  };

  const handleScore = (originalScore: number) => {
    const newScores = [...scores];
    const finalScore = questions[currentQuestion].code < 0 ? (6 - originalScore) : originalScore;
    newScores[currentQuestion] = finalScore;
    setScores(newScores);
  };

  const handleComplete = async () => {
    setIsComplete(true);
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

  return (
    <div className="container mx-auto max-w-2xl min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 font-sans text-amber-900 p-4">
      {!started ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center max-w-2xl border-2 border-amber-200">
            <div className="mb-8 flex justify-center">
              <div className="p-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-lg">
                <Dice6 size={64} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
              Big Five Personality Test
            </h1>
            <p className="text-lg mb-8 text-amber-700">
              Hello {name}! Discover your personality traits through 50 scientifically-backed questions.
            </p>
            <div className="bg-amber-50 rounded-xl p-6 mb-8 border border-amber-200">
              <h3 className="font-semibold mb-3 text-amber-900">What you'll discover:</h3>
              <ul className="text-left space-y-2 text-amber-800">
                <li>• <strong>Extraversion</strong> - Your social energy level</li>
                <li>• <strong>Agreeableness</strong> - How you interact with others</li>
                <li>• <strong>Conscientiousness</strong> - Your organization and reliability</li>
                <li>• <strong>Neuroticism</strong> - Your emotional stability</li>
                <li>• <strong>Openness</strong> - Your creativity and curiosity</li>
              </ul>
            </div>
            <Button 
              onClick={handleStart}
              className="px-8 py-6 text-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl shadow-lg"
            >
              Begin Test
            </Button>
          </div>
        </div>
      ) : !isComplete ? (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              className="p-2 text-amber-600 disabled:text-amber-300 hover:text-amber-700 disabled:hover:text-amber-300"
            >
              <ArrowLeft size={24} />
            </button>
            <span className="text-lg font-medium">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <PlayCircle size={20} />
                {isSaving ? 'Saving...' : 'Complete'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentQuestion === questions.length - 1}
                className="p-2 text-amber-600 disabled:text-amber-300 hover:text-amber-700 disabled:hover:text-amber-300"
              >
                <ArrowRight size={24} />
              </button>
            )}
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-amber-100">
            <h2 className="text-xl font-bold mb-6">{questions[currentQuestion].text}</h2>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => {
                    handleScore(score);
                    if (currentQuestion < questions.length - 1) {
                      handleNext();
                    }
                  }}
                  className={`p-4 rounded-xl font-medium transition-all ${
                    scores[currentQuestion] === (questions[currentQuestion].code < 0 ? 6 - score : score)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-amber-600 mt-4">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <p className="text-lg text-amber-700">Saving your results...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
