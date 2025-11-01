import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBloodRequests } from '@/hooks/useBloodRequests';
import { useAuth } from '@/hooks/useAuth';
import { Droplet, AlertCircle, MapPin } from 'lucide-react';

interface BloodRequestFormProps {
  onSuccess?: () => void;
}

const BloodRequestForm = ({ onSuccess }: BloodRequestFormProps) => {
  const { user } = useAuth();
  const { createRequest } = useBloodRequests();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    blood_group: '',
    units_required: 1,
    urgency_level: 'normal' as 'normal' | 'urgent' | 'critical',
    patient_name: '',
    patient_age: '',
    patient_condition: '',
    hospital_name: '',
    location_lat: 0,
    location_lng: 0,
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    description: '',
    expiry_hours: '24',
  });

  const handleLocation = () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.blood_group || !formData.contact_name || !formData.contact_phone) {
      return;
    }

    setLoading(true);

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + parseInt(formData.expiry_hours));

    const result = await createRequest({
      ...formData,
      patient_age: formData.patient_age ? parseInt(formData.patient_age) : undefined,
      location_lat: formData.location_lat || undefined,
      location_lng: formData.location_lng || undefined,
      expiry_date: expiryDate.toISOString(),
    });

    if (!result.error) {
      // Reset form
      setFormData({
        blood_group: '',
        units_required: 1,
        urgency_level: 'normal',
        patient_name: '',
        patient_age: '',
        patient_condition: '',
        hospital_name: '',
        location_lat: 0,
        location_lng: 0,
        address: '',
        city: '',
        state: '',
        pincode: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        description: '',
        expiry_hours: '24',
      });
      if (onSuccess) onSuccess();
    }

    setLoading(false);
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-red-600" />
          Request Blood
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blood_group">Blood Group Required *</Label>
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
              <Label htmlFor="units_required">Units Required *</Label>
              <Input
                id="units_required"
                type="number"
                min="1"
                value={formData.units_required}
                onChange={(e) => setFormData({ ...formData, units_required: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="urgency_level">Urgency Level *</Label>
            <Select
              value={formData.urgency_level}
              onValueChange={(value: 'normal' | 'urgent' | 'critical') => 
                setFormData({ ...formData, urgency_level: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="patient_name">Patient Name</Label>
              <Input
                id="patient_name"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="patient_age">Patient Age</Label>
              <Input
                id="patient_age"
                type="number"
                value={formData.patient_age}
                onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="patient_condition">Condition</Label>
              <Input
                id="patient_condition"
                value={formData.patient_condition}
                onChange={(e) => setFormData({ ...formData, patient_condition: e.target.value })}
                placeholder="e.g., Surgery, Emergency"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="hospital_name">Hospital Name (if applicable)</Label>
            <Input
              id="hospital_name"
              value={formData.hospital_name}
              onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="address">Location</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLocation}
                size="sm"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Contact Information *</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Contact Phone *</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Any additional information..."
            />
          </div>

          <div>
            <Label htmlFor="expiry_hours">Request Valid For (Hours)</Label>
            <Select
              value={formData.expiry_hours}
              onValueChange={(value) => setFormData({ ...formData, expiry_hours: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 Hours</SelectItem>
                <SelectItem value="24">24 Hours</SelectItem>
                <SelectItem value="48">48 Hours</SelectItem>
                <SelectItem value="72">72 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
            {loading ? 'Creating Request...' : 'Create Blood Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BloodRequestForm;

