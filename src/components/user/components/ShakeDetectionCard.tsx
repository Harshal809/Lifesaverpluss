import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface ShakeDetectionCardProps {
  isSupported: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt';
  shakeEnabled: boolean;
  onRequestPermission: () => void;
  onToggleShake: () => void;
}

export const ShakeDetectionCard = ({
  isSupported,
  permissionStatus,
  shakeEnabled,
  onRequestPermission,
  onToggleShake,
}: ShakeDetectionCardProps) => {
  if (!isSupported) return null;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Shake to Trigger SOS
            </h3>
            <p className="text-sm text-blue-700">
              {permissionStatus === 'granted' 
                ? '✅ Shake detection is active. Shake your device to trigger emergency SOS.'
                : permissionStatus === 'denied'
                ? '⚠️ Motion permission denied. Click "Enable" to grant access.'
                : '📱 Click "Enable" to allow shake detection for emergency SOS.'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {permissionStatus !== 'granted' && (
              <Button 
                onClick={onRequestPermission}
                size="sm"
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold"
              >
                Enable
              </Button>
            )}
            <Button
              onClick={onToggleShake}
              size="sm"
              variant={shakeEnabled ? "default" : "outline"}
              className={shakeEnabled ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {shakeEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

