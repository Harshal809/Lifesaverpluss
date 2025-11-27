import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, History, Flag } from "lucide-react";

interface ResponderDashboardTabsProps {
  activeRequestsCount: number;
  historyRequestsCount: number;
}

export const ResponderDashboardTabs = ({
  activeRequestsCount,
  historyRequestsCount,
}: ResponderDashboardTabsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-1.5">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-transparent gap-1">
        <TabsTrigger 
          value="alerts"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <AlertTriangle className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Active Requests</span>
          <span className="sm:hidden">Alerts</span>
          {activeRequestsCount > 0 && (
            <Badge className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0">
              {activeRequestsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="map"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <MapPin className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Area Map</span>
          <span className="sm:hidden">Map</span>
        </TabsTrigger>
        <TabsTrigger 
          value="history"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <History className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Response History</span>
          <span className="sm:hidden">History</span>
          {historyRequestsCount > 0 && (
            <Badge className="ml-2 bg-green-600 text-white text-[10px] px-1.5 py-0">
              {historyRequestsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="reports"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <Flag className="h-4 w-4 sm:mr-1.5" />
          Reports
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

