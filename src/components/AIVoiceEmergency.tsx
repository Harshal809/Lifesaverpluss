import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AIVoiceEmergencyProps {
  onEmergencyDetected: (type: 'medical' | 'safety' | 'general', description: string) => void;
}

/**
 * Innovative: AI-powered Voice-to-Emergency Converter
 * Converts natural speech to structured emergency data
 */
const AIVoiceEmergency = ({ onEmergencyDetected }: AIVoiceEmergencyProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [emergencyType, setEmergencyType] = useState<'medical' | 'safety' | 'general' | null>(null);
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { callGemini } = useGeminiAI();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = async (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(interimTranscript + finalTranscript);

      // If we have enough content, process with AI
      if (finalTranscript.trim().length > 10 && !processing) {
        await processWithAI(finalTranscript.trim());
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: 'Voice Recognition Error',
        description: 'Could not process voice input. Please try again.',
        variant: 'destructive',
      });
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [processing]);

  const processWithAI = async (text: string) => {
    setProcessing(true);
    try {
      const prompt = `Analyze this emergency description and extract:
1. Emergency type: "medical", "safety", or "general"
2. Structured description

Text: "${text}"

Respond ONLY in JSON format:
{
  "type": "medical" | "safety" | "general",
  "description": "clear, concise emergency description",
  "urgency": "low" | "medium" | "high" | "critical"
}`;

      const response = await callGemini(prompt, 'You are an emergency response AI that extracts structured data from natural language.');

      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setEmergencyType(data.type);
        
        if (data.urgency === 'critical' || data.urgency === 'high') {
          // Auto-trigger for critical emergencies
          onEmergencyDetected(data.type, data.description);
          toast({
            title: '🚨 Critical Emergency Detected!',
            description: `Emergency type: ${data.type}. SOS triggered automatically.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Emergency Analyzed',
            description: `Type: ${data.type.toUpperCase()}, Urgency: ${data.urgency.toUpperCase()}`,
          });
        }
      }
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: 'Processing Failed',
        description: 'Could not analyze voice input.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Not Supported',
        description: 'Voice recognition is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    setIsListening(true);
    setTranscript('');
    setEmergencyType(null);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleManualTrigger = () => {
    if (emergencyType && transcript.trim()) {
      onEmergencyDetected(emergencyType, transcript);
      toast({
        title: 'Emergency Triggered',
        description: 'SOS request sent based on voice input.',
      });
    }
  };

  const isSupported = typeof (window as any).SpeechRecognition !== 'undefined' || 
                     typeof (window as any).webkitSpeechRecognition !== 'undefined';

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Mic className="h-5 w-5 text-purple-600" />
                AI Voice Emergency
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Speak naturally - AI converts your voice to emergency SOS
              </p>
            </div>
            {emergencyType && (
              <Badge className={`${
                emergencyType === 'medical' ? 'bg-red-100 text-red-800' :
                emergencyType === 'safety' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {emergencyType.toUpperCase()}
              </Badge>
            )}
          </div>

          {!isSupported ? (
            <div className="text-center py-4 text-sm text-gray-500">
              Voice recognition not supported in your browser
            </div>
          ) : (
            <>
              {/* Transcript Display */}
              <div className="bg-white rounded-lg p-4 min-h-[80px] border-2 border-dashed border-purple-200">
                {transcript ? (
                  <p className="text-sm text-gray-700">{transcript}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    {isListening ? 'Listening... Speak your emergency...' : 'Click microphone to start speaking'}
                  </p>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                {!isListening ? (
                  <Button
                    onClick={startListening}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Voice Input
                  </Button>
                ) : (
                  <Button
                    onClick={stopListening}
                    variant="destructive"
                    className="flex-1"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </Button>
                )}

                {processing && (
                  <div className="flex items-center text-purple-600">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-sm">AI Analyzing...</span>
                  </div>
                )}
              </div>

              {/* Manual Trigger */}
              {emergencyType && transcript && !isListening && (
                <Button
                  onClick={handleManualTrigger}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Trigger SOS ({emergencyType.toUpperCase()})
                </Button>
              )}

              {/* Status Indicator */}
              {isListening && (
                <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Listening... Speak clearly</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIVoiceEmergency;

