import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { useToast } from '@/hooks/use-toast';
import { Navigation, Zap, Clock, TrendingUp } from 'lucide-react';

interface EmergencyAlert {
  id: string;
  location_lat: number;
  location_lng: number;
  type: string;
  status: string;
  description?: string;
}

interface AIRouteOptimizerProps {
  alerts: EmergencyAlert[];
  responderLocation: { lat: number; lng: number } | null;
  onNavigate: (alertId: string) => void;
}

/**
 * Innovative: AI-powered route optimization for responders
 * Analyzes multiple emergencies and suggests optimal response order
 */
const AIRouteOptimizer = ({ alerts, responderLocation, onNavigate }: AIRouteOptimizerProps) => {
  const { callGemini } = useGeminiAI();
  const { toast } = useToast();
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [distanceSaved, setDistanceSaved] = useState<number | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const optimizeRoute = async () => {
    if (!responderLocation || alerts.length === 0) {
      toast({
        title: 'Cannot Optimize',
        description: 'Location or alerts data missing.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate distances for all alerts
      const alertsWithDistance = alerts.map(alert => ({
        id: alert.id,
        distance: calculateDistance(
          responderLocation.lat,
          responderLocation.lng,
          alert.location_lat,
          alert.location_lng
        ),
        type: alert.type,
        status: alert.status,
        description: alert.description,
        coordinates: { lat: alert.location_lat, lng: alert.location_lng }
      }));

      // Create AI prompt for optimization
      const prompt = `You are an emergency response route optimizer. Given these emergencies:
${alertsWithDistance.map((a, i) => 
  `${i + 1}. ID: ${a.id}, Type: ${a.type}, Distance: ${a.distance.toFixed(2)}km, Status: ${a.status}, ${a.description ? `Description: ${a.description}` : ''}`
).join('\n')}

Responder Location: ${responderLocation.lat}, ${responderLocation.lng}

Optimize the route considering:
1. Emergency type priority (medical > safety > general)
2. Distance efficiency
3. Status urgency (active > acknowledged > responding)

Return ONLY a JSON array of alert IDs in optimal order:
["alert_id_1", "alert_id_2", ...]`;

      const response = await callGemini(prompt, 'You are an expert emergency response route optimizer.');

      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const optimized = JSON.parse(jsonMatch[0]);
        setOptimizedRoute(optimized);

        // Calculate savings
        const originalTotal = alertsWithDistance.reduce((sum, a) => sum + a.distance, 0);
        let optimizedTotal = 0;
        let currentLat = responderLocation.lat;
        let currentLng = responderLocation.lng;

        optimized.forEach((id: string) => {
          const alert = alertsWithDistance.find(a => a.id === id);
          if (alert) {
            optimizedTotal += calculateDistance(
              currentLat,
              currentLng,
              alert.coordinates.lat,
              alert.coordinates.lng
            );
            currentLat = alert.coordinates.lat;
            currentLng = alert.coordinates.lng;
          }
        });

        const saved = originalTotal - optimizedTotal;
        setDistanceSaved(saved);
        setTimeSaved(Math.round(saved * 2)); // ~2 minutes per km saved

        toast({
          title: 'Route Optimized!',
          description: `Estimated ${Math.round(saved * 2)} minutes saved with optimized route.`,
        });
      }
    } catch (error) {
      console.error('Route optimization error:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Could not optimize route. Using default order.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alerts.length > 1 && responderLocation) {
      optimizeRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length, responderLocation?.lat]);

  if (alerts.length <= 1) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Route Optimizer</CardTitle>
          </div>
          {optimizedRoute.length > 0 && (
            <Badge className="bg-green-600 text-white">
              Optimized
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analyzing optimal route...</p>
          </div>
        ) : optimizedRoute.length > 0 ? (
          <>
            {/* Savings Display */}
            {(timeSaved !== null || distanceSaved !== null) && (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="grid grid-cols-2 gap-3">
                  {timeSaved !== null && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Time Saved</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {timeSaved} min
                      </div>
                    </div>
                  )}
                  {distanceSaved !== null && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Distance Saved</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {distanceSaved.toFixed(1)} km
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Optimized Route List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Optimal Response Order:</p>
              {optimizedRoute.map((alertId, index) => {
                const alert = alerts.find(a => a.id === alertId);
                if (!alert) return null;

                return (
                  <div
                    key={alertId}
                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${
                            alert.type === 'medical' ? 'bg-red-100 text-red-800' :
                            alert.type === 'safety' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {calculateDistance(
                              responderLocation!.lat,
                              responderLocation!.lng,
                              alert.location_lat,
                              alert.location_lng
                            ).toFixed(1)} km
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onNavigate(alertId)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <Button
            onClick={optimizeRoute}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            <Zap className="h-4 w-4 mr-2" />
            Optimize Route
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRouteOptimizer;

