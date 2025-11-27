import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { Brain, Zap, CheckCircle2 } from 'lucide-react';

interface SOSRequest {
  id: string;
  user_id: string;
  emergency_type: string;
  description: string | null;
  status: string;
  created_at: string | null;
}

interface TriageResult {
  category: 'immediate' | 'urgent' | 'priority' | 'routine';
  severity: number; // 1-10
  suggestedAction: string;
  reasoning: string;
}

interface AISmartTriageProps {
  request: SOSRequest;
  onTriageComplete?: (triage: TriageResult) => void;
}

/**
 * Innovative: AI Smart Triage System
 * Automatically categorizes and prioritizes emergencies using AI
 */
const AISmartTriage = ({ request, onTriageComplete }: AISmartTriageProps) => {
  const { callGemini } = useGeminiAI();
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const performTriage = async () => {
      if (request.status !== 'active' && request.status !== 'pending') return;
      
      setProcessing(true);
      try {
        const prompt = `Perform emergency triage analysis:

Emergency Type: ${request.emergency_type}
Description: ${request.description || 'No description provided'}
Time: ${request.created_at ? new Date(request.created_at).toLocaleString() : 'Unknown'}

Categorize into:
- "immediate" (critical, life-threatening, requires immediate response < 5 min)
- "urgent" (serious, requires fast response < 15 min)
- "priority" (important, requires prompt response < 30 min)
- "routine" (can wait, non-life-threatening)

Also assess severity (1-10 scale) and suggest specific action.

Return JSON:
{
  "category": "immediate" | "urgent" | "priority" | "routine",
  "severity": 1-10,
  "suggestedAction": "specific action to take",
  "reasoning": "brief explanation"
}`;

        const response = await callGemini(
          prompt,
          'You are an emergency triage specialist AI that categorizes emergencies based on severity and urgency.'
        );

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          setTriage(result);
          if (onTriageComplete) {
            onTriageComplete(result);
          }
        }
      } catch (error) {
        console.error('Triage error:', error);
      } finally {
        setProcessing(false);
      }
    };

    performTriage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id, request.description]);

  if (processing) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full"></div>
        <span>AI Triage analyzing...</span>
      </div>
    );
  }

  if (!triage) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'immediate': return 'bg-red-600 text-white animate-pulse';
      case 'urgent': return 'bg-orange-600 text-white';
      case 'priority': return 'bg-yellow-600 text-white';
      case 'routine': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-red-600';
    if (severity >= 5) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-700">AI Smart Triage</span>
          </div>
          <Badge className={getCategoryColor(triage.category)}>
            {triage.category.toUpperCase()}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Severity:</span>
            <span className={`text-sm font-bold ${getSeverityColor(triage.severity)}`}>
              {triage.severity}/10
            </span>
          </div>
          
          <div className="bg-white rounded p-2 border border-purple-200">
            <p className="text-xs font-medium text-gray-900 mb-1">Suggested Action:</p>
            <p className="text-xs text-gray-700">{triage.suggestedAction}</p>
          </div>
          
          <p className="text-xs text-gray-600 italic">{triage.reasoning}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISmartTriage;

