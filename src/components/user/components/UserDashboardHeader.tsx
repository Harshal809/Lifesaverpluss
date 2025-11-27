import { Button } from "@/components/ui/button";
import { Shield, User, FileText, Sparkles, Heart, MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserDashboardHeaderProps {
  profile: { first_name: string; last_name: string } | null;
  onProfileClick: () => void;
  onMedicalReportsClick: () => void;
  onAISymptomCheckerClick: () => void;
  onContactsClick: () => void;
  onSignOut: () => void;
}

export const UserDashboardHeader = ({
  profile,
  onProfileClick,
  onMedicalReportsClick,
  onAISymptomCheckerClick,
  onContactsClick,
  onSignOut,
}: UserDashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Brand Section - Left */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-red-700 to-gray-900 bg-clip-text text-transparent">
                LifeSaver+ Dashboard
              </span>
              {profile && (
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:flex items-center gap-1.5 mt-0.5">
                  <User className="h-3 w-3" />
                  {profile.first_name} {profile.last_name}
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
              className="hidden sm:flex items-center gap-2 hover:bg-gray-50 transition-all duration-200 border-gray-200"
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

            {/* Medical Reports Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onMedicalReportsClick}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100 text-blue-700 hover:text-blue-800 hidden sm:flex items-center gap-2 transition-all duration-200 shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span>Medical</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onMedicalReportsClick}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100 text-blue-700 sm:hidden p-2"
              title="Medical Reports"
            >
              <FileText className="h-4 w-4" />
            </Button>

            {/* AI Symptom Checker Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAISymptomCheckerClick}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 hover:text-purple-800 hidden sm:flex items-center gap-2 transition-all duration-200 shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Check</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAISymptomCheckerClick}
              className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 text-purple-700 sm:hidden p-2"
              title="AI Symptom Checker"
            >
              <Sparkles className="h-4 w-4" />
            </Button>

            {/* Blood Connect Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/user/bloodconnect')}
              className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 text-red-700 hover:text-red-800 hidden sm:flex items-center gap-2 transition-all duration-200 shadow-sm"
            >
              <Heart className="h-4 w-4" />
              <span>Blood Connect</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/user/bloodconnect')}
              className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 text-red-700 sm:hidden p-2"
              title="Blood Connect"
            >
              <Heart className="h-4 w-4" />
            </Button>

            {/* Message/Chat Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/user/bloodconnect/chat')}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100 text-blue-700 hover:text-blue-800 hidden sm:flex items-center gap-2 transition-all duration-200 shadow-sm relative"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-white"></span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/user/bloodconnect/chat')}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100 text-blue-700 sm:hidden p-2 relative"
              title="Chat"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse border border-white"></span>
            </Button>

            {/* Emergency Contacts Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onContactsClick}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 text-green-700 hover:text-green-800 hidden sm:flex items-center gap-2 transition-all duration-200 shadow-sm"
            >
              <Users className="h-4 w-4" />
              <span>Contacts</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onContactsClick}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 text-green-700 sm:hidden p-2"
              title="Emergency Contacts"
            >
              <Users className="h-4 w-4" />
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
      </div>
    </header>
  );
};

