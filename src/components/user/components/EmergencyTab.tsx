import { TabsContent } from "@/components/ui/tabs";
import { ShakeDetectionCard } from "./ShakeDetectionCard";
import { EmergencyActionsCard } from "./EmergencyActionsCard";
import { StatusCards } from "./StatusCards";
import SOSButton from "@/components/r/SOSButton";

interface EmergencyTabProps {
  isSupported: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt';
  shakeEnabled: boolean;
  onRequestPermission: () => void;
  onToggleShake: () => void;
  onSOSClick: (type: "medical" | "safety" | "general") => void;
  onCall911: () => void;
  onSubmitReport: (type: string, description: string, location?: { lat: number; lng: number; description: string }) => void;
  sosCountdown: number;
  location: string;
  contactsCount: number;
  userLat?: number;
  userLng?: number;
}

export const EmergencyTab = ({
  isSupported,
  permissionStatus,
  shakeEnabled,
  onRequestPermission,
  onToggleShake,
  onSOSClick,
  onCall911,
  onSubmitReport,
  sosCountdown,
  location,
  contactsCount,
  userLat,
  userLng,
}: EmergencyTabProps) => {
  return (
    <TabsContent value="emergency" className="space-y-6 mt-6">
      {/* Enhanced Shake Detection Status */}
      <ShakeDetectionCard
        isSupported={isSupported}
        permissionStatus={permissionStatus}
        shakeEnabled={shakeEnabled}
        onRequestPermission={onRequestPermission}
        onToggleShake={onToggleShake}
      />

      {/* Enhanced SOS Button */}
      <div className="flex justify-center">
        <SOSButton />
      </div>

      {/* Enhanced Emergency Actions Card */}
      <EmergencyActionsCard
        onSOSClick={onSOSClick}
        onCall911={onCall911}
        onSubmitReport={onSubmitReport}
        sosCountdown={sosCountdown}
      />

      {/* Enhanced Status Cards */}
      <StatusCards
        location={location}
        contactsCount={contactsCount}
        userLat={userLat}
        userLng={userLng}
      />
    </TabsContent>
  );
};

