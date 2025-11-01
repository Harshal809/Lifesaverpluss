import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBloodRequests } from '@/hooks/useBloodRequests';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Droplet, MapPin, Phone, Clock, AlertTriangle, User } from 'lucide-react';
import BloodRequestChat from './BloodRequestChat';

interface BloodRequestListProps {
  showMyRequests?: boolean;
  onRequestSelect?: (requestId: string) => void;
}

const BloodRequestList = ({ showMyRequests = false, onRequestSelect }: BloodRequestListProps) => {
  const { user } = useAuth();
  const { requests, loading, cancelRequest } = useBloodRequests({
    status: ['active', 'partially_fulfilled'],
  });
  const { toast } = useToast();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [filterBloodGroup, setFilterBloodGroup] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter((req) => {
    if (showMyRequests && req.requester_id !== user?.id) return false;
    if (filterBloodGroup !== 'all' && req.blood_group !== filterBloodGroup) return false;
    if (filterUrgency !== 'all' && req.urgency_level !== filterUrgency) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        req.patient_name?.toLowerCase().includes(searchLower) ||
        req.hospital_name?.toLowerCase().includes(searchLower) ||
        req.city?.toLowerCase().includes(searchLower) ||
        req.contact_name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600 text-white';
      case 'urgent': return 'bg-orange-600 text-white';
      case 'normal': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'partially_fulfilled': return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancel = async (requestId: string) => {
    if (confirm('Are you sure you want to cancel this request?')) {
      await cancelRequest(requestId);
    }
  };

  const handleChatClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    if (onRequestSelect) {
      onRequestSelect(requestId);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-red-600" />
                {showMyRequests ? 'My Blood Requests' : 'Active Blood Requests'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {filteredRequests.length} active request{filteredRequests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid gap-4 mt-4 md:grid-cols-3">
            <div className="relative">
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={filterBloodGroup} onValueChange={setFilterBloodGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blood Groups</SelectItem>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger>
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p>Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Droplet className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No blood requests found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    request.urgency_level === 'critical' ? 'border-l-4 border-l-red-600' :
                    request.urgency_level === 'urgent' ? 'border-l-4 border-l-orange-600' :
                    'border-l-4 border-l-blue-600'
                  }`}
                >
                  <div className="flex flex-col space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getUrgencyColor(request.urgency_level)}>
                            {request.urgency_level.toUpperCase()}
                          </Badge>
                          <Badge className="bg-red-100 text-red-800">
                            {request.blood_group}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {request.expiry_date && new Date(request.expiry_date) < new Date() && (
                            <Badge variant="outline" className="text-red-600">
                              Expired
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900">
                          {request.patient_name || 'Blood Request'} 
                          {request.patient_age && ` (Age: ${request.patient_age})`}
                        </h3>
                        {request.patient_condition && (
                          <p className="text-sm text-gray-600 mt-1">
                            Condition: {request.patient_condition}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Droplet className="h-4 w-4" />
                          <span>
                            {request.units_received} / {request.units_required} units received
                          </span>
                        </div>
                        {request.hospital_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{request.hospital_name}</span>
                          </div>
                        )}
                        {(request.city || request.address) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{request.address} {request.city && `, ${request.city}`}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{request.contact_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-600" />
                          <a
                            href={`tel:${request.contact_phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {request.contact_phone}
                          </a>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {request.description && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {request.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                        </div>
                        {request.expiry_date && (
                          <div className="flex items-center gap-2 text-xs text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Expires: {new Date(request.expiry_date).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {user?.id !== request.requester_id && (
                        <Button
                          size="sm"
                          onClick={() => handleChatClick(request.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Chat with Requester
                        </Button>
                      )}
                      {request.contact_phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${request.contact_phone}`)}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                      {showMyRequests && request.status !== 'fulfilled' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(request.id)}
                        >
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      {selectedRequestId && (
        <BloodRequestChat
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  );
};

export default BloodRequestList;

