import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { usePersonalityTest } from '@/hooks/usePersonalityTest';
import { CheckCircle2 } from 'lucide-react';

export default function PersonalityTest() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  const nameParam = searchParams.get('name');
  
  const [name, setName] = useState(nameParam || '');
  const [email, setEmail] = useState(emailParam || '');
  const [submitted, setSubmitted] = useState(false);
  
  const [scores, setScores] = useState({
    extraversion: 50,
    agreeableness: 50,
    openness: 50,
    neuroticism: 50,
    conscientiousness: 50,
  });

  const { isSubmitting, submitTestResults } = usePersonalityTest();

  const handleScoreChange = (trait: keyof typeof scores, value: number[]) => {
    setScores(prev => ({ ...prev, [trait]: value[0] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      return;
    }

    const success = await submitTestResults({
      token: token || '',
      name,
      email,
      fitmentScore: Object.values(scores).reduce((a, b) => a + b, 0) / 5,
      personalityScores: scores,
    });

    if (success) {
      setSubmitted(true);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">Thank You!</CardTitle>
            <CardDescription>
              Your personality test has been submitted successfully. We'll review your results and get back to you soon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Personality Assessment</CardTitle>
            <CardDescription>
              Please complete this assessment to help us understand your work style and preferences better.
              Rate yourself on each trait from 0 (low) to 100 (high).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4 pb-6 border-b">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Personality Traits */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="extraversion" className="text-base font-semibold">
                      Extraversion
                    </Label>
                    <span className="text-sm font-medium text-purple-600">{scores.extraversion}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    How outgoing, sociable, and energetic are you?
                  </p>
                  <Slider
                    id="extraversion"
                    value={[scores.extraversion]}
                    onValueChange={(value) => handleScoreChange('extraversion', value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="agreeableness" className="text-base font-semibold">
                      Agreeableness
                    </Label>
                    <span className="text-sm font-medium text-purple-600">{scores.agreeableness}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    How cooperative, compassionate, and considerate are you?
                  </p>
                  <Slider
                    id="agreeableness"
                    value={[scores.agreeableness]}
                    onValueChange={(value) => handleScoreChange('agreeableness', value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="openness" className="text-base font-semibold">
                      Openness
                    </Label>
                    <span className="text-sm font-medium text-purple-600">{scores.openness}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    How open are you to new experiences and ideas?
                  </p>
                  <Slider
                    id="openness"
                    value={[scores.openness]}
                    onValueChange={(value) => handleScoreChange('openness', value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="neuroticism" className="text-base font-semibold">
                      Emotional Stability
                    </Label>
                    <span className="text-sm font-medium text-purple-600">{100 - scores.neuroticism}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    How calm and emotionally stable are you under pressure?
                  </p>
                  <Slider
                    id="neuroticism"
                    value={[100 - scores.neuroticism]}
                    onValueChange={(value) => handleScoreChange('neuroticism', [100 - value[0]])}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="conscientiousness" className="text-base font-semibold">
                      Conscientiousness
                    </Label>
                    <span className="text-sm font-medium text-purple-600">{scores.conscientiousness}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    How organized, responsible, and detail-oriented are you?
                  </p>
                  <Slider
                    id="conscientiousness"
                    value={[scores.conscientiousness]}
                    onValueChange={(value) => handleScoreChange('conscientiousness', value)}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting || !name || !email}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
