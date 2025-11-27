import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Tabs } from "@/components/ui/tabs";
import { HospitalDashboardHeader } from '@/components/hospital/components/HospitalDashboardHeader';
import { HospitalStatsCards } from '@/components/hospital/components/HospitalStatsCards';
import { ProfileModal } from '@/components/hospital/components/profile';
import { HospitalDashboardTabs } from '@/components/hospital/components/HospitalDashboardTabs';
import { EmergencyTab } from '@/components/hospital/components/EmergencyTab';
import { MapTab } from '@/components/hospital/components/MapTab';
import { HistoryTab } from '@/components/hospital/components/HistoryTab';


interface SOSRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  user_address: string | null;
  latitude: number;
  longitude: number;
  emergency_type: string;
  description: string | null;
  assigned_hospital_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  estimated_arrival: string | null;
  notes: string | null;
  status: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string;
  user_type: string;
}

const HospitalDashboard: React.FC = () => {
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([]);
  const [historyRequests, setHistoryRequests] = useState<SOSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalLocation, setHospitalLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const subscriptionRef = useRef<any>(null);

  // Fetch hospital id for the logged-in user and profile
  useEffect(() => {
    const fetchHospitalIdAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch hospital id and location
        const { data: hospital, error: hospitalError } = await supabase
          .from('hospital_profiles')
          .select('id, latitude, longitude')
          .eq('id', user.id)
          .single();
        if (hospital) {
          setHospitalId(hospital.id);
          if (hospital.latitude && hospital.longitude) {
            setHospitalLocation({
              lat: Number(hospital.latitude),
              lng: Number(hospital.longitude)
            });
          }
        } else {
          toast({
            title: 'Profile Not Found',
            description: 'No hospital profile found for this account.',
            variant: 'destructive',
          });
          navigate('/auth/hospital');
        }
        // Fetch profile
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (prof) {
          setProfile(prof as Profile);
        }
        setProfileLoading(false);
      }
    };
    fetchHospitalIdAndProfile();
    // eslint-disable-next-line
  }, []);

  // Fetch and subscribe to ALL sos_requests (not filtered by hospital)
  useEffect(() => {
    setLoading(true);

    const fetchSOSRequests = async () => {
      if (!hospitalId) {
        setLoading(false);
        return;
      }

      // Fetch only SOS requests assigned to this hospital
      const { data, error } = await supabase
        .from('sos_requests')
        .select('*')
        .eq('assigned_hospital_id', hospitalId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Separate active and history
        const active = data.filter(r => r.status !== 'resolved' && r.status !== 'dismissed');
        const history = data.filter(r => r.status === 'resolved' || r.status === 'dismissed');
        setSosRequests(active);
        setHistoryRequests(history);
      }
      setLoading(false);
    };

    fetchSOSRequests();

    // Clean up previous subscription if any
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Real-time subscription (listen to all sos_requests)
    const channel = supabase
      .channel('realtime:sos_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_requests',
        },
        (payload) => {
          const newRequest = payload.new as SOSRequest;
          const isAssigned = newRequest.assigned_hospital_id === hospitalId;
          
          if (!isAssigned && payload.eventType === 'INSERT') return;
          
          setSosRequests((prev) => {
            let updated = prev;
            if (payload.eventType === 'INSERT' && isAssigned) {
              if (newRequest.status !== 'resolved' && newRequest.status !== 'dismissed') {
                if (!prev.some((req) => req.id === newRequest.id)) {
                  updated = [newRequest, ...prev];
                }
              }
            } else if (payload.eventType === 'UPDATE' && isAssigned) {
              const isResolved = newRequest.status === 'resolved' || newRequest.status === 'dismissed';
              if (isResolved) {
                // Move to history
                updated = prev.filter((req) => req.id !== newRequest.id);
              } else {
                updated = prev.map((req) =>
                  req.id === newRequest.id ? newRequest : req
                );
              }
            } else if (payload.eventType === 'DELETE') {
              updated = prev.filter((req) => req.id !== payload.old.id);
            }
            return updated;
          });
          setHistoryRequests((prev) => {
            let updated = prev;
            if (payload.eventType === 'INSERT' && isAssigned) {
              if (newRequest.status === 'resolved' || newRequest.status === 'dismissed') {
                if (!prev.some((req) => req.id === newRequest.id)) {
                  updated = [newRequest, ...prev];
                }
              }
            } else if (payload.eventType === 'UPDATE' && isAssigned) {
              const isResolved = newRequest.status === 'resolved' || newRequest.status === 'dismissed';
              if (isResolved) {
                updated = prev.map((req) =>
                  req.id === newRequest.id ? newRequest : req
                );
                if (!prev.some((req) => req.id === newRequest.id)) {
                  updated = [newRequest, ...prev];
                }
              } else {
                updated = prev.filter((req) => req.id !== newRequest.id);
              }
            } else if (payload.eventType === 'DELETE') {
              updated = prev.filter((req) => req.id !== payload.old.id);
            }
            return updated;
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [hospitalId, toast]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Immediate UI update on status change (optimistic)
  const handleStatusUpdate = async (id: string, status: string) => {
    const request = sosRequests.find((req) => req.id === id);
    
    // Optimistic update
    setSosRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
    
    // Move to history if resolved or dismissed
    if (status === 'resolved' || status === 'dismissed') {
      if (request) {
        setHistoryRequests((prev) => [request, ...prev]);
      }
      // Remove from active list after a delay
      setTimeout(() => {
        setSosRequests((prev) => 
          prev.filter((req) => req.id !== id)
        );
      }, 500);
    }
    
    const { error } = await supabase
      .from('sos_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      // Revert optimistic update on error
      if (request) {
        setSosRequests((prev) =>
          prev.map((req) => (req.id === id ? request : req))
        );
      }
      toast({
        title: 'Error',
        description: 'Could not update status.',
        variant: 'destructive',
      });
    } else {
      const statusMessages: { [key: string]: string } = {
        'acknowledged': 'Request acknowledged. Team will respond shortly.',
        'resolved': 'Request resolved successfully.',
        'dismissed': 'Request dismissed.',
        'pending': 'Request status updated.',
      };
      toast({
        title: 'Status Updated',
        description: statusMessages[status] || `Request marked as ${status}.`,
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth/hospital');
  };

  const handleProfileUpdate = async (updated: any) => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: updated.first_name,
        last_name: updated.last_name,
        phone: updated.phone,
      })
      .eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, ...updated });
      toast({ title: "Profile Updated", description: "Your profile has been updated." });
    } else {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeEmergenciesCount = sosRequests.filter(r => r.status === 'active' || r.status === 'pending').length;
  const acknowledgedCount = sosRequests.filter(r => r.status === 'acknowledged').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <HospitalDashboardHeader
        profile={profile}
        onProfileClick={() => setShowProfile(true)}
        onSignOut={signOut}
        activeEmergenciesCount={activeEmergenciesCount}
        acknowledgedCount={acknowledgedCount}
      />

      {/* Main Content Area */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs defaultValue="emergency" className="space-y-6 w-full">
          <HospitalDashboardTabs 
            sosRequestsCount={sosRequests.length}
            historyRequestsCount={historyRequests.length}
          />

          <EmergencyTab
            sosRequests={sosRequests}
            historyRequests={historyRequests}
            onStatusUpdate={handleStatusUpdate}
            formatTime={formatTime}
            getStatusColor={getStatusColor}
          />

          <MapTab
            sosRequests={sosRequests}
            hospitalLocation={hospitalLocation}
          />

          <HistoryTab
            historyRequests={historyRequests}
            formatTime={formatTime}
            getStatusColor={getStatusColor}
          />
        </Tabs>
      </div>

      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        profile={profile}
        onProfileUpdate={async (updated) => {
          await handleProfileUpdate(updated);
        }}
      />
    </div>
  );
};

export default HospitalDashboard;
