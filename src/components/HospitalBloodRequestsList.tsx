import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Droplet, MapPin, Phone, Clock, CheckCircle2, XCircle, MessageCircle, AlertCircle, User } from 'lucide-react';

interface HospitalBloodRequest {
  id: string;
  hospital_id: string;
  blood_group: string;
  units_required: number;
  units_received: number;
  urgency_level: string;
  patient_name: string | null;
  patient_id: string | null;
  department: string | null;
  doctor_name: string | null;
  doctor_contact: string | null;
  reason: string | null;
  priority: number;
  status: string;
  accepted_by: string | null;
  accepted_at: string | null;
  user_response: string | null;
  created_at: string;
  hospital: {
    hospital_name: string;
    address: string;
    phone: string;
    email: string;
  };
}

const HospitalBloodRequestsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<HospitalBloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HospitalBloodRequest | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'accepted'>('all');

  useEffect(() => {
    fetchRequests();
    subscribeToRequests();
  }, [user, filterStatus]);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('hospital_blood_requests')
        .select(`
          *,
          hospital:hospital_profiles!hospital_blood_requests_hospital_id_fkey(
            hospital_name,
            address,
            phone,
            email
          )
        `)
        .in('status', ['active', 'partially_fulfilled']);

      // Filter based on acceptance status
      if (filterStatus === 'accepted') {
        query = query.eq('accepted_by', user.id);
      } else if (filterStatus === 'active') {
        query = query.is('accepted_by', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data || []) as HospitalBloodRequest[]);
    } catch (error: any) {
      console.error('Error fetching hospital requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch hospital requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRequests = () => {
    if (!user) return;

    const channel = supabase
      .channel(`hospital_blood_requests_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_blood_requests',
          filter: `status=in.(active,partially_fulfilled)`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAccept = (request: HospitalBloodRequest) => {
    setSelectedRequest(request);
    setUserResponse('');
    setShowAcceptDialog(true);
  };

  const handleAcceptSubmit = async () => {
    if (!user || !selectedRequest) return;

    try {
      const { error } = await supabase
        .from('hospital_blood_requests')
        .update({
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
          user_response: userResponse || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You have accepted this blood request. Hospital will be notified.',
      });

      setShowAcceptDialog(false);
      setSelectedRequest(null);
      setUserResponse('');
      fetchRequests();
    } catch (error: any) {
      console.error('Error accepting request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept request',
        variant: 'destructive',
      });
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge className="bg-red-600 text-white"><AlertCircle className="h-3 w-3 mr-1" />Critical</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-600 text-white"><Clock className="h-3 w-3 mr-1" />Urgent</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getStatusBadge = (request: HospitalBloodRequest) => {
    if (request.accepted_by === user?.id) {
      return <Badge className="bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Accepted by You</Badge>;
    }
    if (request.accepted_by) {
      return <Badge variant="outline" className="bg-gray-100">Accepted by Another Donor</Badge>;
    }
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Available</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading hospital requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
          size="sm"
        >
          All Requests
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('active')}
          size="sm"
        >
          Available
        </Button>
        <Button
          variant={filterStatus === 'accepted' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('accepted')}
          size="sm"
        >
          My Acceptances
        </Button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No hospital blood requests found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterStatus === 'accepted' 
                ? "You haven't accepted any requests yet"
                : "Check back later for new requests"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{request.hospital.hospital_name}</CardTitle>
                      {getStatusBadge(request)}
                      {getUrgencyBadge(request.urgency_level)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Droplet className="h-4 w-4 text-red-600" />
                        <span className="font-semibold">{request.blood_group}</span>
                      </div>
                      <span>{request.units_required} units required</span>
                      {request.units_received > 0 && (
                        <span className="text-green-600">{request.units_received} units received</span>
                      )}
                      {request.priority && (
                        <span>Priority: {request.priority}/10</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {request.patient_name && (
                    <div>
                      <span className="text-sm font-medium">Patient: </span>
                      <span className="text-sm">{request.patient_name}</span>
                      {request.patient_id && (
                        <span className="text-sm text-muted-foreground"> (ID: {request.patient_id})</span>
                      )}
                    </div>
                  )}
                  {request.department && (
                    <div>
                      <span className="text-sm font-medium">Department: </span>
                      <span className="text-sm">{request.department}</span>
                    </div>
                  )}
                  {request.doctor_name && (
                    <div>
                      <span className="text-sm font-medium">Doctor: </span>
                      <span className="text-sm">{request.doctor_name}</span>
                      {request.doctor_contact && (
                        <span className="text-sm text-muted-foreground"> ({request.doctor_contact})</span>
                      )}
                    </div>
                  )}
                  {request.reason && (
                    <div>
                      <span className="text-sm font-medium">Reason: </span>
                      <span className="text-sm">{request.reason}</span>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{request.hospital.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{request.hospital.phone}</span>
                    </div>
                  </div>
                  {request.accepted_by === user?.id && request.user_response && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-700">Your Response: </span>
                      <span className="text-sm text-green-700">{request.user_response}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {!request.accepted_by && (
                      <Button
                        onClick={() => handleAccept(request)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept Request
                      </Button>
                    )}
                    <Button
                      onClick={() => navigate(`/dashboard/user/bloodconnect/chat?hospitalId=${request.hospital_id}&hospitalName=${encodeURIComponent(request.hospital.hospital_name)}`)}
                      variant="outline"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Blood Request</DialogTitle>
            <DialogDescription>
              You are accepting a request from {selectedRequest?.hospital.hospital_name}. 
              Please provide any additional information or confirm your acceptance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="user_response">Your Response (Optional)</Label>
              <Textarea
                id="user_response"
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Add any notes or confirm your availability..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAcceptSubmit}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accept Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalBloodRequestsList;

