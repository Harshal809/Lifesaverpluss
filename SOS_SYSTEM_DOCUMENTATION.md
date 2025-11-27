# 🚨 SOS Emergency System - Complete Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Request Flow & Logic](#request-flow--logic)
4. [5km Radius Logic](#5km-radius-logic)
5. [API Queries & Parameters](#api-queries--parameters)
6. [React Native Implementation Guide](#react-native-implementation-guide)

---

## 🎯 System Overview

This SOS system uses **two main tables** to handle emergency requests:

1. **`sos_requests`** - For hospital-based emergencies (when hospital is within 5km)
2. **`emergency_alerts`** - For responder-based emergencies (when no hospital within 5km)

### Decision Flow:
```
User Triggers SOS
    ↓
Get User Location (lat, lng)
    ↓
Find Hospitals within 5km
    ↓
Hospital Found? 
    ├─ YES → Create sos_requests (assigned_hospital_id)
    └─ NO  → Find Nearest Responder → Create emergency_alerts (responder_id)
```

---

## 🗄️ Database Schema

### 1. **profiles** Table (User Authentication)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- User ID (from auth.users)
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  user_type TEXT NOT NULL,          -- 'user' | 'responder' | 'hospital'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Columns:**
- `id` - **User ID** (UUID, references auth.users)
- `user_type` - Determines user role

---

### 2. **hospital_profiles** Table
```sql
CREATE TABLE hospital_profiles (
  id UUID PRIMARY KEY,              -- Hospital ID (references profiles.id)
  hospital_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  latitude NUMERIC NOT NULL,        -- Hospital latitude
  longitude NUMERIC NOT NULL,      -- Hospital longitude
  is_available BOOLEAN DEFAULT true,
  specialties TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Columns:**
- `id` - **Hospital ID** (UUID, references profiles.id)
- `latitude` - Hospital location latitude
- `longitude` - Hospital location longitude

---

### 3. **sos_requests** Table (Hospital-Based Emergencies)
```sql
CREATE TABLE sos_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                    -- ✅ USER ID (references profiles.id)
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  latitude NUMERIC NOT NULL,                -- User's emergency location
  longitude NUMERIC NOT NULL,               -- User's emergency location
  emergency_type TEXT NOT NULL,             -- 'medical' | 'safety' | 'general'
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'pending' | 'resolved'
  assigned_hospital_id UUID,                -- ✅ HOSPITAL ID (references hospital_profiles.id)
  user_address TEXT,
  notes TEXT,
  estimated_arrival TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Columns:**
- `user_id` - **User ID** who created the SOS
- `assigned_hospital_id` - **Hospital ID** assigned to handle this request
- `latitude`, `longitude` - User's emergency location
- `status` - Request status

---

### 4. **emergency_alerts** Table (Responder-Based Emergencies)
```sql
CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,                    -- ✅ USER ID (references profiles.id)
  type TEXT NOT NULL,                       -- 'medical' | 'safety' | 'general'
  description TEXT,
  location_lat NUMERIC,                     -- User's emergency location
  location_lng NUMERIC,                     -- User's emergency location
  location_description TEXT,
  status TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'acknowledged' | 'responding' | 'completed'
  responder_id UUID,                        -- ✅ RESPONDER ID (references profiles.id)
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Columns:**
- `user_id` - **User ID** who created the alert
- `responder_id` - **Responder ID** assigned to handle this alert
- `location_lat`, `location_lng` - User's emergency location
- `status` - Alert status

---

### 5. **responder_details** Table
```sql
CREATE TABLE responder_details (
  id UUID PRIMARY KEY,                      -- Responder ID (references profiles.id)
  badge_id TEXT NOT NULL,
  responder_type TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_on_duty BOOLEAN DEFAULT false,
  current_location JSONB,                   -- Format: "(longitude,latitude)" or JSON object
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Columns:**
- `id` - **Responder ID** (UUID, references profiles.id)
- `current_location` - Responder's current location (string format: "(lng,lat)" or JSONB)
- `is_verified` - Must be true for responder to receive alerts
- `is_on_duty` - Must be true for responder to receive alerts

---

## 🔄 Request Flow & Logic

### Step-by-Step SOS Request Flow:

#### **Step 1: User Triggers SOS**
```javascript
// User clicks SOS button
// Get user's current location
navigator.geolocation.getCurrentPosition((position) => {
  const userLat = position.coords.latitude;
  const userLng = position.coords.longitude;
  
  // Proceed to Step 2
});
```

#### **Step 2: Fetch All Hospitals**
```javascript
const { data: hospitals } = await supabase
  .from('hospital_profiles')
  .select('id, latitude, longitude, hospital_name')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null);
```

#### **Step 3: Calculate Distances & Find Hospitals within 5km**
```javascript
// Calculate distance for each hospital
const hospitalsWithDistance = hospitals.map((hospital) => ({
  ...hospital,
  distance: calculateDistance(
    userLat, userLng,
    hospital.latitude, hospital.longitude
  )
}));

// Filter hospitals within 5km
const nearbyHospitals = hospitalsWithDistance.filter(h => h.distance <= 5);

if (nearbyHospitals.length > 0) {
  // Sort by distance, get nearest
  const nearestHospital = nearbyHospitals.sort((a, b) => a.distance - b.distance)[0];
  // Proceed to Step 4A
} else {
  // Proceed to Step 4B
}
```

#### **Step 4A: Create sos_requests (Hospital Found)**
```javascript
const sosData = {
  user_id: user.id,                          // ✅ User ID
  user_name: `${user.first_name} ${user.last_name}`,
  user_phone: user.phone || 'Not provided',
  latitude: userLat,                         // User's location
  longitude: userLng,                        // User's location
  emergency_type: 'medical',                 // 'medical' | 'safety' | 'general'
  description: 'Emergency SOS request',
  user_address: 'Current Location',
  status: 'pending',
  assigned_hospital_id: nearestHospital.id   // ✅ Hospital ID
};

const { error } = await supabase
  .from('sos_requests')
  .insert(sosData);
```

#### **Step 4B: Create emergency_alerts (No Hospital Found)**
```javascript
// First, find nearest verified responder who is on duty
const { data: responders } = await supabase
  .from('responder_details')
  .select('id, current_location, is_verified, is_on_duty')
  .eq('is_verified', true)
  .eq('is_on_duty', true);

// Parse responder locations and calculate distances
const respondersWithDistance = responders
  .map((responder) => {
    // Parse current_location: "(lng,lat)" format
    const location = parseLocationString(responder.current_location);
    if (!location) return null;
    
    return {
      ...responder,
      distance: calculateDistance(userLat, userLng, location.lat, location.lng)
    };
  })
  .filter(r => r !== null);

// Get nearest responder
const nearestResponder = respondersWithDistance
  .sort((a, b) => a.distance - b.distance)[0];

// Create emergency_alerts
const alertData = {
  user_id: user.id,                          // ✅ User ID
  type: 'medical',                           // 'medical' | 'safety' | 'general'
  description: 'Emergency SOS request',
  location_lat: userLat,                     // User's location
  location_lng: userLng,                     // User's location
  location_description: 'Current Location',
  status: 'active',
  responder_id: nearestResponder.id          // ✅ Responder ID
};

const { error } = await supabase
  .from('emergency_alerts')
  .insert(alertData);
```

---

## 📏 5km Radius Logic

### Haversine Distance Formula

The system uses the **Haversine formula** to calculate distance between two GPS coordinates:

```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  // Haversine formula
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}
```

### Logic Flow:

1. **Calculate distance** from user to each hospital
2. **Filter hospitals** where `distance <= 5` km
3. **If hospitals found:**
   - Sort by distance (nearest first)
   - Assign to nearest hospital
   - Create `sos_requests` with `assigned_hospital_id`
4. **If NO hospitals found:**
   - Find nearest verified responder (on duty)
   - Create `emergency_alerts` with `responder_id`

---

## 🔌 API Queries & Parameters

### 1. Create SOS Request (Hospital-Based)

**Table:** `sos_requests`

**Parameters:**
```javascript
{
  user_id: "uuid",                    // Required: Current user's ID
  user_name: "John Doe",              // Required: User's full name
  user_phone: "+1234567890",          // Required: User's phone
  latitude: 18.5925785,               // Required: User's lat
  longitude: 73.7183639,              // Required: User's lng
  emergency_type: "medical",          // Required: 'medical' | 'safety' | 'general'
  description: "Emergency description", // Optional
  user_address: "Current Location",   // Optional
  status: "pending",                  // Default: 'pending'
  assigned_hospital_id: "uuid"        // Required: Nearest hospital ID (within 5km)
}
```

**Query:**
```javascript
const { data, error } = await supabase
  .from('sos_requests')
  .insert({
    user_id: user.id,
    user_name: `${user.first_name} ${user.last_name}`,
    user_phone: user.phone,
    latitude: userLat,
    longitude: userLng,
    emergency_type: 'medical',
    description: 'Emergency SOS request',
    assigned_hospital_id: nearestHospital.id
  });
```

---

### 2. Create Emergency Alert (Responder-Based)

**Table:** `emergency_alerts`

**Parameters:**
```javascript
{
  user_id: "uuid",                    // Required: Current user's ID
  type: "medical",                    // Required: 'medical' | 'safety' | 'general'
  location_lat: 18.5925785,           // Required: User's lat
  location_lng: 73.7183639,          // Required: User's lng
  location_description: "Current Location", // Optional
  description: "Emergency description",     // Optional
  status: "active",                   // Default: 'active'
  responder_id: "uuid"                // Required: Nearest responder ID
}
```

**Query:**
```javascript
const { data, error } = await supabase
  .from('emergency_alerts')
  .insert({
    user_id: user.id,
    type: 'medical',
    location_lat: userLat,
    location_lng: userLng,
    location_description: 'Current Location',
    description: 'Emergency SOS request',
    status: 'active',
    responder_id: nearestResponder.id
  });
```

---

### 3. Fetch User's SOS Requests

**Query:**
```javascript
const { data: sosRequests } = await supabase
  .from('sos_requests')
  .select('*')
  .eq('user_id', user.id)              // Filter by user_id
  .order('created_at', { ascending: false });
```

---

### 4. Fetch User's Emergency Alerts

**Query:**
```javascript
const { data: alerts } = await supabase
  .from('emergency_alerts')
  .select(`
    *,
    profiles:user_id (
      first_name,
      last_name,
      phone
    )
  `)
  .eq('user_id', user.id)              // Filter by user_id
  .order('created_at', { ascending: false });
```

---

### 5. Fetch Hospitals within 5km

**Query:**
```javascript
// Step 1: Fetch all hospitals
const { data: hospitals } = await supabase
  .from('hospital_profiles')
  .select('id, latitude, longitude, hospital_name')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null);

// Step 2: Calculate distances (client-side)
const nearbyHospitals = hospitals
  .map(h => ({
    ...h,
    distance: calculateDistance(userLat, userLng, h.latitude, h.longitude)
  }))
  .filter(h => h.distance <= 5)        // Filter within 5km
  .sort((a, b) => a.distance - b.distance);
```

---

### 6. Fetch Responders (for emergency_alerts)

**Query:**
```javascript
const { data: responders } = await supabase
  .from('responder_details')
  .select('id, current_location, is_verified, is_on_duty')
  .eq('is_verified', true)             // Only verified responders
  .eq('is_on_duty', true);             // Only on-duty responders
```

---

## 📱 React Native Implementation Guide

### Prerequisites

1. **Supabase Setup:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Location Services:**
   ```bash
   npm install @react-native-community/geolocation
   # or
   npm install expo-location
   ```

### Step 1: Initialize Supabase Client

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 2: User Authentication (Login Only)

```javascript
// Login function
const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error) throw error;
  return data.user;
};

// Get current user
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
```

### Step 3: Get User Location

```javascript
import Geolocation from '@react-native-community/geolocation';

const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};
```

### Step 4: Calculate Distance (Haversine)

```javascript
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};
```

### Step 5: Complete SOS Request Function

```javascript
const sendSOSRequest = async (emergencyType = 'medical') => {
  try {
    // 1. Get current user
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // 2. Get user location
    const userLocation = await getUserLocation();
    const { latitude: userLat, longitude: userLng } = userLocation;

    // 3. Fetch all hospitals
    const { data: hospitals, error: hospitalError } = await supabase
      .from('hospital_profiles')
      .select('id, latitude, longitude, hospital_name')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (hospitalError) throw hospitalError;

    let assignedHospitalId = null;
    let assignedResponderId = null;

    // 4. Find hospitals within 5km
    if (hospitals && hospitals.length > 0) {
      const hospitalsWithDistance = hospitals.map((hospital) => ({
        ...hospital,
        distance: calculateDistance(
          userLat, userLng,
          hospital.latitude, hospital.longitude
        ),
      }));

      const nearbyHospitals = hospitalsWithDistance.filter(h => h.distance <= 5);

      if (nearbyHospitals.length > 0) {
        const nearestHospital = nearbyHospitals.sort((a, b) => a.distance - b.distance)[0];
        assignedHospitalId = nearestHospital.id;
      }
    }

    // 5. If no hospital, find responder
    if (!assignedHospitalId) {
      const { data: responders } = await supabase
        .from('responder_details')
        .select('id, current_location, is_verified, is_on_duty')
        .eq('is_verified', true)
        .eq('is_on_duty', true);

      if (responders && responders.length > 0) {
        // Parse responder location (format: "(lng,lat)")
        const respondersWithDistance = responders
          .map((responder) => {
            const locationStr = responder.current_location;
            // Parse "(lng,lat)" format
            const match = locationStr.match(/\(([^,]+),([^)]+)\)/);
            if (!match) return null;
            
            const responderLat = parseFloat(match[2]);
            const responderLng = parseFloat(match[1]);
            
            return {
              ...responder,
              distance: calculateDistance(userLat, userLng, responderLat, responderLng),
            };
          })
          .filter(r => r !== null);

        if (respondersWithDistance.length > 0) {
          const nearestResponder = respondersWithDistance.sort((a, b) => a.distance - b.distance)[0];
          assignedResponderId = nearestResponder.id;
        }
      }
    }

    // 6. Create request based on assignment
    if (assignedHospitalId) {
      // Create sos_requests
      const { error } = await supabase.from('sos_requests').insert({
        user_id: user.id,
        user_name: `${user.user_metadata?.first_name || 'User'} ${user.user_metadata?.last_name || ''}`.trim(),
        user_phone: user.user_metadata?.phone || 'Not provided',
        latitude: userLat,
        longitude: userLng,
        emergency_type: emergencyType,
        description: 'Emergency SOS request',
        user_address: 'Current Location',
        status: 'pending',
        assigned_hospital_id: assignedHospitalId,
      });

      if (error) throw error;
      return { success: true, type: 'hospital', hospitalId: assignedHospitalId };
      
    } else if (assignedResponderId) {
      // Create emergency_alerts
      const { error } = await supabase.from('emergency_alerts').insert({
        user_id: user.id,
        type: emergencyType,
        description: 'Emergency SOS request',
        location_lat: userLat,
        location_lng: userLng,
        location_description: 'Current Location',
        status: 'active',
        responder_id: assignedResponderId,
      });

      if (error) throw error;
      return { success: true, type: 'responder', responderId: assignedResponderId };
      
    } else {
      throw new Error('No hospital or responder available');
    }
    
  } catch (error) {
    console.error('SOS Request Error:', error);
    throw error;
  }
};
```

### Step 6: Fetch User's Emergency History

```javascript
// Fetch sos_requests
const getSOSRequests = async () => {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('sos_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Fetch emergency_alerts
const getEmergencyAlerts = async () => {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('emergency_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};
```

### Step 7: Real-time Updates (Optional)

```javascript
// Subscribe to real-time updates
const subscribeToAlerts = (userId, callback) => {
  const channel = supabase
    .channel('user_emergency_alerts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'emergency_alerts',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

---

## 📊 Summary: Key Points

### **User ID Assignment:**
- **`sos_requests.user_id`** - Stores the user who created the SOS
- **`emergency_alerts.user_id`** - Stores the user who created the alert

### **Hospital ID Assignment:**
- **`sos_requests.assigned_hospital_id`** - Stores the hospital assigned (within 5km)

### **Responder ID Assignment:**
- **`emergency_alerts.responder_id`** - Stores the responder assigned (when no hospital within 5km)

### **5km Logic:**
1. Calculate distance using Haversine formula
2. Filter hospitals where `distance <= 5` km
3. If found → `sos_requests` with `assigned_hospital_id`
4. If not found → `emergency_alerts` with `responder_id`

### **Required Parameters for SOS:**
- `user_id` (from authenticated user)
- `latitude`, `longitude` (user's current location)
- `emergency_type` ('medical' | 'safety' | 'general')
- `assigned_hospital_id` OR `responder_id` (based on 5km logic)

---

## 🚀 Quick Start for React Native

1. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js @react-native-community/geolocation
   ```

2. **Copy the functions above** (calculateDistance, sendSOSRequest, etc.)

3. **Add SOS button in your UI:**
   ```javascript
   <Button onPress={() => sendSOSRequest('medical')}>
     Send SOS
   </Button>
   ```

4. **Handle location permissions** in your app manifest/config

---

## 📝 Notes

- **Distance calculation** must be done **client-side** (not in Supabase query)
- **5km radius** is hardcoded in the filter logic
- **Responder location** is stored as string: `"(longitude,latitude)"` format
- **Real-time subscriptions** require Supabase Realtime to be enabled
- **RLS (Row Level Security)** policies control who can read/write data

---

**End of Documentation**

