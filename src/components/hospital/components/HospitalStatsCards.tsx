import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, History, Building2 } from "lucide-react";

interface SOSRequest {
  status: string;
  updated_at?: string | null;
  created_at?: string | null;
}

interface HospitalStatsCardsProps {
  sosRequests: SOSRequest[];
  historyRequests: SOSRequest[];
}

export const HospitalStatsCards = ({ sosRequests, historyRequests }: HospitalStatsCardsProps) => {
  const activeCount = sosRequests.filter((r) => r.status === 'active' || r.status === 'pending').length;
  const acknowledgedCount = sosRequests.filter((r) => r.status === 'acknowledged').length;
  const resolvedToday = historyRequests.filter((r) => {
    if (r.status !== 'resolved') return false;
    const today = new Date();
    const requestDate = new Date(r.updated_at || r.created_at || '');
    return requestDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Active Emergencies Card */}
      <Card className="border-l-4 border-l-red-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-red-50/30 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-1">
                {activeCount}
              </div>
              <div className="text-sm font-semibold text-gray-700">Active Emergencies</div>
              <div className="text-xs text-gray-500 mt-1">Requires immediate attention</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acknowledged Card */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                {acknowledgedCount}
              </div>
              <div className="text-sm font-semibold text-gray-700">Acknowledged</div>
              <div className="text-xs text-gray-500 mt-1">In progress</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resolved Today Card */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-1">
                {resolvedToday}
              </div>
              <div className="text-sm font-semibold text-gray-700">Resolved Today</div>
              <div className="text-xs text-gray-500 mt-1">Successfully handled</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <History className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Handled Card */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-1">
                {historyRequests.length}
              </div>
              <div className="text-sm font-semibold text-gray-700">Total Handled</div>
              <div className="text-xs text-gray-500 mt-1">All time records</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Building2 className="h-7 w-7 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

