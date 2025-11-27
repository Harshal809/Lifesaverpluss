import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, MapPin } from "lucide-react";
import { MedicalReportView } from "@/components/user/components/medical";

interface SOSRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_address: string | null;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string | null;
}

interface HistoryTabProps {
  historyRequests: SOSRequest[];
  formatTime: (timestamp: string | null) => string;
  getStatusColor: (status: string) => string;
}

export const HistoryTab = ({ historyRequests, formatTime, getStatusColor }: HistoryTabProps) => {
  return (
    <TabsContent value="history" className="space-y-6 mt-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
                <History className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Response History</CardTitle>
                <p className="text-sm text-gray-600 mt-1 font-medium">Previously handled emergency requests</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 font-semibold px-3 py-1">
              {historyRequests.length} Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-6">
          <div className="space-y-4">
            {historyRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <History className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No History Yet</h3>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  Resolved and dismissed requests will appear here.
                </p>
              </div>
            ) : (
              historyRequests.map((request) => (
                <div key={request.id} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
                  <div className="flex flex-col space-y-3">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={`${getStatusColor(request.status)} text-xs`}>
                              {request.status.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-blue-600 text-xs">
                              ID: {request.user_id.slice(0, 8)}...
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTime(request.created_at)}
                            </span>
                          </div>
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {request.user_address || 'Emergency Location'}
                          </p>
                          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 mb-2">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {request.latitude?.toFixed(6)}, {request.longitude?.toFixed(6)}
                            </span>
                          </div>
                          {request.user_name && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <User className="h-3 w-3" />
                              <span>{request.user_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Medical Report in History */}
                    <div className="w-full pt-2 border-t">
                      <MedicalReportView 
                        userId={request.user_id} 
                        userName={request.user_name || 'Patient'}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

