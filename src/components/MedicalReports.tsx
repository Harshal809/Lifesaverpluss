import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, X } from 'lucide-react';

interface MedicalReportsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MedicalReportData {
  age: number | null;
  blood_group: string;
  height_cm: number | null;
  weight_kg: number | null;
  medical_history: string;
  current_conditions: string;
  medications: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  insurance_provider: string;
  insurance_policy_number: string;
  primary_physician_name: string;
  primary_physician_phone: string;
  background_notes: string;
}

const MedicalReports = ({ isOpen, onClose }: MedicalReportsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState<MedicalReportData>({
    age: null,
    blood_group: '',
    height_cm: null,
    weight_kg: null,
    medical_history: '',
    current_conditions: '',
    medications: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    insurance_provider: '',
    insurance_policy_number: '',
    primary_physician_name: '',
    primary_physician_phone: '',
    background_notes: '',
  });

  // Fetch existing medical report on open
  useEffect(() => {
    if (isOpen && user) {
      fetchMedicalReport();
    }
  }, [isOpen, user]);

  const fetchMedicalReport = async () => {
    if (!user) return;
    
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFormData({
          age: data.age,
          blood_group: data.blood_group || '',
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          medical_history: data.medical_history || '',
          current_conditions: data.current_conditions || '',
          medications: data.medications || '',
          allergies: data.allergies || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          emergency_contact_relation: data.emergency_contact_relation || '',
          insurance_provider: data.insurance_provider || '',
          insurance_policy_number: data.insurance_policy_number || '',
          primary_physician_name: data.primary_physician_name || '',
          primary_physician_phone: data.primary_physician_phone || '',
          background_notes: data.background_notes || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching medical report:', error);
      toast({
        title: 'Error',
        description: 'Failed to load medical report.',
        variant: 'destructive',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const reportData = {
        user_id: user.id,
        age: formData.age || null,
        blood_group: formData.blood_group || null,
        height_cm: formData.height_cm || null,
        weight_kg: formData.weight_kg || null,
        medical_history: formData.medical_history || null,
        current_conditions: formData.current_conditions || null,
        medications: formData.medications || null,
        allergies: formData.allergies || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_policy_number: formData.insurance_policy_number || null,
        primary_physician_name: formData.primary_physician_name || null,
        primary_physician_phone: formData.primary_physician_phone || null,
        background_notes: formData.background_notes || null,
      };

      const { error } = await supabase
        .from('medical_reports')
        .upsert(reportData, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Medical report saved successfully.',
      });
      onClose();
    } catch (error: any) {
      console.error('Error saving medical report:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save medical report.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof MedicalReportData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Reports & History
          </DialogTitle>
          <DialogDescription>
            Your medical information will be automatically shared with hospitals during emergency SOS requests.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Years"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Input
                    id="blood_group"
                    value={formData.blood_group}
                    onChange={(e) => handleChange('blood_group', e.target.value)}
                    placeholder="A+, B+, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_cm">Height (cm)</Label>
                  <Input
                    id="height_cm"
                    type="number"
                    value={formData.height_cm || ''}
                    onChange={(e) => handleChange('height_cm', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="cm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    step="0.1"
                    value={formData.weight_kg || ''}
                    onChange={(e) => handleChange('weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="kg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Medical History</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medical_history">Previous Illnesses/Surgeries</Label>
                  <Textarea
                    id="medical_history"
                    value={formData.medical_history}
                    onChange={(e) => handleChange('medical_history', e.target.value)}
                    placeholder="List any previous surgeries, illnesses, or major medical events"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_conditions">Current Medical Conditions</Label>
                  <Textarea
                    id="current_conditions"
                    value={formData.current_conditions}
                    onChange={(e) => handleChange('current_conditions', e.target.value)}
                    placeholder="Diabetes, Hypertension, Asthma, etc."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => handleChange('medications', e.target.value)}
                    placeholder="Medication name, dosage, frequency"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => handleChange('allergies', e.target.value)}
                    placeholder="Drug allergies, food allergies, etc."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Phone Number</Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relation">Relation</Label>
                  <Input
                    id="emergency_contact_relation"
                    value={formData.emergency_contact_relation}
                    onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
                    placeholder="Spouse, Parent, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance & Physician */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Insurance & Primary Physician</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insurance_provider">Insurance Provider</Label>
                  <Input
                    id="insurance_provider"
                    value={formData.insurance_provider}
                    onChange={(e) => handleChange('insurance_provider', e.target.value)}
                    placeholder="Insurance Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_policy_number">Policy Number</Label>
                  <Input
                    id="insurance_policy_number"
                    value={formData.insurance_policy_number}
                    onChange={(e) => handleChange('insurance_policy_number', e.target.value)}
                    placeholder="Policy ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_physician_name">Primary Physician Name</Label>
                  <Input
                    id="primary_physician_name"
                    value={formData.primary_physician_name}
                    onChange={(e) => handleChange('primary_physician_name', e.target.value)}
                    placeholder="Doctor Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_physician_phone">Physician Phone</Label>
                  <Input
                    id="primary_physician_phone"
                    type="tel"
                    value={formData.primary_physician_phone}
                    onChange={(e) => handleChange('primary_physician_phone', e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Additional Medical Background</h3>
              <div className="space-y-2">
                <Label htmlFor="background_notes">Notes</Label>
                <Textarea
                  id="background_notes"
                  value={formData.background_notes}
                  onChange={(e) => handleChange('background_notes', e.target.value)}
                  placeholder="Any additional medical information that might be important during emergencies"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetching}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Medical Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalReports;

