import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, Phone } from "lucide-react";

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

interface HistoryTabProps {
  historyRequests: EmergencyAlert[];
  getAlertIcon: (type: string) => React.ReactNode;
  getAlertTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
  formatTime: (timestamp: string | null) => string;
}

export const HistoryTab = ({
  historyRequests,
  getAlertIcon,
  getAlertTypeColor,
  getStatusColor,
  formatTime,
}: HistoryTabProps) => {
  return (
    <TabsContent value="history" className="space-y-6 mt-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                Response History
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                Previously handled emergency requests
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 font-semibold px-3 py-1">
              {historyRequests.length} Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-6">
          <div className="space-y-4">
            {historyRequests.map((request) => (
              <div 
                key={request.id} 
                className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50"
              >
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                      {getAlertIcon(request.emergency_type || request.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={`${getAlertTypeColor(request.emergency_type || request.type)} text-xs font-medium px-2 py-0.5`}>
                          {(request.emergency_type || request.type).toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(request.status)} text-xs font-medium px-2 py-0.5`}>
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="font-bold text-lg text-gray-900 mb-1">
                        {request.user_name}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        {request.user_address || request.location_description || `${(request.latitude ?? request.location_lat)?.toFixed(4)}, ${(request.longitude ?? request.location_lng)?.toFixed(4)}`}
                      </p>
                      {request.description && (
                        <p className="text-sm text-gray-500 italic mb-2">
                          {request.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(request.created_at)}</span>
                        </div>
                        {request.user_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{request.user_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {historyRequests.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <History className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No History Yet</h3>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  Resolved and dismissed requests will appear here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

