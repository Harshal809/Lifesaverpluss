import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Ambulance, Phone, MapPin, Users, History, Clock, Flag, User, MoreHorizontalIcon, FileText, Sparkles, Contact, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { useAnonymousReports } from "@/hooks/useAnonymousReports";
import { useToast } from "@/hooks/use-toast";
import { NearbyRespondersCard } from "@/components/NearbyRespondersCard";
import { AnonymousReportDialog } from "@/components/AnonymousReportDialog";
// import { HospitalSOSDialog } from "@/components/HospitalSOSDialog";
import UserProfile from "@/components/UserProfile";
import AnonymousReportForm from "@/components/AnonymousReportForm";
import AnonymousReportsHistory from "@/components/AnonymousReportsHistory";
import { useHospitalSOS } from '@/hooks/useHospitalSOS';
import { supabase } from "@/integrations/supabase/client";
import SOSButton from "@/components/r/SOSButton";
import { sendSOSMail } from "@/hooks/mailhook";
import EmergencyContacts from "@/components/EmergencyContacts";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import MedicalReports from "@/components/MedicalReports";
import AISymptomChecker from "@/components/AISymptomChecker";
import AIVoiceEmergency from "@/components/AIVoiceEmergency";
import AIHealthRiskAnalyzer from "@/components/AIHealthRiskAnalyzer";
interface HospitalSOSDialogProps {
  userLocation: { lat: number; lng: number } | null;
}

const UserDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { alerts, createAlert } = useEmergencyAlerts();
  const { contacts, addContact, removeContact } = useEmergencyContacts();
  const { submitReport } = useAnonymousReports();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
  const { sendHospitalSOS, loading } = useHospitalSOS();

  useEffect(() => {
    // Get user location
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

          // Use the selected SOS type instead of hardcoded "medical"
          await createAlert(selectedSOSType, locationData, `${selectedSOSType.toUpperCase()} emergency assistance needed`);
          setActiveSOS(false);
          setSelectedSOSType('medical'); // Reset to default
        },
        () => {
          toast({
            title: "Location Error",
            description: "Could not get your location for the emergency alert.",
            variant: "destructive"
          });
          setActiveSOS(false);
          setSelectedSOSType('medical'); // Reset to default
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






  // Handle SOS button click
  // const handleSOSClick = async (type: "medical" | "safety" | "general") => {
  //   setSelectedSOSType(type); // Store the selected type
  //   setSosCountdown(3);
  //   setActiveSOS(true);

  //   toast({
  //     title: "SOS Alert Starting",
  //     description: `${type.toUpperCase()} emergency alert in 3 seconds. Tap cancel to stop.`,
  //   });

  //   // if (type === "medical") {
  //   //   await handleAutoSendSOS(); // call directly
  //   // }
  // };

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

  // Shake detection for SOS trigger
  const handleShake = useCallback(() => {
    if (!activeSOS && sosCountdown === 0) {
      toast({
        title: "Shake Detected!",
        description: "Triggering emergency SOS...",
        variant: "destructive"
      });
      handleSOSClick("medical"); // Default to medical emergency on shake
    }
  }, [activeSOS, sosCountdown, toast, handleSOSClick]);

  const { isSupported, permissionStatus, requestPermission } = useShakeDetection({
    threshold: 15, // m/s² acceleration threshold
    debounceTime: 2000, // 2 seconds between shake triggers
    onShake: handleShake,
    enabled: shakeEnabled,
  });

  const handleSOSCancel = () => {
    setSosCountdown(0);
    setActiveSOS(false);
    setSelectedSOSType('medical'); // Reset to default
    toast({
      title: "SOS Cancelled",
      description: "Emergency alert has been cancelled.",
    });
  };

  const handleAddContact = async () => {
    if (newContact.name && newContact.phone) {
      await addContact(newContact.name, newContact.phone);
      setNewContact({ name: "", phone: "" });
      // Toast is already handled in the hook
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
    // Toast is already handled in the hook
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
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-red-600" />
              <span className="text-xl font-bold">User Dashboard</span>
              {profile && (
                <span className="text-gray-600 sm:flex hidden">
                  - {profile.first_name} {profile.last_name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(true)}
              >
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMedicalReports(true)}
                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Medical</span>
                <span className="sm:hidden">Med</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAISymptomChecker(true)}
                className="bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700"
              >
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">AI Check</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContacts(true)}
                className="bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
              >
                <Users className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Contacts</span>
                <span className="sm:hidden">Con</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/user/bloodconnect')}
                className="bg-red-50 border-red-200 hover:bg-red-100 text-red-700"
              >
                <Heart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Blood Connect</span>
                <span className="sm:hidden">Blood</span>
              </Button>
              <UserProfile
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                onProfileUpdate={() => {
                  setShowProfile(false);
                }}
              />
              <MedicalReports
                isOpen={showMedicalReports}
                onClose={() => setShowMedicalReports(false)}
              />
              <AISymptomChecker
                isOpen={showAISymptomChecker}
                onClose={() => setShowAISymptomChecker(false)}
              />
              {/* Contacts Dialog */}
              <Dialog open={showContacts} onOpenChange={setShowContacts}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Emergency Contacts
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {/* Add Contact Form */}
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Add New Contact</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="contactName">Name</Label>
                            <Input
                              id="contactName"
                              value={newContact.name}
                              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                              placeholder="Contact name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="contactPhone">Phone</Label>
                            <Input
                              id="contactPhone"
                              value={newContact.phone}
                              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                              placeholder="+91-XXXXXXXXXX"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button 
                              onClick={handleAddContact} 
                              className="w-full bg-green-600 hover:bg-green-700"
                              disabled={!newContact.name || !newContact.phone}
                            >
                              Add Contact
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Contacts List */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Your Emergency Contacts ({contacts.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {contacts.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No emergency contacts yet</p>
                            <p className="text-sm mt-1">Add a contact above to get started</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {contacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900">{contact.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <a 
                                      href={`tel:${contact.phone}`}
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      {contact.phone}
                                    </a>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleCallContact(contact.phone)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Phone className="h-4 w-4 mr-1" />
                                    Call
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveContact(contact.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={signOut}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* SOS Countdown Overlay */}
        {sosCountdown > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-8 text-center">
              <div className="text-6xl font-bold text-red-600 mb-4">{sosCountdown}</div>
              <p className="text-lg mb-4">{selectedSOSType.toUpperCase()} emergency alert activating...</p>
              <Button onClick={handleSOSCancel} variant="outline">
                Cancel SOS
              </Button>
            </Card>
          </div>
        )}

        <Tabs defaultValue="emergency" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="ai-features">
              <Sparkles className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">AI Features</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
           
          </TabsList>

          

          <TabsContent value="emergency" className="space-y-6">
            {/* Shake Detection Status */}
            {isSupported && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">Shake to Trigger SOS</h3>
                      <p className="text-sm text-blue-700">
                        {permissionStatus === 'granted' 
                          ? 'Shake detection is active. Shake your device to trigger emergency SOS.'
                          : permissionStatus === 'denied'
                          ? 'Motion permission denied. Click "Enable" to grant access.'
                          : 'Click "Enable" to allow shake detection for emergency SOS.'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {permissionStatus !== 'granted' && (
                        <Button 
                          onClick={requestPermission}
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600"
                        >
                          Enable Shake Detection
                        </Button>
                      )}
                      <Button
                        onClick={() => setShakeEnabled(!shakeEnabled)}
                        size="sm"
                        variant={shakeEnabled ? "default" : "outline"}
                      >
                        {shakeEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emergency Actions */}
 
  <SOSButton />


            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ambulance className="h-5 w-5 text-red-600" />
                  <span>Emergency Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Button
                    onClick={() => handleSOSClick("medical")}
                    className="h-20 bg-red-600 hover:bg-red-700 text-white"
                    disabled={sosCountdown > 0}
                  >
                    <div className="text-center">
                      <Ambulance className="h-6 w-6 mx-auto mb-1" />
                      <div className="font-semibold">Medical Emergency</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleSOSClick("safety")}
                    className="h-20 bg-orange-600 hover:bg-orange-700 text-white"
                    disabled={sosCountdown > 0}
                  >
                    <div className="text-center">
                      <Shield className="h-6 w-6 mx-auto mb-1" />
                      <div className="font-semibold">Personal Safety</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleSOSClick("general")}
                    className="h-20 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={sosCountdown > 0}
                  >
                    <div className="text-center">
                      <Flag className="h-6 w-6 mx-auto mb-1" />
                      <div className="font-semibold">General Emergency</div>
                    </div>
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-4 gap-4">
                  <Button onClick={call911} variant="outline" className="border-red-600 text-red-600">
                    <Phone className="h-4 w-4 mr-2" />
                    Call 911
                  </Button>
                  <Button variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Share Location
                  </Button>
                  <Button variant="outline">
                    <MoreHorizontalIcon className="h-4 w-4 mr-2" />
                   New Features
                  </Button>
                  {/* <HospitalSOSDialog
                    userLocation={userCoords}
                    trigger={
                      <Button variant="outline" className="w-full" disabled={!userCoords}>
                        <Ambulance className="h-4 w-4 mr-2" />
                        Find Hospital
                      </Button>
                    }
                  /> */}
                  <AnonymousReportDialog
                    onSubmit={submitReport}
                    trigger={
                      <Button variant="outline" className="w-full">
                        <Flag className="h-4 w-4 mr-2" />
                        Anonymous Report
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Location</p>
                      <p className="text-lg font-semibold">{location}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Emergency Contacts</p>
                      <p className="text-lg font-semibold">{contacts.length} Active</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <NearbyRespondersCard
                userLat={userCoords?.lat}
                userLng={userCoords?.lng}
              />
            </div>
          </TabsContent>

          {/* AI Features Tab - All AI Components */}
          <TabsContent value="ai-features" className="space-y-6">
            <div className="space-y-6">
              {/* AI Voice Emergency */}
              <AIVoiceEmergency 
                onEmergencyDetected={(type, description) => {
                  setSelectedSOSType(type);
                  handleSOSClick(type);
                  toast({
                    title: '🚨 Emergency Detected via Voice!',
                    description: `AI detected ${type} emergency. SOS activated.`,
                    variant: 'destructive',
                  });
                }}
              />

              {/* AI Symptom Checker - Card Format */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Symptom Checker
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Describe your symptoms for AI-powered analysis and diagnosis suggestions
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowAISymptomChecker(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Open Symptom Checker
                  </Button>
                </CardContent>
              </Card>

              {/* AI Health Risk Analyzer */}
              <AIHealthRiskAnalyzer />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Medical Reports Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Medical Reports Management
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your medical history and reports
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowMedicalReports(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Medical Reports
                </Button>
              </CardContent>
            </Card>
            <MedicalReports
              isOpen={showMedicalReports}
              onClose={() => setShowMedicalReports(false)}
            />

            {/* Anonymous Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Anonymous Safety Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <AnonymousReportForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report History</CardTitle>
              </CardHeader>
              <CardContent>
                <AnonymousReportsHistory />
              </CardContent>
            </Card>
          </TabsContent>
       
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>SOS Alert History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(alert.type)}
                          <div>
                            <p className="font-semibold capitalize">{alert.type} Emergency</p>
                            <p className="text-sm text-gray-600">{alert.location_description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(alert.created_at).toLocaleDateString()} {new Date(alert.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {alert.description && (
                        <div className="mt-2 text-sm text-gray-600">
                          {alert.description}
                        </div>
                      )}
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No emergency alerts yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Anonymous Safety Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <AnonymousReportForm />
              </CardContent>
            </Card>

            <CardContent>
              <Card>
                <AnonymousReportsHistory />
              </Card>
            </CardContent>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;

