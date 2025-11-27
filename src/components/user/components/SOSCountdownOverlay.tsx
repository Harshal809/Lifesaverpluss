import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SOSCountdownOverlayProps {
  countdown: number;
  sosType: 'medical' | 'safety' | 'general';
  onCancel: () => void;
}

export const SOSCountdownOverlay = ({ countdown, sosType, onCancel }: SOSCountdownOverlayProps) => {
  if (countdown <= 0) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="p-10 text-center shadow-2xl border-2 border-red-500 bg-gradient-to-br from-white to-red-50/30 max-w-md w-full mx-4">
        <div className="text-8xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-6 animate-pulse">
          {countdown}
        </div>
        <p className="text-xl font-semibold text-gray-900 mb-2">
          {sosType.toUpperCase()} Emergency Alert
        </p>
        <p className="text-sm text-gray-600 mb-6">Activating in {countdown} seconds...</p>
        <Button 
          onClick={onCancel} 
          variant="outline"
          className="bg-red-50 border-red-300 hover:bg-red-100 text-red-700 font-semibold"
        >
          Cancel SOS
        </Button>
      </Card>
    </div>
  );
};

