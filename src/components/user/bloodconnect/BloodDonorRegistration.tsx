import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBloodDonor } from '@/hooks/useBloodDonor';
import { useToast } from '@/hooks/use-toast';
import { Heart, MapPin, CheckCircle2 } from 'lucide-react';

const BloodDonorRegistration = () => {
  const { isDonor, donorProfile, registerAsDonor, updateDonorProfile, loading } = useBloodDonor();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    blood_group: '',
    phone: '',
    location_lat: 0,
    location_lng: 0,
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    health_declaration: false,
  });

  useEffect(() => {
    if (donorProfile) {
      setFormData({
        blood_group: donorProfile.blood_group || '',
        phone: donorProfile.phone || '',
        location_lat: donorProfile.location_lat || 0,
        location_lng: donorProfile.location_lng || 0,
        address: donorProfile.address || '',
        city: donorProfile.city || '',
        state: donorProfile.state || '',
        pincode: donorProfile.pincode || '',
        emergency_contact_name: donorProfile.emergency_contact_name || '',
        emergency_contact_phone: donorProfile.emergency_contact_phone || '',
        health_declaration: donorProfile.health_declaration || false,
      });
    }
  }, [donorProfile]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location_lat: position.coords.latitude,
            location_lng: position.coords.longitude,
          }));
        },
        () => {
          console.log('Location permission denied');
        }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.blood_group) {
      toast({
        title: 'Validation Error',
        description: 'Please select your blood group',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.health_declaration) {
      toast({
        title: 'Health Declaration Required',
        description: 'Please confirm that you are healthy and eligible to donate blood',
        variant: 'destructive',
      });
      return;
    }

    if (isDonor && donorProfile) {
      await updateDonorProfile(formData);
    } else {
      await registerAsDonor(formData);
    }
  };

  const toggleAvailability = async () => {
    if (!donorProfile) return;
    await updateDonorProfile({ is_available: !donorProfile.is_available });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              {isDonor ? 'Blood Donor Profile' : 'Register as Blood Donor'}
            </CardTitle>
            <CardDescription>
              {isDonor 
                ? 'Update your donor profile or manage availability'
                : 'Join the blood donation network and help save lives'}
            </CardDescription>
          </div>
          {isDonor && (
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${donorProfile?.is_available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {donorProfile?.is_available ? 'Available' : 'Not Available'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isDonor && donorProfile && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">You are registered as a donor!</p>
                <div className="mt-2 space-y-1 text-sm text-green-700">
                  <p><strong>Blood Group:</strong> {donorProfile.blood_group}</p>
                  <p><strong>Donations:</strong> {donorProfile.donation_count}</p>
                  {donorProfile.last_donation_date && (
                    <p><strong>Last Donation:</strong> {new Date(donorProfile.last_donation_date).toLocaleDateString()}</p>
                  )}
                  {donorProfile.next_available_date && (
                    <p><strong>Next Available:</strong> {new Date(donorProfile.next_available_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blood_group">Blood Group *</Label>
              <Select
                value={formData.blood_group}
                onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91-XXXXXXXXXX"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
            </div>

            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Pincode"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Emergency Contact</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Checkbox
              id="health_declaration"
              checked={formData.health_declaration}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, health_declaration: checked as boolean })
              }
            />
            <Label htmlFor="health_declaration" className="text-sm font-medium leading-none cursor-pointer">
              I declare that I am healthy, eligible to donate blood, and have not donated blood in the last 90 days.
              <span className="text-red-600"> *</span>
            </Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
              {isDonor ? 'Update Profile' : 'Register as Donor'}
            </Button>
            {isDonor && (
              <Button
                type="button"
                variant={donorProfile?.is_available ? "destructive" : "default"}
                onClick={toggleAvailability}
              >
                {donorProfile?.is_available ? 'Set Unavailable' : 'Set Available'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BloodDonorRegistration;

