import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { AIPredictiveHotspots } from "./ai";
import { EmergencyMap } from "./EmergencyMap";

interface EmergencyAlert {
  latitude?: number;
  longitude?: number;
  location_lat?: number;
  location_lng?: number;
  emergency_type?: string;
  type: 'medical' | 'safety' | 'general';
  created_at: string;
}

interface MapTabProps {
  sosRequests: EmergencyAlert[];
  historyRequests: EmergencyAlert[];
  currentLocation: { lat: number; lng: number } | null;
}

export const MapTab = ({
  sosRequests,
  historyRequests,
  currentLocation,
}: MapTabProps) => {
  return (
    <TabsContent value="map" className="space-y-6 mt-6">
      {/* AI Predictive Hotspots - Enhanced */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <AIPredictiveHotspots
          emergencyHistory={[...sosRequests, ...historyRequests].map(r => ({
            location_lat: Number(r.latitude ?? r.location_lat) || 0,
            location_lng: Number(r.longitude ?? r.location_lng) || 0,
            type: r.emergency_type || r.type,
            created_at: r.created_at || new Date().toISOString(),
          }))}
          currentLocation={currentLocation}
        />
      </div>

      {/* Enhanced Map Card */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg border-b border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                Area Coverage Map
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                Visual overview of emergency requests in your area
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-[500px] sm:h-[600px] w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
            <EmergencyMap userLocation={currentLocation ? [currentLocation.lat, currentLocation.lng] : null} />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

