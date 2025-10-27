import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, ArrowRight, PlayCircle } from 'lucide-react';
import { questions } from '../../Big5/src/data/questions';
import { calculateTraitScores } from '../../Big5/src/utils/scoring';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  const traits = [
    {
      name: 'Openness',
      description: 'Appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.',
      icon: '🎨'
    },
    {
      name: 'Conscientiousness',
      description: 'Self-discipline, organized, and achievement-oriented behavior.',
      icon: '📋'
    },
    {
      name: 'Extraversion',
      description: 'Energy, positive emotions, assertiveness, sociability, and stimulation in the company of others.',
      icon: '🌟'
    },
    {
      name: 'Agreeableness',
      description: 'Compassion, cooperation, and concern for others\' needs.',
      icon: '🤝'
    },
    {
      name: 'Neuroticism',
      description: 'Tendency to experience emotional instability, anxiety, moodiness, and irritability.',
      icon: '🌊'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-emerald-50 font-sans text-amber-900 p-4">
      {!started ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-amber-900 mb-4">
                Big Five Personality Test
              </h1>
              <p className="text-xl text-amber-800">
                Discover your personality traits through scientifically validated assessment
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {traits.map((trait) => (
                <div
                  key={trait.name}
                  className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-100"
                >
                  <div className="text-4xl mb-4">{trait.icon}</div>
                  <h3 className="text-xl font-semibold text-amber-900 mb-2">
                    {trait.name}
                  </h3>
                  <p className="text-amber-700">
                    {trait.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-amber-100 text-center">
              <h2 className="text-2xl font-bold text-amber-900 mb-4">
                Ready to Begin, {name}?
              </h2>
              <p className="text-amber-700 mb-6">
                This test consists of 50 questions and takes about 10 minutes to complete.
                Your responses will help you understand your personality across five fundamental dimensions.
              </p>
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <PlayCircle size={24} />
                Start Test
              </button>
            </div>
          </div>
        </div>
      ) : !isComplete ? (
        <div className="max-w-2xl mx-auto mt-8">
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
            <CardHeader className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
              <CardTitle>Saving your results...</CardTitle>
              <CardDescription>Please wait while we process your personality test</CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
