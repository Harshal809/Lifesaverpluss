import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useResponderData } from "@/hooks/useResponderData";
import { useResponderLocation } from "@/hooks/useResponderLocation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ResponderDashboardHeader,
  ResponderDashboardTabs,
  AlertsTab,
  MapTab,
  HistoryTab,
  ReportsTab,
  ResponderProfile,
} from "@/components/responder/components";
import { Ambulance, Shield, Flag } from "lucide-react";

interface EmergencyAlert {
  id: string;
  user_id: string;
  type: 'medical' | 'safety' | 'general';
  status: 'active' | 'acknowledged' | 'responding' | 'completed';
  location_lat?: number;
  location_lng?: number;
  location_description?: string;
  description?: string;
  responder_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  // Computed fields for UI compatibility
  user_name?: string;
  user_phone?: string;
  user_address?: string;
  latitude?: number;
  longitude?: number;
  emergency_type?: string;
}

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

const ResponderDashboard = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  // Only subscribe to alerts when it actually makes sense (prevents loops / needless re-subscribes)
  const isVerified = !!profile?.responder_details?.is_verified;
  const { onDuty, updateDutyStatus, loading: responderLoading } = useResponderData();
  const shouldSubscribeAlerts = isVerified && onDuty;

  const {
    currentLocation,
    locationError,
    calculateDistance,
  } = useResponderLocation();

  const [showProfile, setShowProfile] = useState(false);
  const [sosRequests, setSosRequests] = useState<EmergencyAlert[]>([]);
  const [historyRequests, setHistoryRequests] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ===== helpers (memoized) =====
  const contactUser = useCallback((phone: string) => {
    if (!phone) return;
    window.open(`tel:${phone}`);
  }, []);

  const getAlertTypeColor = useCallback((type: string): string => {
    switch (type) {
      case "medical":
        return "bg-red-100 text-red-800";
      case "safety":
        return "bg-orange-100 text-orange-800";
      case "general":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "acknowledged":
        return "bg-yellow-100 text-yellow-800";
      case "responding":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getAlertIcon = useCallback((type: string) => {
    switch (type) {
      case "medical":
        return <Ambulance className="h-4 w-4" />;
      case "safety":
        return <Shield className="h-4 w-4" />;
      case "general":
        return <Flag className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  }, []);

  const getDistanceToRequest = useCallback(
    (request: EmergencyAlert) => {
      const lat = request.latitude ?? request.location_lat;
      const lng = request.longitude ?? request.location_lng;
      if (!currentLocation || !lat || !lng) return null;
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        Number(lat),
        Number(lng)
      );
      return distance.toFixed(1) + " km";
    },
    [currentLocation, calculateDistance]
  );

  const handleStatusUpdate = async (id: string, status: 'active' | 'acknowledged' | 'responding' | 'completed') => {
    const request = sosRequests.find((req) => req.id === id);
    
    // Optimistic update
    setSosRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
    
    // Move to history if completed
    if (status === 'completed') {
      if (request) {
        setHistoryRequests((prev) => [{ ...request, status }, ...prev]);
      }
      setTimeout(() => {
        setSosRequests((prev) => 
          prev.filter((req) => req.id !== id)
        );
      }, 500);
    }
    
    const updateData: { status: string; responder_id?: string } = { status };
    if (status === 'acknowledged' || status === 'responding') {
      updateData.responder_id = profile?.id;
    }
    
    const { error } = await (supabase
      .from('emergency_alerts' as never)
      .update(updateData as never)
      .eq('id', id) as unknown as { error: { message: string } | null });

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
        'acknowledged': 'Request acknowledged. Responding now.',
        'responding': 'Responding to emergency.',
        'completed': 'Request completed successfully.',
      };
      toast({
        title: 'Status Updated',
        description: statusMessages[status] || `Request marked as ${status}.`,
      });
    }
  };

  // Fetch emergency alerts assigned to this responder
  useEffect(() => {
    const fetchEmergencyAlerts = async () => {
      if (!profile?.id || !shouldSubscribeAlerts) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch emergency alerts assigned to this responder
        const { data, error } = await (supabase
          .from('emergency_alerts' as never)
          .select(`
            *,
            profiles:user_id (
              first_name,
              last_name,
              phone
            )
          ` as never)
          .eq('responder_id', profile.id)
          .order('created_at', { ascending: false }) as unknown as { data: unknown; error: { message: string } | null });

        if (error) throw error;

        if (data) {
          // Map data to include computed fields for UI compatibility
          const mappedData: EmergencyAlert[] = (data as unknown as Array<Record<string, unknown>>).map((alert: Record<string, unknown>) => {
            const baseAlert = alert as unknown as EmergencyAlert;
            const profile = alert.profiles as ProfileData | undefined;
            return {
              ...baseAlert,
              user_name: profile
                ? `${(profile.first_name || '')} ${(profile.last_name || '')}`.trim()
                : 'Unknown User',
              user_phone: profile?.phone || '',
              user_address: (alert.location_description as string) || '',
              latitude: alert.location_lat as number,
              longitude: alert.location_lng as number,
              emergency_type: alert.type as string,
            };
          });

          // Separate active and history
          const active = mappedData.filter(r => r.status !== 'completed');
          const history = mappedData.filter(r => r.status === 'completed');
          setSosRequests(active);
          setHistoryRequests(history);
        }
      } catch (error) {
        console.error('Error fetching emergency alerts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load emergency requests.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyAlerts();

    // Clean up previous subscription if any
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Real-time subscription for emergency alerts
    if (shouldSubscribeAlerts && profile?.id) {
      const channel = supabase
        .channel('realtime:responder_emergency_alerts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'emergency_alerts',
            filter: `responder_id=eq.${profile.id}`,
          },
          async (payload) => {
            const newAlert = payload.new as Record<string, unknown>;
            
            // Fetch profile data for new/updated alerts
            if (newAlert?.user_id) {
              const { data: profileData } = await (supabase
                .from('profiles' as never)
                .select('first_name, last_name, phone')
                .eq('id', newAlert.user_id as string)
                .single() as unknown as { data: ProfileData | null });
              
              const profile = profileData as ProfileData | null;
              const mappedAlert: EmergencyAlert = {
                ...(newAlert as unknown as EmergencyAlert),
                profiles: profile ? {
                  first_name: profile.first_name || '',
                  last_name: profile.last_name || '',
                  phone: profile.phone || '',
                } : undefined,
                user_name: profile 
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : 'Unknown User',
                user_phone: profile?.phone || '',
                user_address: (newAlert.location_description as string) || '',
                latitude: newAlert.location_lat as number,
                longitude: newAlert.location_lng as number,
                emergency_type: newAlert.type as string,
              };
              
              setSosRequests((prev) => {
                let updated = prev;
                if (payload.eventType === 'INSERT') {
                  if (mappedAlert.status !== 'completed') {
                    if (!prev.some((req) => req.id === mappedAlert.id)) {
                      updated = [mappedAlert, ...prev];
                    }
                  }
                } else if (payload.eventType === 'UPDATE') {
                  const isCompleted = mappedAlert.status === 'completed';
                  if (isCompleted) {
                    updated = prev.filter((req) => req.id !== mappedAlert.id);
                  } else {
                    updated = prev.map((req) =>
                      req.id === mappedAlert.id ? mappedAlert : req
                    );
                  }
                } else if (payload.eventType === 'DELETE') {
                  updated = prev.filter((req) => req.id !== (payload.old as { id: string }).id);
                }
                return updated;
              });

              setHistoryRequests((prev) => {
                let updated = prev;
                if (payload.eventType === 'INSERT') {
                  if (mappedAlert.status === 'completed') {
                    if (!prev.some((req) => req.id === mappedAlert.id)) {
                      updated = [mappedAlert, ...prev];
                    }
                  }
                } else if (payload.eventType === 'UPDATE') {
                  const isCompleted = mappedAlert.status === 'completed';
                  if (isCompleted) {
                    updated = prev.map((req) =>
                      req.id === mappedAlert.id ? mappedAlert : req
                    );
                    if (!prev.some((req) => req.id === mappedAlert.id)) {
                      updated = [mappedAlert, ...prev];
                    }
                  } else {
                    updated = prev.filter((req) => req.id !== mappedAlert.id);
                  }
                } else if (payload.eventType === 'DELETE') {
                  updated = prev.filter((req) => req.id !== (payload.old as { id: string }).id);
                }
                return updated;
              });
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [profile?.id, shouldSubscribeAlerts, toast]);

  // Filter requests within 50km radius
  const filterRequestsWithinRadius = useCallback(
    (list: EmergencyAlert[]) => {
      if (!currentLocation) return list;
      return list.filter((request) => {
        const lat = request.latitude ?? request.location_lat;
        const lng = request.longitude ?? request.location_lng;
        if (!lat || !lng) return false;
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          Number(lat),
          Number(lng)
        );
        return distance <= 50;
      });
    },
    [currentLocation, calculateDistance]
  );

  // ===== derived data (memoized) =====
  const visibleRequests = useMemo(() => {
    if (!shouldSubscribeAlerts) return [];
    return filterRequestsWithinRadius(sosRequests);
  }, [sosRequests, filterRequestsWithinRadius, shouldSubscribeAlerts]);

  // ===== loading gate to avoid early mounts thrashing state =====
  const isReady = useMemo(
    () => typeof isVerified !== "undefined" && typeof onDuty !== "undefined",
    [isVerified, onDuty]
  );

  if (!isReady || loading || responderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-red-50/20">
      <ResponderDashboardHeader
        profile={profile as { first_name: string | null; last_name: string | null; responder_details?: { responder_type?: string; is_verified?: boolean; } | null; } | null}
        isVerified={isVerified}
        onDuty={onDuty}
        currentLocation={currentLocation}
        locationError={locationError}
        visibleRequestsCount={visibleRequests.length}
        onProfileClick={() => setShowProfile(true)}
        onSignOut={signOut}
        onDutyStatusChange={updateDutyStatus}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!isVerified && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">
                    Account Pending Verification
                  </h3>
                  <p className="text-yellow-700 text-xs sm:text-sm mt-1">
                    Your responder account is currently being verified. You will
                    receive access to emergency alerts once your credentials are
                    approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Tabs Navigation */}
        <Tabs defaultValue="alerts" className="space-y-6 w-full">
          <ResponderDashboardTabs
            activeRequestsCount={visibleRequests.length}
            historyRequestsCount={historyRequests.length}
          />

          <AlertsTab
            sosRequests={sosRequests}
            historyRequests={historyRequests}
            visibleRequests={visibleRequests}
            isVerified={isVerified}
            onDuty={onDuty}
            currentLocation={currentLocation}
            getDistanceToRequest={getDistanceToRequest}
            getAlertIcon={getAlertIcon}
            getAlertTypeColor={getAlertTypeColor}
            getStatusColor={getStatusColor}
            formatTime={formatTime}
            contactUser={contactUser}
            handleStatusUpdate={handleStatusUpdate}
          />

          <MapTab
            sosRequests={sosRequests}
            historyRequests={historyRequests}
            currentLocation={currentLocation}
          />

          <HistoryTab
            historyRequests={historyRequests}
            getAlertIcon={getAlertIcon}
            getAlertTypeColor={getAlertTypeColor}
            getStatusColor={getStatusColor}
            formatTime={formatTime}
          />

          <ReportsTab />
        </Tabs>
      </div>

      <ResponderProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onProfileUpdate={() => setShowProfile(false)}
      />
    </div>
  );
};

export default ResponderDashboard;
