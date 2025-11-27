import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Sparkles, Building2, History, FileText } from "lucide-react";

export const UserDashboardTabs = () => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-1.5">
      <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent gap-1">
        <TabsTrigger 
          value="emergency"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <AlertTriangle className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Emergency</span>
          <span className="sm:hidden">SOS</span>
        </TabsTrigger>
        <TabsTrigger 
          value="ai-features"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <Sparkles className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">AI Features</span>
          <span className="sm:hidden">AI</span>
        </TabsTrigger>
        <TabsTrigger 
          value="hospital-requests"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <Building2 className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Hospitals</span>
          <span className="sm:hidden">Hosp</span>
        </TabsTrigger>
        <TabsTrigger 
          value="history"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <History className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">History</span>
          <span className="sm:hidden">Hist</span>
        </TabsTrigger>
        <TabsTrigger 
          value="reports"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-semibold"
        >
          <FileText className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Reports</span>
          <span className="sm:hidden">Rep</span>
        </TabsTrigger>
      </TabsList>
    </div>
  );
};

