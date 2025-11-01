import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BloodRequest {
  id: string;
  requester_id: string;
  requester_type: 'user' | 'hospital';
  hospital_id: string | null;
  blood_group: string;
  units_required: number;
  units_received: number;
  urgency_level: 'normal' | 'urgent' | 'critical';
  patient_name: string | null;
  patient_age: number | null;
  patient_condition: string | null;
  hospital_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  description: string | null;
  status: 'active' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired';
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
  fulfilled_at: string | null;
  // Joined data
  requester_name?: string;
  requester_phone?: string;
}

export const useBloodRequests = (filters?: {
  status?: string[];
  blood_group?: string;
  requester_type?: string;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [user, filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blood_requests')
        .select(`
          *,
          requester:profiles!blood_requests_requester_id_fkey(first_name, last_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.blood_group) {
        query = query.eq('blood_group', filters.blood_group);
      }

      if (filters?.requester_type) {
        query = query.eq('requester_type', filters.requester_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data || []).map((req: any) => ({
        ...req,
        requester_name: req.requester
          ? `${req.requester.first_name || ''} ${req.requester.last_name || ''}`.trim()
          : null,
        requester_phone: req.requester?.phone || null,
      }));

      setRequests(formatted);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch blood requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (requestData: {
    blood_group: string;
    units_required: number;
    urgency_level: 'normal' | 'urgent' | 'critical';
    patient_name?: string;
    patient_age?: number;
    patient_condition?: string;
    hospital_name?: string;
    location_lat?: number;
    location_lng?: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contact_name: string;
    contact_phone: string;
    contact_email?: string;
    description?: string;
    expiry_date?: string;
  }) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return { error: 'User not authenticated' };
    }

    try {
      const { data, error } = await supabase
        .from('blood_requests')
        .insert([
          {
            requester_id: user.id,
            requester_type: 'user',
            ...requestData,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Blood request created successfully',
      });

      fetchRequests();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateRequest = async (requestId: string, updates: Partial<BloodRequest>) => {
    try {
      const { data, error } = await supabase
        .from('blood_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Request updated successfully',
      });

      fetchRequests();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update request',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const cancelRequest = async (requestId: string) => {
    return updateRequest(requestId, { status: 'cancelled' });
  };

  return {
    requests,
    loading,
    createRequest,
    updateRequest,
    cancelRequest,
    refetch: fetchRequests,
  };
};

