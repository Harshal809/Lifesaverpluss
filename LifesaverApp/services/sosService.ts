import { supabase } from '../lib/supabase';
import { calculateDistance, parseResponderLocation } from '../lib/utils';

interface Location {
  latitude: number;
  longitude: number;
}

type EmergencyType = 'medical' | 'safety' | 'general';

interface SOSResult {
  success: boolean;
  type?: 'hospital' | 'responder';
  error?: string;
}

export const sendSOSRequest = async (
  emergencyType: EmergencyType = 'medical',
  location: Location
): Promise<SOSResult> => {
  try {
    const { latitude: userLat, longitude: userLng } = location;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Step 1: Fetch all available hospitals
    const { data: hospitals, error: hospitalError } = await supabase
      .from('hospital_profiles')
      .select('id, latitude, longitude, hospital_name')
      .eq('is_available', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (hospitalError) {
      return { success: false, error: `Failed to fetch hospitals: ${hospitalError.message}` };
    }

    let assignedHospitalId: string | null = null;

    // Step 2: Find nearest hospital within 5km
    if (hospitals && hospitals.length > 0) {
      const hospitalsWithDistance = hospitals.map((hospital) => ({
        ...hospital,
        distance: calculateDistance(
          userLat,
          userLng,
          Number(hospital.latitude),
          Number(hospital.longitude)
        ),
      }));

      const nearbyHospitals = hospitalsWithDistance.filter((h) => h.distance <= 5);

      if (nearbyHospitals.length > 0) {
        const nearestHospital = nearbyHospitals.sort((a, b) => a.distance - b.distance)[0];
        assignedHospitalId = nearestHospital.id;
      }
    }

    // Step 3: If hospital found, create sos_request
    if (assignedHospitalId) {
      const { error: sosError } = await supabase.from('sos_requests').insert({
        user_id: user.id,
        user_name: `${userProfile?.first_name || 'User'} ${userProfile?.last_name || ''}`.trim(),
        user_phone: userProfile?.phone || 'Not provided',
        latitude: userLat,
        longitude: userLng,
        emergency_type: emergencyType,
        description: 'Emergency SOS request from mobile app.',
        user_address: 'Current Location',
        status: 'pending',
        assigned_hospital_id: assignedHospitalId,
      });

      if (sosError) {
        return { success: false, error: `Failed to create SOS request: ${sosError.message}` };
      }
      return { success: true, type: 'hospital' };
    }

    // Step 4: If no hospital, find nearest responder
    const { data: responders, error: responderError } = await supabase
      .from('responder_details')
      .select('*')
      .eq('is_verified', true)
      .eq('is_on_duty', true);

    if (responderError) {
      return { success: false, error: `Failed to fetch responders: ${responderError.message}` };
    }

    let assignedResponderId: string | null = null;

    if (responders && responders.length > 0) {
      const respondersWithDistance = responders
        .map((responder) => {
          const responderLoc = parseResponderLocation(responder.current_location);
          if (!responderLoc) return null;

          return {
            ...responder,
            distance: calculateDistance(userLat, userLng, responderLoc.lat, responderLoc.lng),
          };
        })
        .filter((r) => r !== null);

      if (respondersWithDistance.length > 0) {
        const nearestResponder = respondersWithDistance.sort(
          (a, b) => a.distance - b.distance
        )[0];
        assignedResponderId = nearestResponder.id;
      }
    }

    // Step 5: If responder found, create emergency_alert
    if (assignedResponderId) {
      const { error: alertError } = await supabase.from('emergency_alerts').insert({
        user_id: user.id,
        type: emergencyType,
        description: 'Emergency SOS request from mobile app.',
        location_lat: userLat,
        location_lng: userLng,
        location_description: 'Current Location',
        status: 'active',
        responder_id: assignedResponderId,
      });

      if (alertError) {
        return { success: false, error: `Failed to create emergency alert: ${alertError.message}` };
      }
      return { success: true, type: 'responder' };
    }

    return { success: false, error: 'No hospital or responder available' };
  } catch (error: any) {
    console.error('SOS Request Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
};

export const sendEmergencyRequest = async (
  emergencyType: EmergencyType = 'medical',
  location: Location,
  description?: string
): Promise<SOSResult> => {
  // For now, emergency request uses the same logic as SOS
  // You can customize this later if needed
  return sendSOSRequest(emergencyType, location);
};

