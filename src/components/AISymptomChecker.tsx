import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Send, Loader2, Stethoscope, AlertTriangle, Lightbulb } from 'lucide-react';

interface AISymptomCheckerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SymptomAnalysis {
  possibleConditions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  suggestedActions: string[];
  disclaimer: string;
}

const AISymptomChecker = ({ isOpen, onClose }: AISymptomCheckerProps) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please describe your symptoms.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      }

      // Call Gemini API
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
                text: `You are a medical AI assistant. Analyze these symptoms and provide a structured response in JSON format only:

Patient Symptoms: "${symptoms}"

Provide your analysis in this exact JSON format (no markdown, just JSON):
{
  "possibleConditions": ["condition1", "condition2"],
  "urgency": "low" | "medium" | "high" | "critical",
  "recommendations": ["recommendation1", "recommendation2"],
  "suggestedActions": ["action1", "action2"],
  "disclaimer": "This is not a substitute for professional medical advice. Consult a healthcare provider."
}

Be concise but helpful. Consider urgency based on symptom severity.`
              }]
            }]
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to analyze symptoms');
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || '';

      // Parse JSON from response (remove markdown code blocks if present)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
        toast({
          title: 'Analysis Complete',
          description: 'AI has analyzed your symptoms.',
        });
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (err: any) {
      console.error('Error analyzing symptoms:', err);
      setError(err.message || 'Failed to analyze symptoms. Please try again.');
      toast({
        title: 'Analysis Failed',
        description: err.message || 'Could not analyze symptoms. Please check your API key.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const handleSOSFromAnalysis = () => {
    if (analysis?.urgency === 'critical' || analysis?.urgency === 'high') {
      // Trigger SOS directly
      toast({
        title: 'Emergency Detected',
        description: 'Your symptoms suggest urgent medical attention. Consider using the SOS button.',
        variant: 'destructive',
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Symptom Checker
          </DialogTitle>
          <DialogDescription>
            Describe your symptoms for AI-powered analysis and preliminary diagnosis suggestions.
            This is not a substitute for professional medical care.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Describe your symptoms
                  </label>
                  <Textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Example: I've been experiencing chest pain for the past 30 minutes, along with shortness of breath and dizziness. The pain radiates to my left arm..."
                    rows={6}
                    className="w-full"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Be as detailed as possible: duration, severity, location, triggers, etc.
                  </p>
                </div>
                <Button
                  onClick={analyzeSymptoms}
                  disabled={loading || !symptoms.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze Symptoms with AI
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              {/* Urgency Badge */}
              <Card className={`${getUrgencyColor(analysis.urgency)} border-0`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">Urgency Level</p>
                      <p className="text-2xl font-bold mt-1">{analysis.urgency.toUpperCase()}</p>
                    </div>
                    {(analysis.urgency === 'critical' || analysis.urgency === 'high') && (
                      <Button
                        variant="outline"
                        onClick={handleSOSFromAnalysis}
                        className="bg-white text-red-600 hover:bg-red-50 border-white"
                      >
                        Trigger SOS
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Possible Conditions */}
              {analysis.possibleConditions && analysis.possibleConditions.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Possible Conditions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.possibleConditions.map((condition, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Actions */}
              {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-blue-900 mb-3">Suggested Actions</h3>
                    <ul className="space-y-2">
                      {analysis.suggestedActions.map((action, idx) => (
                        <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-600 font-bold mt-1">{idx + 1}.</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              {analysis.disclaimer && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <p className="text-xs text-yellow-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{analysis.disclaimer}</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISymptomChecker;

