import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const questions = [
  {"code":1,"text":"I am the life of the party."},
  {"code":-2,"text":"I feel little concern for others."},
  {"code":3,"text":"I am always prepared."},
  {"code":-4,"text":"I get stressed out easily."},
  {"code":5,"text":"I have a rich vocabulary."},
  {"code":-6,"text":"I don't talk a lot."},
  {"code":7,"text":"I am interested in people."},
  {"code":-8,"text":"I leave my belongings around."},
  {"code":9,"text":"I am relaxed most of the time."},
  {"code":-10,"text":"I have difficulty understanding abstract ideas."},
  {"code":11,"text":"I feel comfortable around people."},
  {"code":-12,"text":"I insult people."},
  {"code":13,"text":"I pay attention to details."},
  {"code":-14,"text":"I worry about things."},
  {"code":15,"text":"I have a vivid imagination."},
  {"code":-16,"text":"I keep in the background."},
  {"code":17,"text":"I sympathize with others' feelings."},
  {"code":-18,"text":"I make a mess of things."},
  {"code":19,"text":"I seldom feel blue."},
  {"code":-20,"text":"I am not interested in abstract ideas."},
  {"code":21,"text":"I start conversations."},
  {"code":-22,"text":"I am not interested in other people's problems."},
  {"code":23,"text":"I get chores done right away."},
  {"code":-24,"text":"I am easily disturbed."},
  {"code":25,"text":"I have excellent ideas."},
  {"code":-26,"text":"I have little to say."},
  {"code":27,"text":"I have a soft heart."},
  {"code":-28,"text":"I often forget to put things back in their proper place."},
  {"code":-29,"text":"I get upset easily."},
  {"code":-30,"text":"I do not have a good imagination."},
  {"code":31,"text":"I talk to a lot of different people at parties."},
  {"code":-32,"text":"I am not really interested in others."},
  {"code":33,"text":"I like order."},
  {"code":-34,"text":"I change my mood a lot."},
  {"code":35,"text":"I am quick to understand things."},
  {"code":-36,"text":"I don't like to draw attention to myself."},
  {"code":37,"text":"I take time out for others."},
  {"code":-38,"text":"I shirk my duties."},
  {"code":-39,"text":"I have frequent mood swings."},
  {"code":40,"text":"I use difficult words."},
  {"code":41,"text":"I don't mind being the center of attention."},
  {"code":42,"text":"I feel others' emotions."},
  {"code":43,"text":"I follow a schedule."},
  {"code":-44,"text":"I get irritated easily."},
  {"code":45,"text":"I spend time reflecting on things."},
  {"code":-46,"text":"I am quiet around strangers."},
  {"code":47,"text":"I make people feel at ease."},
  {"code":48,"text":"I am exacting in my work."},
  {"code":-49,"text":"I often feel blue."},
  {"code":50,"text":"I am full of ideas."}
];

const calculateTraitScores = (scores: number[]) => {
  const traitScores = new Array(5).fill(0);
  scores.forEach((score, index) => {
    const question = questions[index];
    const traitIndex = (Math.abs(question.code) % 5 || 5) - 1;
    traitScores[traitIndex] += score;
  });
  return traitScores;
};

const SplashPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-emerald-50 p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-amber-900 mb-4">
          Big Five Personality Test
        </h1>
        <p className="text-xl text-amber-800 mb-12">
          Discover your personality traits through scientifically validated assessment
        </p>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-amber-100 mb-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-4">
            Ready to Begin?
          </h2>
          <p className="text-amber-700 mb-6">
            This test consists of 50 questions and takes about 10 minutes to complete.
            Your responses will help understand your personality across five fundamental dimensions.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <PlayCircle size={24} />
            Start Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PersonalityTest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<number[]>(new Array(questions.length).fill(0));
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const candidateEmail = searchParams.get('email') || '';
  const candidateName = searchParams.get('name') || '';
  const resumeId = searchParams.get('resumeId') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token || !candidateEmail) {
      toast.error('Invalid test link. Please check your email for the correct link.');
    }
  }, [token, candidateEmail]);

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
    setIsSubmitting(true);

    try {
      const traitScores = calculateTraitScores(scores);
      
      const normalizedScores = {
        candidateEmail,
        resumeId: resumeId || undefined,
        extraversion: Math.round((traitScores[0] / 50) * 100),
        agreeableness: Math.round((traitScores[1] / 50) * 100),
        conscientiousness: Math.round((traitScores[2] / 50) * 100),
        neuroticism: Math.round((traitScores[3] / 50) * 100),
        openness: Math.round((traitScores[4] / 50) * 100),
      };

      const { data, error } = await supabase.functions.invoke('save-big5-results', {
        body: normalizedScores
      });

      if (error) throw error;

      toast.success('Thank you! Your results have been saved successfully.');
      
      setTimeout(() => {
        navigate('/thank-you');
      }, 2000);
    } catch (error) {
      console.error('Error saving results:', error);
      toast.error('Failed to save results. Please try again.');
      setIsComplete(false);
      setIsSubmitting(false);
    }
  };

  if (!token || !candidateEmail) {
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

  if (!started) {
    return <SplashPage onStart={handleStart} />;
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <CardTitle>Saving your results...</CardTitle>
            <CardDescription>Please wait while we process your personality test</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-4">
      <div className="container mx-auto max-w-2xl mt-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="p-2 text-amber-600 disabled:text-amber-300 hover:text-amber-700 disabled:hover:text-amber-300 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="text-lg font-medium text-amber-900">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleComplete}
              disabled={scores.some(s => s === 0)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayCircle size={20} />
              Complete
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentQuestion === questions.length - 1}
              className="p-2 text-amber-600 disabled:text-amber-300 hover:text-amber-700 disabled:hover:text-amber-300 transition-colors"
            >
              <ArrowRight size={24} />
            </button>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-amber-100">
          <h2 className="text-xl font-bold text-amber-900 mb-6">{questions[currentQuestion].text}</h2>
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => {
                  handleScore(score);
                  if (currentQuestion < questions.length - 1) {
                    setTimeout(() => handleNext(), 150);
                  }
                }}
                className={`p-4 rounded-xl font-medium transition-all ${
                  scores[currentQuestion] === (questions[currentQuestion].code < 0 ? 6 - score : score)
                    ? 'bg-emerald-600 text-white shadow-lg scale-105'
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

        <div className="w-full bg-amber-200 rounded-full h-2">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
