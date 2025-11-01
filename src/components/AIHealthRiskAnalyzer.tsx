import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useToast } from '@/hooks/use-toast';
import { Heart, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Innovative: AI Health Risk Analyzer
 * Analyzes medical reports to predict health risks and provide proactive insights
 */
const AIHealthRiskAnalyzer = () => {
  const { user } = useAuth();
  const { callGemini } = useGeminiAI();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
    predictedConditions: string[];
    nextSteps: string[];
  } | null>(null);

  const analyzeHealthRisk = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to analyze health risks.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch medical reports
      const { data: medicalReport, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !medicalReport) {
        toast({
          title: 'No Medical Data',
          description: 'Please add your medical information first.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Create comprehensive prompt
      const prompt = `Analyze this medical history and predict health risks:

Age: ${medicalReport.age || 'Not specified'}
Blood Group: ${medicalReport.blood_group || 'Not specified'}
Height: ${medicalReport.height_cm || 'Not specified'} cm
Weight: ${medicalReport.weight_kg || 'Not specified'} kg
Medical History: ${medicalReport.medical_history || 'None'}
Current Conditions: ${medicalReport.current_conditions || 'None'}
Medications: ${medicalReport.medications || 'None'}
Allergies: ${medicalReport.allergies || 'None'}

Provide comprehensive health risk analysis in JSON:
{
  "overallRisk": "low" | "medium" | "high",
  "riskFactors": ["factor1", "factor2"],
  "recommendations": ["rec1", "rec2"],
  "predictedConditions": ["condition1", "condition2"],
  "nextSteps": ["step1", "step2"]
}`;

      const response = await callGemini(
        prompt,
        'You are a medical AI assistant that analyzes health data to predict risks and provide preventive recommendations.'
      );

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAnalysis(parsed);
        toast({
          title: 'Analysis Complete',
          description: 'Health risk analysis generated.',
        });
      }
    } catch (error) {
      console.error('Health analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze health risks.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-orange-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            <CardTitle className="text-lg">AI Health Risk Analyzer</CardTitle>
          </div>
          {analysis && (
            <Badge className={getRiskColor(analysis.overallRisk)}>
              {analysis.overallRisk.toUpperCase()} RISK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <div className="text-center py-6">
            <Activity className="h-12 w-12 text-pink-600 mx-auto mb-4 opacity-50" />
            <p className="text-sm text-gray-600 mb-4">
              Analyze your medical data for health risks and recommendations
            </p>
            <Button
              onClick={analyzeHealthRisk}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Analyze Health Risks
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Risk Factors */}
            {analysis.riskFactors && analysis.riskFactors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Risk Factors
                </h4>
                <div className="space-y-1">
                  {analysis.riskFactors.map((factor, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-white rounded p-2 border border-orange-200">
                      • {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predicted Conditions */}
            {analysis.predictedConditions && analysis.predictedConditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Predicted Conditions to Monitor
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.predictedConditions.map((condition, idx) => (
                    <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-300">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700 bg-white rounded p-2 border border-green-200 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {analysis.nextSteps && analysis.nextSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Next Steps</h4>
                <div className="space-y-2">
                  {analysis.nextSteps.map((step, idx) => (
                    <div key={idx} className="text-sm text-gray-700 bg-blue-50 rounded p-2 border border-blue-200">
                      {idx + 1}. {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={analyzeHealthRisk}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Re-analyze
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIHealthRiskAnalyzer;

