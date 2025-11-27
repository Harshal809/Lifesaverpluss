import { TabsContent } from "@/components/ui/tabs";
import { AnonymousReportsManager } from "@/components/AnonymousReportsManager";

export const ReportsTab = () => {
  return (
    <TabsContent value="reports" className="space-y-6 mt-6">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <AnonymousReportsManager />
      </div>
    </TabsContent>
  );
};

