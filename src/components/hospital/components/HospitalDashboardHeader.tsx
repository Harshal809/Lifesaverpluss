import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Heart, MessageCircle, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  first_name: string | null;
  last_name: string | null;
}

interface HospitalDashboardHeaderProps {
  profile: Profile | null;
  onProfileClick: () => void;
  onSignOut: () => void;
  activeEmergenciesCount: number;
  acknowledgedCount: number;
}

export const HospitalDashboardHeader = ({
  profile,
  onProfileClick,
  onSignOut,
  activeEmergenciesCount,
  acknowledgedCount,
}: HospitalDashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-md border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Brand Section - Left Side */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Hospital Dashboard
              </span>
              {profile && (
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3" />
                  {profile.first_name} {profile.last_name} • Hospital Staff
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons - Right Side - Professional Layout */}
          <div className="flex items-center space-x-2 flex-wrap justify-end">
            {/* Profile Button */}
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

            {/* Blood Connect Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/hospital/bloodconnect')}
              className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 text-red-700 hover:text-red-800 hidden sm:flex items-center gap-2 transition-all duration-200 shadow-sm"
            >
              <Heart className="h-4 w-4" />
              <span>Blood Connect</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/hospital/bloodconnect')}
              className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 text-red-700 sm:hidden p-2"
              title="Blood Connect"
            >
              <Heart className="h-4 w-4" />
            </Button>

            {/* Message/Chat Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/hospital/bloodconnect/chat')}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100 text-blue-700 hover:text-blue-800 hidden sm:flex items-center gap-2 transition-all duration-200 shadow-sm relative"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/hospital/bloodconnect/chat')}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100 text-blue-700 sm:hidden p-2 relative"
              title="Chat"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
            </Button>

            {/* Logout Button */}
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

        {/* Status Bar - Enhanced Design */}
        <div className="pb-4 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <Badge 
              variant="default" 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm px-3 py-1"
            >
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              HOSPITAL ACTIVE
            </Badge>
            
            <Badge 
              variant="outline" 
              className="text-green-700 border-green-300 bg-green-50/50 hover:bg-green-50 px-3 py-1"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="hidden sm:inline">System Online</span>
              <span className="sm:hidden">Online</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className="text-blue-700 border-blue-300 bg-blue-50/50 hover:bg-blue-50 px-3 py-1"
            >
              <AlertTriangle className="h-3 w-3 mr-1.5" />
              <span className="hidden sm:inline">{activeEmergenciesCount} Active Emergencies</span>
              <span className="sm:hidden">{activeEmergenciesCount} Active</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className="text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-50 px-3 py-1"
            >
              <Clock className="h-3 w-3 mr-1.5" />
              <span className="hidden sm:inline">{acknowledgedCount} Acknowledged</span>
              <span className="sm:hidden">{acknowledgedCount} Ack</span>
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};

