import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Ambulance, Shield, Flag } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  location_description?: string;
  description?: string;
  status: string;
  created_at: string;
}

interface HistoryTabProps {
  alerts: Alert[];
  getStatusColor: (status: string) => string;
  getTypeIcon: (type: string) => JSX.Element;
}

export const HistoryTab = ({ alerts, getStatusColor, getTypeIcon }: HistoryTabProps) => {
  return (
    <TabsContent value="history" className="space-y-6 mt-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100">
          <CardTitle className="flex items-center space-x-3 text-xl font-bold">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <History className="h-5 w-5 text-white" />
            </div>
            <span>SOS Alert History</span>
          </CardTitle>
          <p className="text-sm text-gray-700 mt-2 font-medium">
            View all your past emergency alerts and their status
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-lg">
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg capitalize text-gray-900">{alert.type} Emergency</p>
                      {alert.location_description && (
                        <p className="text-sm text-gray-600 mt-1">{alert.location_description}</p>
                      )}
                      {alert.description && (
                        <p className="text-sm text-gray-500 mt-2 italic">{alert.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <Badge className={`${getStatusColor(alert.status)} font-semibold px-3 py-1 mb-2`}>
                      {alert.status}
                    </Badge>
                    <p className="text-sm text-gray-600 font-medium">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <History className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Emergency Alerts Yet</h3>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  Your emergency alert history will appear here once you send an SOS.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

