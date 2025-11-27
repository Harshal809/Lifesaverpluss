import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Droplet, Heart, AlertCircle, CheckCircle2, Clock, User, Phone as PhoneIcon, Mail, FileText, Send } from 'lucide-react';

interface HospitalRequestFormProps {
  hospitalId: string;
  hospitalName: string;
  onSuccess?: () => void;
}

const HospitalRequestForm = ({ hospitalId, hospitalName, onSuccess }: HospitalRequestFormProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableBloodGroups, setAvailableBloodGroups] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    blood_group: '',
    units_required: 1,
    urgency_level: 'normal' as 'normal' | 'urgent' | 'critical',
    patient_name: '',
    patient_age: '',
    patient_condition: '',
    contact_name: profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : '',
    contact_phone: profile?.phone || '',
    contact_email: user?.email || '',
    description: '',
  });

  useEffect(() => {
    fetchAvailableBloodGroups();
  }, [hospitalId]);

  const fetchAvailableBloodGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_blood_inventory')
        .select('blood_group, units_available, units_reserved')
        .eq('hospital_id', hospitalId)
        .gt('units_available', 0);

      if (error) throw error;

      const available = (data || [])
        .filter(item => item.units_available - (item.units_reserved || 0) > 0)
        .map(item => item.blood_group);
      
      setAvailableBloodGroups(available);
    } catch (error: any) {
      console.error('Error fetching available blood groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please login to request blood',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.blood_group || !formData.contact_name || !formData.contact_phone) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_hospital_blood_requests')
        .insert({
          user_id: user.id,
          hospital_id: hospitalId,
          blood_group: formData.blood_group,
          units_required: formData.units_required,
          urgency_level: formData.urgency_level,
          patient_name: formData.patient_name || null,
          patient_age: formData.patient_age ? parseInt(formData.patient_age) : null,
          patient_condition: formData.patient_condition || null,
          contact_name: formData.contact_name,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email || null,
          description: formData.description || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Blood request submitted successfully. Hospital will review and respond.',
      });

      // Reset form
      setFormData({
        blood_group: '',
        units_required: 1,
        urgency_level: 'normal',
        patient_name: '',
        patient_age: '',
        patient_condition: '',
        contact_name: profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : '',
        contact_phone: profile?.phone || '',
        contact_email: user?.email || '',
        description: '',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/user/bloodconnect?tab=my-requests');
      }
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge className="bg-red-600 text-white"><AlertCircle className="h-3 w-3 mr-1" />Critical</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-600 text-white"><Clock className="h-3 w-3 mr-1" />Urgent</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle2 className="h-3 w-3 mr-1" />Normal</Badge>;
    }
  };

  return (
    <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Heart className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              Request Blood
            </CardTitle>
            <CardDescription className="mt-1">
              Submit a blood request to {hospitalName}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {availableBloodGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-fit">
              <AlertCircle className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Blood Available</h3>
            <p className="text-muted-foreground text-sm mb-6">
              This hospital currently has no blood available. Please try another hospital or check back later.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/user/bloodconnect?tab=hospitals')}
            >
              Browse Other Hospitals
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Group & Units */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_group" className="text-sm font-semibold flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-red-600" />
                  Blood Group *
                </Label>
                <Select
                  value={formData.blood_group || undefined}
                  onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                  required
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBloodGroups.map(bg => (
                      <SelectItem key={bg} value={bg}>
                        <div className="flex items-center gap-2">
                          <Droplet className="h-4 w-4 text-red-600" />
                          <span className="font-semibold">{bg}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="units_required" className="text-sm font-semibold">Units Required *</Label>
                <Input
                  id="units_required"
                  type="number"
                  min="1"
                  value={formData.units_required}
                  onChange={(e) => setFormData({ ...formData, units_required: parseInt(e.target.value) || 1 })}
                  required
                  className="h-11"
                />
              </div>
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <Label htmlFor="urgency_level" className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Urgency Level *
              </Label>
              <Select
                value={formData.urgency_level}
                onValueChange={(value: 'normal' | 'urgent' | 'critical') => 
                  setFormData({ ...formData, urgency_level: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <span>Normal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span>Urgent</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span>Critical</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.urgency_level && (
                <div className="mt-2">
                  {getUrgencyBadge(formData.urgency_level)}
                </div>
              )}
            </div>

            <Separator />

            {/* Patient Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-base">Patient Information (Optional)</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_name">Patient Name</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    placeholder="Enter patient name"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient_age">Patient Age</Label>
                  <Input
                    id="patient_age"
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                    placeholder="Enter age"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient_condition">Patient Condition</Label>
                <Input
                  id="patient_condition"
                  value={formData.patient_condition}
                  onChange={(e) => setFormData({ ...formData, patient_condition: e.target.value })}
                  placeholder="e.g., Surgery, Emergency, etc."
                  className="h-11"
                />
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <PhoneIcon className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-base">Contact Information *</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                  Contact Email
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="h-11"
                />
              </div>
            </div>

            <Separator />

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Additional Details
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Any additional information that might help the hospital process your request..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-base font-semibold" 
              disabled={loading || availableBloodGroups.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Submitting Request...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Blood Request
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your request will be reviewed by the hospital. You'll be notified once they respond.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default HospitalRequestForm;
