import { calculateTraitScores } from '../utils/scoring';
import { PersonalityChart } from './PersonalityChart';
import { PersonalityInsights } from './PersonalityInsights';
import { useEffect } from 'react';
import axios from 'axios';

interface ResultsCardProps {
  scores: number[];
}

export function ResultsCard({ scores }: ResultsCardProps) {
  const traitScores = calculateTraitScores(scores);
  const traits = [
    { name: 'Extraversion', description: 'Energy, positive emotions, assertiveness, sociability and the tendency to seek stimulation in the company of others.' },
    { name: 'Agreeableness', description: 'A tendency to be compassionate and cooperative rather than suspicious and antagonistic towards others.' },
    { name: 'Conscientiousness', description: 'A tendency to be organized and dependable, show self-discipline, act dutifully, aim for achievement, and prefer planned rather than spontaneous behavior.' },
    { name: 'Neuroticism', description: 'The tendency to experience unpleasant emotions easily, such as anger, anxiety, depression, and vulnerability.' },
    { name: 'Openness', description: 'Appreciation for art, emotion, adventure, unusual ideas, curiosity, and variety of experience.' },
  ];

  const getScoreColor = (score: number) => {
    const normalizedScore = (score + 50) / 100;
    if (normalizedScore < 0.4) return 'text-amber-600';
    if (normalizedScore < 0.6) return 'text-amber-500';
    return 'text-emerald-600';
  };

  const personalityTraits = {
    openness: traitScores[4],
    conscientiousness: traitScores[2],
    extraversion: traitScores[0],
    agreeableness: traitScores[1],
    neuroticism: traitScores[3]
  };

  function saveResultsToServer(scores: number[], traitScores: { [key: string]: number }) {
    axios.post('http://localhost:3000/save-results', {
      traitScores,
    })
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error('Error saving results:', error);
    });
  }

  useEffect(() => {
    saveResultsToServer(scores, personalityTraits);
  }, [scores, personalityTraits]);

  return (
    <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-amber-100">
      <h2 className="text-2xl font-bold text-amber-900 mb-6">Your Personality Profile</h2>
      
      <PersonalityChart scores={traitScores} />

      <div className="space-y-6 mb-8">
        {traits.map((trait, index) => (
          <div key={trait.name} className="border-b border-amber-200 pb-4 last:border-0">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-amber-900">{trait.name}</h3>
              <span className={`text-xl font-bold ${getScoreColor(traitScores[index])}`}>
                {traitScores[index]}
              </span>
            </div>
            <p className="text-sm text-amber-700">{trait.description}</p>
            <div className="mt-2 w-full bg-amber-100 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(traitScores[index] + 50)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <PersonalityInsights 
        scores={scores} 
        traitScores={personalityTraits} 
      />
    </div>
  );
}