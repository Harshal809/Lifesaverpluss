import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration - using the same as web app
const SUPABASE_URL = 'https://pvmtgkbrvaxcteedpmju.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bXRna2JydmF4Y3RlZWRwbWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDY0NDcsImV4cCI6MjA3NzQ4MjQ0N30.ava6N29WOfuZM8Nvv_PCBfD44nAenLswU6Yz6VRs0Iw';

// Detect web vs native (Expo native has no window/document)
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Storage adapter for web – use localStorage (works in browser, including Expo web)
const WebStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// Storage adapter for native – use Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const storage = isWeb ? WebStorageAdapter : ExpoSecureStoreAdapter;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});


