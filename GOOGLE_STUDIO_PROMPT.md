# 🚀 React Native SOS Emergency App - Google Studio Generation Prompt

## Complete Prompt for Google Studio (Gemini)

Copy and paste this entire prompt into Google Studio to generate a complete React Native SOS Emergency App:

---

```
Create a complete React Native SOS Emergency App with the following specifications:

## PROJECT REQUIREMENTS

### 1. TECHNOLOGY STACK
- React Native (Expo or CLI)
- Supabase for backend (authentication + database)
- React Navigation for routing
- React Native Geolocation for location services
- TypeScript (optional but preferred)

### 2. DATABASE SCHEMA (Supabase)

#### Table 1: profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  user_type TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'responder' | 'hospital'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table 2: hospital_profiles
```sql
CREATE TABLE hospital_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  is_available BOOLEAN DEFAULT true,
  specialties TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table 3: sos_requests
```sql
CREATE TABLE sos_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  emergency_type TEXT NOT NULL,  -- 'medical' | 'safety' | 'general'
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'active' | 'resolved'
  assigned_hospital_id UUID REFERENCES hospital_profiles(id),
  user_address TEXT,
  notes TEXT,
  estimated_arrival TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table 4: emergency_alerts
```sql
CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'medical' | 'safety' | 'general'
  description TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_description TEXT,
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'acknowledged' | 'responding' | 'completed'
  responder_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table 5: responder_details
```sql
CREATE TABLE responder_details (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  responder_type TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_on_duty BOOLEAN DEFAULT false,
  current_location JSONB,  -- Format: "(longitude,latitude)" string or JSON object
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. AUTHENTICATION
- User login only (email + password)
- Use Supabase Auth
- After login, store user session
- No registration needed (assume users are pre-registered)

### 4. CORE FEATURES

#### Feature 1: SOS Button Screen
- Large red SOS button (circular, prominent)
- Three emergency types: Medical, Safety, General
- When clicked:
  1. Get user's current GPS location
  2. Calculate distance to all hospitals using Haversine formula
  3. Find hospitals within 5km radius
  4. If hospital found → Create sos_requests with assigned_hospital_id
  5. If no hospital → Find nearest verified responder (is_verified=true, is_on_duty=true) → Create emergency_alerts with responder_id
  6. Show success/error message

#### Feature 2: Emergency History Screen
- List all user's sos_requests (from sos_requests table where user_id = current_user.id)
- List all user's emergency_alerts (from emergency_alerts table where user_id = current_user.id)
- Show: Type, Status, Location, Timestamp
- Pull to refresh

#### Feature 3: Profile Screen
- Display user info (name, email, phone)
- Logout button

### 5. HAVERSINE DISTANCE CALCULATION

Implement this exact function:
```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}
```

### 6. SOS REQUEST FLOW

Complete flow implementation:

```javascript
async function sendSOSRequest(emergencyType) {
  // Step 1: Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Step 2: Get user location
  const location = await getUserLocation(); // Use React Native Geolocation
  const { latitude: userLat, longitude: userLng } = location;

  // Step 3: Fetch all hospitals
  const { data: hospitals } = await supabase
    .from('hospital_profiles')
    .select('id, latitude, longitude, hospital_name')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  let assignedHospitalId = null;
  let assignedResponderId = null;

  // Step 4: Find hospitals within 5km
  if (hospitals && hospitals.length > 0) {
    const hospitalsWithDistance = hospitals.map((hospital) => ({
      ...hospital,
      distance: calculateDistance(userLat, userLng, hospital.latitude, hospital.longitude)
    }));

    const nearbyHospitals = hospitalsWithDistance.filter(h => h.distance <= 5);
    
    if (nearbyHospitals.length > 0) {
      const nearestHospital = nearbyHospitals.sort((a, b) => a.distance - b.distance)[0];
      assignedHospitalId = nearestHospital.id;
    }
  }

  // Step 5: If no hospital, find responder
  if (!assignedHospitalId) {
    const { data: responders } = await supabase
      .from('responder_details')
      .select('id, current_location, is_verified, is_on_duty')
      .eq('is_verified', true)
      .eq('is_on_duty', true);

    if (responders && responders.length > 0) {
      const respondersWithDistance = responders
        .map((responder) => {
          // Parse current_location: "(lng,lat)" format
          const locationStr = responder.current_location;
          const match = locationStr?.match(/\(([^,]+),([^)]+)\)/);
          if (!match) return null;
          
          const responderLat = parseFloat(match[2]);
          const responderLng = parseFloat(match[1]);
          
          return {
            ...responder,
            distance: calculateDistance(userLat, userLng, responderLat, responderLng)
          };
        })
        .filter(r => r !== null);

      if (respondersWithDistance.length > 0) {
        const nearestResponder = respondersWithDistance.sort((a, b) => a.distance - b.distance)[0];
        assignedResponderId = nearestResponder.id;
      }
    }
  }

  // Step 6: Create request
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
      assigned_hospital_id: assignedHospitalId
    });
    if (error) throw error;
    return { success: true, type: 'hospital' };
    
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
      responder_id: assignedResponderId
    });
    if (error) throw error;
    return { success: true, type: 'responder' };
    
  } else {
    throw new Error('No hospital or responder available');
  }
}
```

### 7. UI REQUIREMENTS

#### Screen 1: Login Screen
- Email input
- Password input
- Login button
- Error message display

#### Screen 2: Home Screen (SOS Button)
- Large red circular SOS button (centered)
- Three buttons below: Medical, Safety, General
- Loading indicator when processing
- Success/Error toast messages
- Bottom navigation: Home | History | Profile

#### Screen 3: History Screen
- Tab 1: SOS Requests (from sos_requests table)
- Tab 2: Emergency Alerts (from emergency_alerts table)
- Each item shows:
  - Emergency type badge
  - Status badge
  - Location (lat, lng)
  - Timestamp
  - Hospital/Responder assigned (if available)
- Pull to refresh
- Empty state message

#### Screen 4: Profile Screen
- User name
- Email
- Phone
- Logout button

### 8. SUPABASE CONFIGURATION

Create a config file:
```javascript
// config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 9. LOCATION PERMISSIONS

Handle location permissions properly:
- Request location permission on app start
- Show error if permission denied
- Use React Native Geolocation or Expo Location

### 10. PACKAGE.JSON DEPENDENCIES

Required packages:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.78.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    "react-native": "latest",
    "react-native-geolocation-service": "^5.3.1",
    "react-native-vector-icons": "^10.0.0"
  }
}
```

### 11. FILE STRUCTURE

```
src/
  ├── screens/
  │   ├── LoginScreen.js
  │   ├── HomeScreen.js (SOS Button)
  │   ├── HistoryScreen.js
  │   └── ProfileScreen.js
  ├── services/
  │   ├── supabase.js
  │   ├── location.js
  │   └── sosService.js
  ├── utils/
  │   └── distance.js (Haversine formula)
  ├── navigation/
  │   └── AppNavigator.js
  └── App.js
```

### 12. KEY COLUMNS REFERENCE

**User ID Storage:**
- `sos_requests.user_id` - User who created SOS
- `emergency_alerts.user_id` - User who created alert

**Hospital ID Storage:**
- `sos_requests.assigned_hospital_id` - Hospital assigned (within 5km)

**Responder ID Storage:**
- `emergency_alerts.responder_id` - Responder assigned (when no hospital within 5km)

### 13. ERROR HANDLING

- Handle network errors
- Handle location permission denied
- Handle Supabase errors
- Show user-friendly error messages

### 14. STYLING

- Modern, clean UI
- Red color for SOS button (#FF0000 or #DC2626)
- Card-based layout for history items
- Professional color scheme

### 15. ADDITIONAL REQUIREMENTS

- Use async/await for all async operations
- Implement loading states
- Implement error states
- Add proper TypeScript types if using TypeScript
- Follow React Native best practices
- Add proper error boundaries
- Implement proper navigation guards (require authentication)

## GENERATION INSTRUCTIONS

Generate a complete, production-ready React Native app with:
1. All screens implemented
2. All database queries implemented
3. Complete SOS flow with 5km logic
4. Proper error handling
5. Clean, maintainable code
6. Proper file structure
7. All dependencies listed
8. README with setup instructions

The app should be ready to run after:
1. npm install
2. Configure Supabase URL and keys
3. Run the app

Generate the complete codebase now.
```

---

## 📝 How to Use This Prompt

1. **Copy the entire prompt** (everything between the triple backticks)
2. **Open Google Studio (Gemini)**
3. **Paste the prompt**
4. **Generate the app**
5. **Review and customize** as needed

## 🔧 Post-Generation Steps

After generating the app:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Update `config/supabase.js` with your Supabase URL and anon key
   - Run the SQL migrations in your Supabase dashboard

3. **Set up location permissions:**
   - For Expo: Add location permissions in `app.json`
   - For React Native CLI: Update `AndroidManifest.xml` and `Info.plist`

4. **Test the app:**
   ```bash
   npm start
   # or
   expo start
   ```

## 📋 Checklist

- [ ] All 5 database tables created in Supabase
- [ ] Supabase URL and keys configured
- [ ] Location permissions granted
- [ ] User can login
- [ ] SOS button works
- [ ] 5km logic calculates correctly
- [ ] History screen shows requests
- [ ] Profile screen works
- [ ] Error handling implemented

---

**Ready to generate!** 🚀

