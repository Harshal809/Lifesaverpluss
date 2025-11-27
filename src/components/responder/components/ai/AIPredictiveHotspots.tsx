import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

interface EmergencyHistory {
  location_lat: number;
  location_lng: number;
  type: string;
  created_at: string;
}

interface Hotspot {
  lat: number;
  lng: number;
  risk: 'low' | 'medium' | 'high';
  type: string;
  confidence: number;
  reasoning: string;
}

interface AIPredictiveHotspotsProps {
  emergencyHistory: EmergencyHistory[];
  currentLocation?: { lat: number; lng: number } | null;
}

/**
 * Innovative: AI-powered predictive emergency hotspots
 * Analyzes historical data to predict high-risk areas
 */
const AIPredictiveHotspots = ({ emergencyHistory, currentLocation }: AIPredictiveHotspotsProps) => {
  const { callGemini } = useGeminiAI();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (emergencyHistory.length < 5) return; // Need minimum data

    const analyzeHotspots = async () => {
      setLoading(true);
      try {
        // Group emergencies by location clusters
        const locationGroups = emergencyHistory.reduce((acc, emergency) => {
          const key = `${emergency.location_lat.toFixed(3)},${emergency.location_lng.toFixed(3)}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(emergency);
          return acc;
        }, {} as Record<string, EmergencyHistory[]>);

        // Get top 5 most frequent locations
        const topLocations = Object.entries(locationGroups)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 5);

        // Analyze with AI
        const prompt = `Analyze these emergency patterns and predict risk hotspots:

${topLocations.map(([coords, emergencies], idx) => {
  const [lat, lng] = coords.split(',');
  const types = emergencies.map(e => e.type);
  const recent = emergencies.filter(e => {
    const date = new Date(e.created_at);
    const now = new Date();
    return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= 7; // Last 7 days
  });

  return `${idx + 1}. Location: ${lat}, ${lng}
   - Total Emergencies: ${emergencies.length}
   - Recent (7 days): ${recent.length}
   - Types: ${types.join(', ')}
   - Times: ${emergencies.map(e => new Date(e.created_at).toLocaleTimeString()).join(', ')}`;
}).join('\n\n')}

${currentLocation ? `Current Focus Area: ${currentLocation.lat}, ${currentLocation.lng}` : ''}

Predict risk hotspots considering:
1. Frequency of emergencies
2. Recent activity trends
3. Emergency types (medical = higher risk)
4. Time patterns

Return JSON array:
[{
  "lat": number,
  "lng": number,
  "risk": "low" | "medium" | "high",
  "type": "most_common_type",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}, ...]`;

        const response = await callGemini(prompt, 'You are an emergency prediction AI that analyzes patterns to identify risk hotspots.');

        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const predicted = JSON.parse(jsonMatch[0]);
          setHotspots(predicted);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Hotspot prediction error:', error);
      } finally {
        setLoading(false);
      }
    };

    analyzeHotspots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergencyHistory.length]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-orange-600 text-white';
      case 'low': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  if (hotspots.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">AI Predictive Hotspots</CardTitle>
          </div>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analyzing patterns...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">
              AI-identified high-risk areas based on historical patterns
            </p>
            {hotspots.map((hotspot, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 border border-orange-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">
                      {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskColor(hotspot.risk)}>
                      {hotspot.risk.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {hotspot.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {hotspot.type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">{hotspot.reasoning}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPredictiveHotspots;

