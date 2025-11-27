import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, History } from "lucide-react";

interface HospitalDashboardTabsProps {
  sosRequestsCount: number;
  historyRequestsCount: number;
}

export const HospitalDashboardTabs = ({ sosRequestsCount, historyRequestsCount }: HospitalDashboardTabsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
      <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent gap-1">
        <TabsTrigger 
          value="emergency" 
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
        >
          <AlertTriangle className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Emergency Requests</span>
          <span className="sm:hidden">Emergency</span>
          {sosRequestsCount > 0 && (
            <Badge className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0">
              {sosRequestsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger 
          value="map" 
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
        >
          <MapPin className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Map View</span>
          <span className="sm:hidden">Map</span>
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg"
        >
          <History className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Response History</span>
          <span className="sm:hidden">History</span>
          {historyRequestsCount > 0 && (
            <Badge className="ml-2 bg-green-600 text-white text-[10px] px-1.5 py-0">
              {historyRequestsCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

