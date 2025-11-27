import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { useAnonymousReports } from "@/hooks/useAnonymousReports";
import { useToast } from "@/hooks/use-toast";
import { useHospitalSOS } from '@/hooks/useHospitalSOS';
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { sendSOSMail } from "@/hooks/mailhook";
import { UserProfile } from "@/components/user/components/profile";
import { MedicalReports } from "@/components/user/components/medical";
import { AISymptomChecker } from "@/components/user/components/ai";
import { UserDashboardHeader } from "@/components/user/components/UserDashboardHeader";
import { SOSCountdownOverlay } from "@/components/user/components/SOSCountdownOverlay";
import { EmergencyContactsDialog } from "@/components/user/components/EmergencyContactsDialog";
import { UserDashboardTabs } from "@/components/user/components/UserDashboardTabs";
import { EmergencyTab } from "@/components/user/components/EmergencyTab";
import { AIFeaturesTab } from "@/components/user/components/AIFeaturesTab";
import { ReportsTab } from "@/components/user/components/ReportsTab";
import { HistoryTab } from "@/components/user/components/HistoryTab";
import { HospitalRequestsTab } from "@/components/user/components/HospitalRequestsTab";
import { Ambulance, Shield, Flag } from "lucide-react";

const UserDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { alerts, createAlert } = useEmergencyAlerts();
  const { contacts, addContact, removeContact } = useEmergencyContacts();
  const { submitReport } = useAnonymousReports();
  const { toast } = useToast();
  const { sendHospitalSOS } = useHospitalSOS();
  
  const [sosCountdown, setSosCountdown] = useState(0);
  const [activeSOS, setActiveSOS] = useState(false);
  const [selectedSOSType, setSelectedSOSType] = useState<'medical' | 'safety' | 'general'>('medical');
  const [newContact, setNewContact] = useState({ name: "", phone: "" });
  const [location, setLocation] = useState("Getting location...");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMedicalReports, setShowMedicalReports] = useState(false);
  const [showAISymptomChecker, setShowAISymptomChecker] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [shakeEnabled, setShakeEnabled] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserCoords(coords);
          setLocation(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        },
        () => {
          setLocation("Location unavailable");
        }
      );
    }
  }, []);

  const handleSOSActivated = useCallback(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            description: location
          };

          await createAlert(selectedSOSType, locationData, `${selectedSOSType.toUpperCase()} emergency assistance needed`);
          setActiveSOS(false);
          setSelectedSOSType('medical');
        },
        () => {
          toast({
            title: "Location Error",
            description: "Could not get your location for the emergency alert.",
            variant: "destructive"
          });
          setActiveSOS(false);
          setSelectedSOSType('medical');
        }
      );
    }
  }, [selectedSOSType, location, createAlert, toast]);

  useEffect(() => {
    if (sosCountdown > 0) {
      const timer = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (sosCountdown === 0 && activeSOS) {
      handleSOSActivated();
    }
  }, [sosCountdown, activeSOS, handleSOSActivated]);

  const handleSOSClick = useCallback(async (type: "medical" | "safety" | "general") => {
    setSelectedSOSType(type);
    setSosCountdown(3);
    setActiveSOS(true);

    toast({
      title: "SOS Alert Starting",
      description: `${type.toUpperCase()} emergency alert in 3 seconds. Tap cancel to stop.`,
    });

    try {
      await sendSOSMail(type);
      toast({
        title: `${type.toUpperCase()} SOS Sent`,
        description: "Email has been successfully sent!",
      });
    } catch (error) {
      toast({
        title: "Failed to send SOS",
        description: "Please check your connection or location settings.",
      });
    }
  }, [toast]);

  const handleShake = useCallback(() => {
    if (!activeSOS && sosCountdown === 0) {
      toast({
        title: "Shake Detected!",
        description: "Triggering emergency SOS...",
        variant: "destructive"
      });
      handleSOSClick("medical");
    }
  }, [activeSOS, sosCountdown, toast, handleSOSClick]);

  const { isSupported, permissionStatus, requestPermission } = useShakeDetection({
    threshold: 15,
    debounceTime: 2000,
    onShake: handleShake,
    enabled: shakeEnabled,
  });

  const handleSOSCancel = () => {
    setSosCountdown(0);
    setActiveSOS(false);
    setSelectedSOSType('medical');
    toast({
      title: "SOS Cancelled",
      description: "Emergency alert has been cancelled.",
    });
  };

  const handleAddContact = async () => {
    if (newContact.name && newContact.phone) {
      await addContact(newContact.name, newContact.phone);
      setNewContact({ name: "", phone: "" });
    } else {
      toast({
        title: "Missing Information",
        description: "Please provide both name and phone number.",
        variant: "destructive",
      });
    }
  };

  const handleCallContact = (phone: string) => {
    if (!phone) return;
    window.open(`tel:${phone}`);
  };

  const handleRemoveContact = async (id: string) => {
    await removeContact(id);
  };

  const call911 = () => {
    window.open("tel:911");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-800";
      case "acknowledged": return "bg-yellow-100 text-yellow-800";
      case "responding": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "medical": return <Ambulance className="h-4 w-4" />;
      case "safety": return <Shield className="h-4 w-4" />;
      case "general": return <Flag className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const handleEmergencyDetected = (type: "medical" | "safety" | "general", description: string) => {
    setSelectedSOSType(type);
    handleSOSClick(type);
    toast({
      title: '🚨 Emergency Detected via Voice!',
      description: `AI detected ${type} emergency. SOS activated.`,
      variant: 'destructive',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-orange-50/20">
      <UserDashboardHeader
        profile={profile ? { first_name: profile.first_name || '', last_name: profile.last_name || '' } : null}
        onProfileClick={() => setShowProfile(true)}
        onMedicalReportsClick={() => setShowMedicalReports(true)}
        onAISymptomCheckerClick={() => setShowAISymptomChecker(true)}
        onContactsClick={() => setShowContacts(true)}
        onSignOut={signOut}
      />

      {/* Modals and Dialogs */}
      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onProfileUpdate={() => setShowProfile(false)}
      />
      <MedicalReports
        isOpen={showMedicalReports}
        onClose={() => setShowMedicalReports(false)}
      />
      <AISymptomChecker
        isOpen={showAISymptomChecker}
        onClose={() => setShowAISymptomChecker(false)}
      />
      <EmergencyContactsDialog
        open={showContacts}
        onOpenChange={setShowContacts}
        contacts={contacts}
        newContact={newContact}
        onNewContactChange={setNewContact}
        onAddContact={handleAddContact}
        onCallContact={handleCallContact}
        onRemoveContact={handleRemoveContact}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <SOSCountdownOverlay
          countdown={sosCountdown}
          sosType={selectedSOSType}
          onCancel={handleSOSCancel}
        />

        <Tabs defaultValue="emergency" className="space-y-6">
          <UserDashboardTabs />

          <EmergencyTab
            isSupported={isSupported}
            permissionStatus={permissionStatus}
            shakeEnabled={shakeEnabled}
            onRequestPermission={requestPermission}
            onToggleShake={() => setShakeEnabled(!shakeEnabled)}
            onSOSClick={handleSOSClick}
            onCall911={call911}
            onSubmitReport={(type, description, location) => {
              submitReport(type, description, location).catch(console.error);
            }}
            sosCountdown={sosCountdown}
            location={location}
            contactsCount={contacts.length}
            userLat={userCoords?.lat}
            userLng={userCoords?.lng}
          />

          <AIFeaturesTab
            onEmergencyDetected={handleEmergencyDetected}
            onSOSClick={handleSOSClick}
            onAISymptomCheckerClick={() => setShowAISymptomChecker(true)}
          />

          <HospitalRequestsTab />

          <HistoryTab
            alerts={alerts}
            getStatusColor={getStatusColor}
            getTypeIcon={getTypeIcon}
          />

          <ReportsTab
            onMedicalReportsClick={() => setShowMedicalReports(true)}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
