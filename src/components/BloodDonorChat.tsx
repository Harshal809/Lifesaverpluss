import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBloodRequests } from '@/hooks/useBloodRequests';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, X } from 'lucide-react';
import BloodRequestChat from './BloodRequestChat';

interface BloodDonorChatProps {
  donorId: string;
  donorName: string;
  onClose: () => void;
}

const BloodDonorChat = ({ donorId, donorName, onClose }: BloodDonorChatProps) => {
  const { user } = useAuth();
  const { requests } = useBloodRequests({ status: ['active', 'partially_fulfilled'] });
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Filter user's own requests
  const myRequests = requests.filter(r => r.requester_id === user?.id);

  if (selectedRequestId) {
    return (
      <BloodRequestChat 
        requestId={selectedRequestId} 
        onClose={() => {
          setSelectedRequestId(null);
          onClose();
        }} 
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with {donorName}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">No Active Requests</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You need to create a blood request first to chat with donors.
              </p>
              <Button onClick={onClose}>
                Create Blood Request
              </Button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select which blood request to discuss:
                </label>
                <Select onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a request..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myRequests.map(request => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.blood_group} - {request.units_required} unit(s) - {request.urgency_level}
                        {request.patient_name && ` for ${request.patient_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Select a blood request to start chatting with this donor about your specific need.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BloodDonorChat;
