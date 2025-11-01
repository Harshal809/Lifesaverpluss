import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BloodDonor {
  id: string;
  user_id: string;
  blood_group: string;
  is_available: boolean;
  last_donation_date: string | null;
  next_available_date: string | null;
  donation_count: number;
  phone: string | null;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  health_declaration: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export const useBloodDonor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [donorProfile, setDonorProfile] = useState<BloodDonor | null>(null);
  const [isDonor, setIsDonor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsDonor(false);
      setLoading(false);
      return;
    }

    fetchDonorProfile();

    // Real-time subscription
    const channel = supabase
      .channel('blood_donor_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blood_donors',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDonorProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchDonorProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('blood_donors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching donor profile:', error);
        setIsDonor(false);
        setDonorProfile(null);
      } else if (data) {
        setDonorProfile(data);
        setIsDonor(true);
      } else {
        setIsDonor(false);
        setDonorProfile(null);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsDonor(false);
    } finally {
      setLoading(false);
    }
  };

  const registerAsDonor = async (donorData: {
    blood_group: string;
    phone?: string;
    location_lat?: number;
    location_lng?: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    health_declaration: boolean;
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
        .from('blood_donors')
        .insert([
          {
            user_id: user.id,
            ...donorData,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setDonorProfile(data);
      setIsDonor(true);

      toast({
        title: 'Success',
        description: 'You are now registered as a blood donor!',
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error registering as donor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to register as donor',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const updateDonorProfile = async (updates: Partial<BloodDonor>) => {
    if (!user || !isDonor) {
      toast({
        title: 'Error',
        description: 'You are not registered as a donor',
        variant: 'destructive',
      });
      return { error: 'Not a donor' };
    }

    try {
      const { data, error } = await supabase
        .from('blood_donors')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setDonorProfile(data);

      toast({
        title: 'Success',
        description: 'Donor profile updated successfully',
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating donor profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const canDonate = () => {
    if (!donorProfile) return false;
    if (!donorProfile.is_available) return false;
    if (!donorProfile.next_available_date) return true;
    return new Date(donorProfile.next_available_date) <= new Date();
  };

  return {
    isDonor,
    donorProfile,
    loading,
    canDonate: canDonate(),
    registerAsDonor,
    updateDonorProfile,
    refetch: fetchDonorProfile,
  };
};

