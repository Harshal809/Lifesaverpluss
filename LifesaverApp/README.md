# Lifesaver React Native App

React Native mobile application for sending SOS and Emergency requests, integrated with the Lifesaver web platform.

## Features

- ✅ User Authentication (Login)
- ✅ SOS Request - Automatically finds nearest hospital within 5km or assigns to responder
- ✅ Emergency Request - Same functionality as SOS
- ✅ Real-time Location Tracking
- ✅ Supabase Integration

## Prerequisites

- Node.js (v20.19.4 or higher recommended)
- npm or yarn
- Expo CLI (installed globally or via npx)
- Expo Go app on your mobile device (for testing)

## Installation

1. Navigate to the app directory:
```bash
cd LifesaverApp
```

2. Install dependencies (already done):
```bash
npm install
```

## Running the App

### For Development

1. Start the Expo development server:
```bash
npm start
```

2. Scan the QR code with:
   - **iOS**: Camera app or Expo Go app
   - **Android**: Expo Go app

### For Android Emulator
```bash
npm run android
```

### For iOS Simulator (macOS only)
```bash
npm run ios
```

### For Web Browser
```bash
npm run web
```

## Project Structure

```
LifesaverApp/
├── App.tsx                 # Main app entry point
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── hooks/
│   └── useLocation.ts      # Location hook
├── lib/
│   ├── supabase.ts         # Supabase client configuration
│   └── utils.ts            # Utility functions (distance calculation)
├── navigation/
│   └── AppNavigator.tsx    # Navigation setup
├── screens/
│   ├── LoginScreen.tsx     # Login screen
│   └── HomeScreen.tsx      # Main dashboard with SOS/Emergency buttons
└── services/
    └── sosService.ts       # SOS and Emergency request logic
```

## How It Works

### SOS Request Flow:
1. User clicks SOS button
2. App gets user's current location
3. Finds hospitals within 5km radius
4. If hospital found → Creates `sos_requests` with `assigned_hospital_id`
5. If no hospital → Finds nearest verified responder → Creates `emergency_alerts` with `responder_id`

### Emergency Request Flow:
Same as SOS Request (currently uses same logic)

## Configuration

The app uses the same Supabase instance as the web app:
- **Supabase URL**: `https://pvmtgkbrvaxcteedpmju.supabase.co`
- **Supabase Anon Key**: Configured in `lib/supabase.ts`

## Permissions

The app requires the following permissions:
- **Location**: Required to send SOS and Emergency requests

These are configured in `app.json` for both iOS and Android.

## Testing

1. Make sure you have a user account in the Supabase database
2. Login with your credentials
3. Grant location permissions when prompted
4. Test SOS and Emergency request buttons

## Troubleshooting

### Location not working:
- Make sure location permissions are granted
- Check if location services are enabled on your device
- Try refreshing location using the retry button

### Login issues:
- Verify your credentials are correct
- Check if your user exists in the `profiles` table
- Ensure Supabase connection is working

### Build errors:
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Notes

- The app uses Expo SecureStore for secure token storage
- Location is fetched using Expo Location API
- All requests are sent to the same Supabase database as the web app

