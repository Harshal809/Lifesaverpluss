import { Button } from "@/components/ui/button";
import { Building2, Droplet, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HospitalBloodConnectHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="relative">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1.5">
                <Droplet className="h-4 w-4 text-white" fill="currentColor" />
              </div>
            </div>
            <span>Hospital Blood Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Efficiently manage your blood bank inventory and coordinate with donors
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/dashboard/hospital/bloodconnect/chat')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            size="sm"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Messages</span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

