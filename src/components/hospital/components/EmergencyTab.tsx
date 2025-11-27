import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { HospitalStatsCards } from "./HospitalStatsCards";
import { AIPrioritySuggestor } from "./ai";
import { EmergencyRequestCard } from "./EmergencyRequestCard";

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

interface EmergencyTabProps {
  sosRequests: SOSRequest[];
  historyRequests: SOSRequest[];
  onStatusUpdate: (id: string, status: string) => void;
  formatTime: (timestamp: string | null) => string;
  getStatusColor: (status: string) => string;
}

export const EmergencyTab = ({
  sosRequests,
  historyRequests,
  onStatusUpdate,
  formatTime,
  getStatusColor,
}: EmergencyTabProps) => {
  return (
    <TabsContent value="emergency" className="space-y-6 mt-6">
      {/* Stats Cards */}
      <HospitalStatsCards sosRequests={sosRequests} historyRequests={historyRequests} />
      
      {/* AI Priority Suggestions */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 shadow-sm">
        <AIPrioritySuggestor sosRequests={sosRequests} />
      </div>

      {/* Emergency Requests Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg border-b border-red-100">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Emergency Requests</CardTitle>
                <p className="text-sm text-gray-600 mt-1 font-medium">Active SOS requests assigned to your hospital</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 font-semibold px-3 py-1">
                {sosRequests.length} Active
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 font-semibold px-3 py-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 py-6">
          <div className="space-y-4">
            {sosRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <AlertTriangle className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear</h3>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  No emergency requests assigned to your hospital at the moment. Great job!
                </p>
              </div>
            ) : (
              sosRequests.map((request) => (
                <EmergencyRequestCard
                  key={request.id}
                  request={request}
                  onStatusUpdate={onStatusUpdate}
                  formatTime={formatTime}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

