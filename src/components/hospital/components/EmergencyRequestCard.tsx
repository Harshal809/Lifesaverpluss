import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Clock, Phone, Navigation, History } from "lucide-react";
import { AISmartTriage } from "./ai";
import { MedicalReportView } from "@/components/user/components/medical";

interface SOSRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_address: string | null;
  latitude: number;
  longitude: number;
  emergency_type: string;
  description: string | null;
  status: string;
  created_at: string | null;
  notes: string | null;
  estimated_arrival: string | null;
}

interface EmergencyRequestCardProps {
  request: SOSRequest;
  onStatusUpdate: (id: string, status: string) => void;
  formatTime: (timestamp: string | null) => string;
  getStatusColor: (status: string) => string;
}

export const EmergencyRequestCard = ({
  request,
  onStatusUpdate,
  formatTime,
  getStatusColor,
}: EmergencyRequestCardProps) => {
  return (
    <Card 
      className={`border-l-4 hover:shadow-xl transition-all duration-300 bg-white rounded-lg overflow-hidden ${
        request.status === 'active' ? 'border-l-red-500 shadow-red-50' :
        request.status === 'pending' ? 'border-l-yellow-500 shadow-yellow-50' :
        request.status === 'acknowledged' ? 'border-l-blue-500 shadow-blue-50' :
        'border-l-gray-500'
      }`}
    >
      <CardContent className="p-5 sm:p-6 bg-gradient-to-br from-white to-gray-50/50">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
            {/* Request Information */}
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-red-100 to-red-200 rounded-lg shadow-sm">
                <User className="h-5 w-5 text-red-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Badge Row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={`${getStatusColor(request.status)} text-xs font-medium px-2 py-0.5`}>
                    {request.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs px-2 py-0.5">
                    {request.emergency_type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-gray-600 border-gray-200 text-xs px-2 py-0.5">
                    ID: {request.user_id.slice(0, 8)}...
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(request.created_at)}</span>
                  </div>
                </div>

                {/* Location and Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {request.user_address || 'Emergency Location'}
                  </h3>
                  
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {request.latitude?.toFixed(6)}, {request.longitude?.toFixed(6)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition ml-2"
                      title="Open in Maps"
                    >
                      <Navigation className="h-3 w-3" />
                    </a>
                  </div>
                  
                  {request.notes && (
                    <p className="text-sm text-gray-700 break-words">
                      <span className="font-medium">Notes: </span>
                      {request.notes}
                    </p>
                  )}
                  
                  {request.estimated_arrival && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">ETA: </span>
                      {request.estimated_arrival}
                    </p>
                  )}
                  
                  {/* Patient Contact Info */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {request.user_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <User className="h-3 w-3" />
                        <span>{request.user_name}</span>
                      </div>
                    )}
                    {request.user_phone && (
                      <a 
                        href={`tel:${request.user_phone}`}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Phone className="h-3 w-3" />
                        {request.user_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Enhanced */}
            <div className="flex flex-col space-y-2 lg:w-44 lg:flex-shrink-0">
              {request.status === 'active' || request.status === 'pending' ? (
                <Button
                  size="sm"
                  onClick={() => onStatusUpdate(request.id, 'acknowledged')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              ) : null}
              {request.status === 'acknowledged' && (
                <Button
                  size="sm"
                  onClick={() => onStatusUpdate(request.id, 'resolved')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white w-full shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  <History className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              )}
              {(request.status === 'active' || request.status === 'pending' || request.status === 'acknowledged') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusUpdate(request.id, 'dismissed')}
                  className="w-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </div>

          {/* AI Smart Triage */}
          <div className="w-full pt-2 border-t">
            <AISmartTriage request={request} />
          </div>

          {/* Medical Report Toggle */}
          <div className="w-full pt-2 border-t">
            <MedicalReportView 
              userId={request.user_id} 
              userName={request.user_name || 'Patient'}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

