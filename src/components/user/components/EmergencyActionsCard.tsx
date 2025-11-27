import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ambulance, Shield, Flag, Phone, MapPin, MoreHorizontalIcon } from "lucide-react";
import { AnonymousReportDialog } from "./reports";

interface EmergencyActionsCardProps {
  onSOSClick: (type: "medical" | "safety" | "general") => void;
  onCall911: () => void;
  onSubmitReport: (type: string, description: string, location?: { lat: number; lng: number; description: string }) => void;
  sosCountdown: number;
}

export const EmergencyActionsCard = ({
  onSOSClick,
  onCall911,
  onSubmitReport,
  sosCountdown,
}: EmergencyActionsCardProps) => {
  return (
    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg border-b border-red-100">
        <CardTitle className="flex items-center space-x-3 text-xl sm:text-2xl font-bold">
          <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md">
            <Ambulance className="h-6 w-6 text-white" />
          </div>
          <span>Emergency Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Button
            onClick={() => onSOSClick("medical")}
            className="h-24 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            disabled={sosCountdown > 0}
          >
            <div className="text-center">
              <Ambulance className="h-7 w-7 mx-auto mb-2" />
              <div className="font-bold text-base">Medical Emergency</div>
              <div className="text-xs opacity-90 mt-1">Critical Health Issue</div>
            </div>
          </Button>

          <Button
            onClick={() => onSOSClick("safety")}
            className="h-24 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            disabled={sosCountdown > 0}
          >
            <div className="text-center">
              <Shield className="h-7 w-7 mx-auto mb-2" />
              <div className="font-bold text-base">Personal Safety</div>
              <div className="text-xs opacity-90 mt-1">Security Threat</div>
            </div>
          </Button>

          <Button
            onClick={() => onSOSClick("general")}
            className="h-24 bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            disabled={sosCountdown > 0}
          >
            <div className="text-center">
              <Flag className="h-7 w-7 mx-auto mb-2" />
              <div className="font-bold text-base">General Emergency</div>
              <div className="text-xs opacity-90 mt-1">Other Assistance</div>
            </div>
          </Button>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid md:grid-cols-4 gap-3">
          <Button 
            onClick={onCall911} 
            variant="outline" 
            className="border-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold transition-all duration-200"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call 911
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-300 hover:bg-gray-50 font-semibold transition-all duration-200"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Share Location
          </Button>
          <Button 
            variant="outline"
            className="border-gray-300 hover:bg-gray-50 font-semibold transition-all duration-200"
          >
            <MoreHorizontalIcon className="h-4 w-4 mr-2" />
            More Features
          </Button>
          <AnonymousReportDialog
            onSubmit={onSubmitReport}
            trigger={
              <Button 
                variant="outline" 
                className="w-full border-gray-300 hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                <Flag className="h-4 w-4 mr-2" />
                Anonymous Report
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

