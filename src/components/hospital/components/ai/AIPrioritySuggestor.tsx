import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SOSRequest {
  id: string;
  user_id: string;
  emergency_type: string;
  description: string | null;
  status: string;
  created_at: string | null;
}

interface AIPrioritySuggestorProps {
  sosRequests: SOSRequest[];
}

const AIPrioritySuggestor = ({ sosRequests }: AIPrioritySuggestorProps) => {
  const { prioritizeEmergency } = useGeminiAI();
  const { toast } = useToast();
  const [priorities, setPriorities] = useState<Record<string, { priority: string; reasoning: string }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const analyzeRequest = async (request: SOSRequest) => {
    if (loading[request.id] || priorities[request.id]) return;

    setLoading((prev) => ({ ...prev, [request.id]: true }));
    
    try {
      const analysis = await prioritizeEmergency(
        request.description || request.emergency_type,
        undefined
      );
      
      setPriorities((prev) => ({
        ...prev,
        [request.id]: analysis,
      }));
    } catch (error) {
      toast({
        title: 'AI Analysis Failed',
        description: 'Could not analyze priority for this request.',
        variant: 'destructive',
      });
    } finally {
      setLoading((prev) => ({ ...prev, [request.id]: false }));
    }
  };

  // Auto-analyze active requests
  useEffect(() => {
    const activeRequests = sosRequests
      .filter(r => r.status === 'active' || r.status === 'pending')
      .slice(0, 3); // Limit to first 3 for performance
    
    activeRequests.forEach(request => {
      if (!priorities[request.id] && !loading[request.id]) {
        analyzeRequest(request);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sosRequests.length]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const priorityCounts = Object.values(priorities).reduce((acc, p) => {
    acc[p.priority] = (acc[p.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(priorities).length === 0 && Object.keys(loading).length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">AI Priority Suggestions</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white text-purple-700 border-purple-300">
            {Object.keys(priorities).length} Analyzed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(priorities).map(([requestId, analysis]) => {
          const request = sosRequests.find(r => r.id === requestId);
          if (!request) return null;

          return (
            <div key={requestId} className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Badge className={getPriorityColor(analysis.priority)}>
                  {analysis.priority.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-500">
                  {request.emergency_type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{analysis.reasoning}</p>
            </div>
          );
        })}
        
        {Object.values(loading).some(Boolean) && (
          <div className="text-center text-sm text-purple-600">
            <Clock className="h-4 w-4 inline mr-1 animate-spin" />
            Analyzing requests...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPrioritySuggestor;

