import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Phone } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface EmergencyContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  newContact: { name: string; phone: string };
  onNewContactChange: (contact: { name: string; phone: string }) => void;
  onAddContact: () => void;
  onCallContact: (phone: string) => void;
  onRemoveContact: (id: string) => void;
}

export const EmergencyContactsDialog = ({
  open,
  onOpenChange,
  contacts,
  newContact,
  onNewContactChange,
  onAddContact,
  onCallContact,
  onRemoveContact,
}: EmergencyContactsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Emergency Contacts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Add Contact Form */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add New Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactName">Name</Label>
                  <Input
                    id="contactName"
                    value={newContact.name}
                    onChange={(e) => onNewContactChange({ ...newContact, name: e.target.value })}
                    placeholder="Contact name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    value={newContact.phone}
                    onChange={(e) => onNewContactChange({ ...newContact, phone: e.target.value })}
                    placeholder="+91-XXXXXXXXXX"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={onAddContact} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!newContact.name || !newContact.phone}
                  >
                    Add Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Emergency Contacts ({contacts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No emergency contacts yet</p>
                  <p className="text-sm mt-1">Add a contact above to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{contact.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <a 
                            href={`tel:${contact.phone}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onCallContact(contact.phone)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRemoveContact(contact.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

