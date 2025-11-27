import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AcceptedUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
}

interface HospitalBloodRequest {
  id: string;
  accepted_by: string | null;
  accepted_at: string | null;
  user_response: string | null;
  accepted_user?: AcceptedUser;
}

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: HospitalBloodRequest | null;
  onChatClick: (requestId: string, userId: string) => void;
}

export const UserDetailsDialog = ({ open, onOpenChange, request, onChatClick }: UserDetailsDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Donor Details
          </DialogTitle>
          <DialogDescription>
            Information about the donor who accepted your blood request
          </DialogDescription>
        </DialogHeader>
        {request?.accepted_user ? (
          <div className="mt-4 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {request.accepted_user.first_name || ''} {request.accepted_user.last_name || ''}
                      </h3>
                      <p className="text-sm text-muted-foreground">Blood Donor</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {request.accepted_user.phone && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <a 
                            href={`tel:${request.accepted_user.phone}`}
                            className="text-sm font-medium hover:text-blue-600"
                          >
                            {request.accepted_user.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {request.accepted_user.email && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <a 
                            href={`mailto:${request.accepted_user.email}`}
                            className="text-sm font-medium hover:text-blue-600 break-all"
                          >
                            {request.accepted_user.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {request.user_response && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900 mb-2">Donor's Message:</p>
                      <p className="text-sm text-blue-800 italic">"{request.user_response}"</p>
                    </div>
                  )}

                  {request.accepted_at && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Accepted on: {new Date(request.accepted_at).toLocaleString()}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        onOpenChange(false);
                        onChatClick(request.id, request.accepted_by!);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                    {request.accepted_user.phone && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(`tel:${request.accepted_user?.phone}`, '_blank')}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-4 text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Loading donor details...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

