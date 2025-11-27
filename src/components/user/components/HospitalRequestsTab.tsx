import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { HospitalBloodRequestsList } from "@/components/user/bloodconnect";

export const HospitalRequestsTab = () => {
  return (
    <TabsContent value="hospital-requests" className="space-y-6 mt-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg border-b border-blue-100">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            Hospital Blood Requests
          </CardTitle>
          <p className="text-sm text-gray-700 mt-2 font-medium">
            View and respond to blood donation requests from hospitals
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <HospitalBloodRequestsList />
        </CardContent>
      </Card>
    </TabsContent>
  );
};

