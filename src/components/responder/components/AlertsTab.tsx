import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Ambulance } from "lucide-react";
import { ResponderStatsCards } from "./ResponderStatsCards";
import { AIRouteOptimizer } from "./ai";
import { EmergencyRequestCard } from "./EmergencyRequestCard";

interface EmergencyAlert {
  id: string;
  user_name?: string;
  user_phone?: string;
  user_address?: string;
  location_description?: string;
  latitude?: number;
  longitude?: number;
  location_lat?: number;
  location_lng?: number;
  emergency_type?: string;
  type: 'medical' | 'safety' | 'general';
  status: 'active' | 'acknowledged' | 'responding' | 'completed';
  description?: string;
  created_at: string;
}

interface AlertsTabProps {
  sosRequests: EmergencyAlert[];
  historyRequests: EmergencyAlert[];
  visibleRequests: EmergencyAlert[];
  isVerified: boolean;
  onDuty: boolean;
  currentLocation: { lat: number; lng: number } | null;
  getDistanceToRequest: (request: EmergencyAlert) => string | null;
  getAlertIcon: (type: string) => React.ReactNode;
  getAlertTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
  formatTime: (timestamp: string | null) => string;
  contactUser: (phone: string) => void;
  handleStatusUpdate: (id: string, status: 'active' | 'acknowledged' | 'responding' | 'completed') => void;
}

export const AlertsTab = ({
  sosRequests,
  historyRequests,
  visibleRequests,
  isVerified,
  onDuty,
  currentLocation,
  getDistanceToRequest,
  getAlertIcon,
  getAlertTypeColor,
  getStatusColor,
  formatTime,
  contactUser,
  handleStatusUpdate,
}: AlertsTabProps) => {
  return (
    <TabsContent value="alerts" className="space-y-6 mt-6">
      <ResponderStatsCards sosRequests={sosRequests} historyRequests={historyRequests} />

      {/* AI Route Optimizer */}
      {visibleRequests.length > 1 && currentLocation && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 shadow-sm">
          <AIRouteOptimizer
            alerts={visibleRequests.map(r => ({
              id: r.id,
              location_lat: Number(r.latitude ?? r.location_lat) || 0,
              location_lng: Number(r.longitude ?? r.location_lng) || 0,
              type: r.emergency_type || r.type,
              status: r.status,
              description: r.description || undefined,
            }))}
            responderLocation={currentLocation}
            onNavigate={(requestId) => {
              const request = visibleRequests.find(r => r.id === requestId);
              const lat = request?.latitude ?? request?.location_lat;
              const lng = request?.longitude ?? request?.location_lng;
              if (request && lat && lng) {
                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
              }
            }}
          />
        </div>
      )}

      {/* Enhanced Emergency Requests Card */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg border-b border-red-100">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md">
                <Ambulance className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                  Emergency Requests
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1 font-medium">
                  SOS requests assigned to you
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="bg-red-100 text-red-700 border-red-300 font-semibold px-3 py-1"
              >
                {visibleRequests.length} Active
              </Badge>
              {onDuty && (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-700 border-green-300 font-semibold px-3 py-1"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 py-6">
          {!isVerified && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5 mb-6">
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-800 text-base mb-1">
                    Verification Required
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Complete your account verification to start receiving emergency requests.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isVerified && !onDuty && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-800 text-base mb-1">
                    Currently Off Duty
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Switch to "On Duty" to start receiving emergency requests in your area.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {visibleRequests.map((request) => {
              const distance = getDistanceToRequest(request);
              return (
                <EmergencyRequestCard
                  key={request.id}
                  request={request}
                  distance={distance}
                  currentLocation={currentLocation}
                  getAlertIcon={getAlertIcon}
                  getAlertTypeColor={getAlertTypeColor}
                  getStatusColor={getStatusColor}
                  formatTime={formatTime}
                  contactUser={contactUser}
                  handleStatusUpdate={handleStatusUpdate}
                />
              );
            })}

            {visibleRequests.length === 0 && isVerified && onDuty && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Shield className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear</h3>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  No active emergency requests assigned to you. You'll be notified immediately when new emergencies are reported.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

