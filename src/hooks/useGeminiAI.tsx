/**
 * Custom hook for Gemini AI integration across the app
 * Provides reusable AI functions for different features
 */

interface GeminiResponse {
  text: string;
  error?: string;
}

export const useGeminiAI = () => {
  const callGemini = async (prompt: string, systemPrompt?: string): Promise<GeminiResponse> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
    
    if (!apiKey) {
      return {
        text: '',
        error: 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.',
      };
    }

    try {
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nUser Query: ${prompt}`
        : prompt;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get AI response');
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || '';
      
      return { text };
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      return {
        text: '',
        error: error.message || 'Failed to get AI response',
      };
    }
  };

  // AI function for emergency prioritization
  const prioritizeEmergency = async (symptoms: string, location?: string): Promise<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    reasoning: string;
  }> => {
    const prompt = `Analyze this emergency situation and determine priority:

Symptoms: ${symptoms}
${location ? `Location: ${location}` : ''}

Respond in JSON format:
{
  "priority": "low" | "medium" | "high" | "critical",
  "reasoning": "brief explanation"
}`;

    const response = await callGemini(prompt, 'You are an emergency response AI. Analyze situations and prioritize based on severity.');
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Fallback
        return {
          priority: 'medium' as const,
          reasoning: response.text || 'Unable to analyze priority',
        };
      }
    }
    
    return {
      priority: 'medium' as const,
      reasoning: response.text || 'AI analysis unavailable',
    };
  };

  // AI function for responder matching
  const suggestBestResponder = async (
    emergencyType: string,
    symptoms: string,
    availableResponders: Array<{ type: string; distance: number }>
  ): Promise<string> => {
    const prompt = `Based on emergency type "${emergencyType}" and symptoms "${symptoms}", 
    suggest the best responder type from available: ${availableResponders.map(r => r.type).join(', ')}.
    Respond with just the responder type name.`;
    
    const response = await callGemini(prompt);
    return response.text.trim() || availableResponders[0]?.type || 'general';
  };

  // AI function for hospital capacity prediction
  const predictCapacity = async (
    currentRequests: number,
    timeOfDay: string,
    dayOfWeek: string
  ): Promise<{ capacity: number; recommendation: string }> => {
    const prompt = `Predict hospital capacity needs:

Current Active Requests: ${currentRequests}
Time: ${timeOfDay}
Day: ${dayOfWeek}

Respond in JSON:
{
  "capacity": estimated_number,
  "recommendation": "staffing or resource recommendation"
}`;

    const response = await callGemini(prompt);
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return {
          capacity: currentRequests + 5,
          recommendation: 'Monitor capacity closely',
        };
      }
    }
    
    return {
      capacity: currentRequests + 5,
      recommendation: response.text || 'Monitor capacity',
    };
  };

  // AI function for emergency description enhancement
  const enhanceDescription = async (basicDescription: string): Promise<string> => {
    const prompt = `Enhance this emergency description with relevant medical context and clarity:

"${basicDescription}"

Provide a clearer, more detailed description that would help medical responders understand the situation better.`;
    
    const response = await callGemini(prompt);
    return response.text || basicDescription;
  };

  return {
    callGemini,
    prioritizeEmergency,
    suggestBestResponder,
    predictCapacity,
    enhanceDescription,
  };
};

