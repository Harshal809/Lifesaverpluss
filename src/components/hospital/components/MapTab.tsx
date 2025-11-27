import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import HospitalMap from "./HospitalMap";

interface SOSRequest {
  id: string;
  status: string;
  latitude: number;
  longitude: number;
  user_id: string;
  user_name: string;
  user_phone: string;
  emergency_type: string;
  description: string | null;
  created_at: string | null;
}

interface MapTabProps {
  sosRequests: SOSRequest[];
  hospitalLocation?: { lat: number; lng: number } | null;
}

export const MapTab = ({ sosRequests, hospitalLocation }: MapTabProps) => {
  const activeRequests = sosRequests.filter(r => 
    r.status !== 'resolved' && r.status !== 'dismissed'
  );

  return (
    <TabsContent value="map" className="space-y-6 mt-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg border-b border-blue-100">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Emergency Map</CardTitle>
                <p className="text-sm text-gray-600 mt-1 font-medium">Visual overview of all assigned SOS requests</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 font-semibold px-3 py-1">
              {activeRequests.length} Assigned
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 pt-6">
          <div className="h-[500px] sm:h-[600px] w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
            <HospitalMap 
              sosRequests={activeRequests} 
              hospitalLocation={hospitalLocation || undefined}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

