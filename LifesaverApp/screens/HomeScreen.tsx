import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { sendSOSRequest, sendEmergencyRequest } from '../services/sosService';

type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  EmergencyContacts: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, profile, signOut } = useAuth();
  const { location, loading: locationLoading, refreshLocation } = useLocation();
  const [sosLoading, setSosLoading] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  const handleSOS = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait for location to be fetched.');
      await refreshLocation();
      return;
    }

    setSosLoading(true);
    try {
      const result = await sendSOSRequest('medical', location);
      if (result.success) {
        Alert.alert(
          'SOS Sent!',
          result.type === 'hospital'
            ? 'Your SOS request has been sent to the nearest hospital.'
            : 'Your SOS request has been sent to the nearest responder.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send SOS request');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send SOS request');
    } finally {
      setSosLoading(false);
    }
  };

  const handleEmergency = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please wait for location to be fetched.');
      await refreshLocation();
      return;
    }

    setEmergencyLoading(true);
    try {
      const result = await sendEmergencyRequest('medical', location);
      if (result.success) {
        Alert.alert(
          'Emergency Request Sent!',
          result.type === 'hospital'
            ? 'Your emergency request has been sent to the nearest hospital.'
            : 'Your emergency request has been sent to the nearest responder.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send emergency request');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send emergency request');
    } finally {
      setEmergencyLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.nameText}>
          {profile?.first_name || 'User'} {profile?.last_name || ''}
        </Text>
        <View style={styles.userDetails}>
          <Text style={styles.userDetailLabel}>Email:</Text>
          <Text style={styles.userDetailValue}>{user?.email || profile?.email || 'N/A'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.headerChip}
          >
            <Text style={styles.headerChipText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('EmergencyContacts')}
            style={[styles.headerChip, styles.headerChipSecondary]}
          >
            <Text style={styles.headerChipText}>Emergency Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {locationLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e74c3c" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : location ? (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>📍 Location Ready</Text>
            <Text style={styles.locationCoords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
        ) : (
          <View style={styles.locationError}>
            <Text style={styles.errorText}>Location not available</Text>
            <TouchableOpacity onPress={refreshLocation} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.sosButton, (sosLoading || !location) && styles.buttonDisabled]}
            onPress={handleSOS}
            disabled={sosLoading || !location}
          >
            {sosLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.sosButtonText}>🚨</Text>
                <Text style={styles.sosButtonLabel}>SOS REQUEST</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.emergencyButton,
              (emergencyLoading || !location) && styles.buttonDisabled,
            ]}
            onPress={handleEmergency}
            disabled={emergencyLoading || !location}
          >
            {emergencyLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.emergencyButtonText}>⚠️</Text>
                <Text style={styles.emergencyButtonLabel}>EMERGENCY REQUEST</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • SOS Request: Finds nearest hospital within 5km or assigns to a responder
          </Text>
          <Text style={styles.infoText}>
            • Emergency Request: Same as SOS, sends your location to nearest help
          </Text>
          <Text style={styles.infoText}>
            • Your location is automatically sent with the request
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#e74c3c',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  headerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff22',
    marginRight: 8,
  },
  headerChipSecondary: {
    backgroundColor: '#00000022',
  },
  headerChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  userDetails: {
    marginTop: 15,
  },
  userDetailLabel: {
    fontSize: 12,
    color: '#ffecec',
    opacity: 0.9,
  },
  userDetailValue: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  logoutButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 5,
  },
  locationCoords: {
    fontSize: 12,
    color: '#666',
  },
  locationError: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  sosButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emergencyButton: {
    backgroundColor: '#f39c12',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sosButtonText: {
    fontSize: 50,
    marginBottom: 10,
  },
  sosButtonLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  emergencyButtonText: {
    fontSize: 50,
    marginBottom: 10,
  },
  emergencyButtonLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});

