import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AIVoiceEmergency, AIHealthRiskAnalyzer } from "./ai";

interface AIFeaturesTabProps {
  onEmergencyDetected: (type: "medical" | "safety" | "general", description: string) => void;
  onSOSClick: (type: "medical" | "safety" | "general") => void;
  onAISymptomCheckerClick: () => void;
}

export const AIFeaturesTab = ({
  onEmergencyDetected,
  onSOSClick,
  onAISymptomCheckerClick,
}: AIFeaturesTabProps) => {
  return (
    <TabsContent value="ai-features" className="space-y-6 mt-6">
      <div className="space-y-6">
        {/* AI Voice Emergency - Enhanced */}
        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-xl border-2 border-purple-200 shadow-lg p-1">
          <AIVoiceEmergency 
            onEmergencyDetected={onEmergencyDetected}
          />
        </div>

        {/* Enhanced AI Symptom Checker Card */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-t-lg border-b border-purple-200">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              AI Symptom Checker
            </CardTitle>
            <p className="text-sm text-gray-700 mt-2 font-medium">
              Describe your symptoms for AI-powered analysis and diagnosis suggestions
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <Button
              onClick={onAISymptomCheckerClick}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold py-6"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Open AI Symptom Checker
            </Button>
          </CardContent>
        </Card>

        {/* AI Health Risk Analyzer - Enhanced */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <AIHealthRiskAnalyzer />
        </div>
      </div>
    </TabsContent>
  );
};

