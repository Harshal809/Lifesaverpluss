import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { AnonymousReportForm, AnonymousReportsHistory } from "./reports";

interface ReportsTabProps {
  onMedicalReportsClick: () => void;
}

export const ReportsTab = ({ onMedicalReportsClick }: ReportsTabProps) => {
  return (
    <TabsContent value="reports" className="space-y-6 mt-6">
      {/* Enhanced Medical Reports Section */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg border-b border-blue-100">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Medical Reports Management
          </CardTitle>
          <p className="text-sm text-gray-700 mt-2 font-medium">
            Manage your medical history and reports securely
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <Button
            onClick={onMedicalReportsClick}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold py-6"
          >
            <FileText className="h-5 w-5 mr-2" />
            Manage Medical Reports
          </Button>
        </CardContent>
      </Card>

      {/* Enhanced Anonymous Reports */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg border-b border-amber-100">
          <CardTitle className="text-xl font-bold">Anonymous Safety Reports</CardTitle>
          <p className="text-sm text-gray-700 mt-2 font-medium">
            Report safety concerns anonymously
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <AnonymousReportForm />
        </CardContent>
      </Card>

      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg border-b border-gray-100">
          <CardTitle className="text-xl font-bold">Report History</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnonymousReportsHistory />
        </CardContent>
      </Card>
    </TabsContent>
  );
};

