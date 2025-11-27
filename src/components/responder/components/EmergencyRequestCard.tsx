import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, History } from "lucide-react";
import { NavigationButton } from "@/components/NavigationButton";

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

interface EmergencyRequestCardProps {
  request: EmergencyAlert;
  distance: string | null;
  currentLocation: { lat: number; lng: number } | null;
  getAlertIcon: (type: string) => React.ReactNode;
  getAlertTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
  formatTime: (timestamp: string | null) => string;
  contactUser: (phone: string) => void;
  handleStatusUpdate: (id: string, status: 'active' | 'acknowledged' | 'responding' | 'completed') => void;
}

export const EmergencyRequestCard = ({
  request,
  distance,
  currentLocation,
  getAlertIcon,
  getAlertTypeColor,
  getStatusColor,
  formatTime,
  contactUser,
  handleStatusUpdate,
}: EmergencyRequestCardProps) => {
  return (
    <Card
      className={`border-l-4 hover:shadow-xl transition-all duration-300 bg-white rounded-lg overflow-hidden ${
        request.status === 'active' ? 'border-l-red-500 shadow-red-50' :
        request.status === 'acknowledged' ? 'border-l-blue-500 shadow-blue-50' :
        'border-l-gray-500'
      }`}
    >
      <CardContent className="p-5 sm:p-6 bg-gradient-to-br from-white to-gray-50/50">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-red-100 to-red-200 rounded-lg shadow-sm">
              {getAlertIcon(request.emergency_type || request.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  className={`${getAlertTypeColor(request.emergency_type || request.type)} text-xs font-medium px-2 py-0.5`}
                >
                  {(request.emergency_type || request.type).toUpperCase()}
                </Badge>
                <Badge
                  className={`${getStatusColor(request.status)} text-xs font-medium px-2 py-0.5`}
                >
                  {request.status.toUpperCase()}
                </Badge>
                {distance && (
                  <Badge
                    variant="outline"
                    className="text-blue-600 border-blue-200 text-xs px-2 py-0.5"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {distance}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(request.created_at)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {request.user_name}
                </h3>
                
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Location: </span>
                  {request.user_address || request.location_description || `${(request.latitude ?? request.location_lat)?.toFixed(4)}, ${(request.longitude ?? request.location_lng)?.toFixed(4)}`}
                </p>

                {request.description && (
                  <p className="text-sm text-gray-700 break-words">
                    <span className="font-semibold">Description: </span>
                    {request.description}
                  </p>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a 
                    href={`tel:${request.user_phone}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {request.user_phone}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="flex flex-col space-y-2 lg:w-44 lg:flex-shrink-0">
            {request.user_phone && (
              <Button
                size="sm"
                onClick={() => contactUser(request.user_phone || '')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact
              </Button>
            )}

            {(request.status === 'active') && (
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(request.id, 'acknowledged')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
              >
                <Clock className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
            )}

            {(request.status === 'acknowledged' || request.status === 'responding') && (
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(request.id, 'completed')}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white w-full shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
              >
                <History className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}

            <NavigationButton
              userLat={currentLocation?.lat}
              userLng={currentLocation?.lng}
              destLat={Number(request.latitude ?? request.location_lat)}
              destLng={Number(request.longitude ?? request.location_lng)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

