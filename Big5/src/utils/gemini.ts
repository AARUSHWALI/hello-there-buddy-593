import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API with the provided key
const genAI = new GoogleGenerativeAI('AIzaSyAsTBHeEMDmqZ67Sxu1HvO6czmKDINZDmM');

interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface PersonalityAnalysis {
  traits: PersonalityTraits;
  analysis: string;
  recommendations: string[];
}

export async function analyzePersonality(
  answers: Array<{ question: string; score: number }>,
  calculatedTraits: PersonalityTraits
): Promise<PersonalityAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      You are a professional psychologist analyzing Big Five personality test results.
      Analyze the following scores and provide insights in a clear, professional manner.
      
      Raw Scores:
      - Openness: ${calculatedTraits.openness}
      - Conscientiousness: ${calculatedTraits.conscientiousness}
      - Extraversion: ${calculatedTraits.extraversion}
      - Agreeableness: ${calculatedTraits.agreeableness}
      - Neuroticism: ${calculatedTraits.neuroticism}

      Detailed Responses:
      ${answers.map(a => `Q: ${a.question}, Score: ${a.score}`).join('\n')}

      Provide a response in the following JSON format (do not include any markdown formatting or backticks):
      {
        "analysis": "A detailed analysis of their personality profile, focusing on key traits and their interactions",
        "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up any potential markdown formatting
    const cleanedText = text.replace(/\`\`\`json|\`\`\`|\n/g, '').trim();
    
    try {
      const parsedResponse = JSON.parse(cleanedText);
      return {
        traits: calculatedTraits,
        analysis: parsedResponse.analysis,
        recommendations: parsedResponse.recommendations
      };
    } catch (e) {
      console.error('Failed to parse Gemini response:', e);
      // Attempt to extract content using regex as fallback
      const analysisMatch = text.match(/"analysis":\s*"([^"]+)"/);
      const recommendationsMatch = text.match(/"recommendations":\s*\[(.*?)\]/);
      
      if (analysisMatch && recommendationsMatch) {
        const recommendations = recommendationsMatch[1]
          .split(',')
          .map(r => r.trim().replace(/^"|"$/g, ''));
        
        return {
          traits: calculatedTraits,
          analysis: analysisMatch[1],
          recommendations: recommendations
        };
      }
      
      return {
        traits: calculatedTraits,
        analysis: "We're experiencing technical difficulties with the detailed analysis. Please try again.",
        recommendations: ["Try the assessment again for a complete analysis"]
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      traits: calculatedTraits,
      analysis: "Unable to generate detailed analysis at this time.",
      recommendations: ["Please try again in a few moments"]
    };
  }
}
