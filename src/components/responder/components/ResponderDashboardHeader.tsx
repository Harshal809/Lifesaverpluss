import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Navigation, AlertTriangle } from "lucide-react";

interface ResponderDashboardHeaderProps {
  profile: {
    first_name: string | null;
    last_name: string | null;
    responder_details?: {
      responder_type?: string;
      is_verified?: boolean;
    } | null;
  } | null;
  isVerified: boolean;
  onDuty: boolean;
  currentLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  visibleRequestsCount: number;
  onProfileClick: () => void;
  onSignOut: () => void;
  onDutyStatusChange: (checked: boolean) => void;
}

export const ResponderDashboardHeader = ({
  profile,
  isVerified,
  onDuty,
  currentLocation,
  locationError,
  visibleRequestsCount,
  onProfileClick,
  onSignOut,
  onDutyStatusChange,
}: ResponderDashboardHeaderProps) => {
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Brand Section - Left */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-orange-700 to-gray-900 bg-clip-text text-transparent">
                Responder Dashboard
              </span>
              {profile && (
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:flex items-center gap-1.5 mt-0.5">
                  <User className="h-3 w-3" />
                  {profile.first_name} {profile.last_name} • {profile.responder_details?.responder_type}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons - Right Side */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onProfileClick}
              className="hidden sm:flex items-center gap-2 hover:bg-gray-50 transition-all duration-200"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onProfileClick}
              className="sm:hidden p-2"
              title="Profile"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSignOut}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Status Bar - Enhanced Design */}
        <div className="pb-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            {isVerified && (
              <div className="flex items-center justify-center lg:justify-start">
                <div className="flex items-center space-x-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-4 py-2.5 shadow-sm border border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">
                    Duty Status:
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${!onDuty ? 'text-gray-900' : 'text-gray-500'}`}>Off</span>
                    <Switch 
                      checked={onDuty} 
                      onCheckedChange={onDutyStatusChange}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <span className={`text-sm font-medium ${onDuty ? 'text-gray-900' : 'text-gray-500'}`}>On</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2">
              <Badge
                variant={onDuty ? "default" : "secondary"}
                className={`${
                  onDuty 
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm px-3 py-1" 
                    : "bg-gray-500 text-white px-3 py-1"
                } font-semibold`}
              >
                {onDuty ? "ON DUTY" : "OFF DUTY"}
              </Badge>

              {!isVerified && (
                <Badge
                  variant="outline"
                  className="text-yellow-700 border-yellow-300 bg-yellow-50/50 hover:bg-yellow-50 px-3 py-1"
                >
                  PENDING VERIFICATION
                </Badge>
              )}

              {currentLocation && (
                <Badge
                  variant="outline"
                  className="text-green-700 border-green-300 bg-green-50/50 hover:bg-green-50 px-3 py-1"
                >
                  <Navigation className="h-3 w-3 mr-1.5" />
                  <span className="hidden sm:inline">Location Active</span>
                  <span className="sm:hidden">GPS</span>
                </Badge>
              )}

              {locationError && (
                <Badge
                  variant="outline"
                  className="text-red-700 border-red-300 bg-red-50/50 hover:bg-red-50 px-3 py-1"
                >
                  <span className="hidden sm:inline">Location Error</span>
                  <span className="sm:hidden">GPS Error</span>
                </Badge>
              )}

              <Badge
                variant="outline"
                className="text-blue-700 border-blue-300 bg-blue-50/50 hover:bg-blue-50 px-3 py-1"
              >
                <AlertTriangle className="h-3 w-3 mr-1.5" />
                <span className="hidden sm:inline">{visibleRequestsCount} Active Requests</span>
                <span className="sm:hidden">{visibleRequestsCount}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

