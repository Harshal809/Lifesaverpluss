import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ChevronDown, ChevronUp, User, Phone, Heart, Pill, AlertTriangle, Stethoscope, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface MedicalReport {
  id: string;
  user_id: string;
  age: number | null;
  blood_group: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  medical_history: string | null;
  current_conditions: string | null;
  medications: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  primary_physician_name: string | null;
  primary_physician_phone: string | null;
  background_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MedicalReportViewProps {
  userId: string;
  userName: string;
}

const MedicalReportView = ({ userId, userName }: MedicalReportViewProps) => {
  const [medicalReport, setMedicalReport] = useState<MedicalReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (expanded && !medicalReport && !loading) {
      fetchMedicalReport();
    }
  }, [expanded, userId]);

  const fetchMedicalReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setMedicalReport(data || null);

      if (!data) {
        toast({
          title: 'No Medical Report',
          description: `${userName} has not provided medical information yet.`,
          variant: 'default',
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
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!expanded && !medicalReport) {
      fetchMedicalReport();
    }
    setExpanded(!expanded);
  };

  if (loading && expanded) {
    return (
      <Card className="mt-4 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading medical report...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expanded && !medicalReport) {
    return (
      <Card className="mt-4 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-gray-700">No medical report available for this patient.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      <Button
        onClick={handleToggle}
        variant="outline"
        size="sm"
        className="w-full sm:w-auto bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
      >
        <FileText className="h-4 w-4 mr-2" />
        {expanded ? 'Hide' : 'View'} Medical Report
        {expanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
      </Button>

      {expanded && medicalReport && (
        <Card className="mt-4 border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {medicalReport.age && (
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="font-semibold">{medicalReport.age} years</p>
                </div>
              )}
              {medicalReport.blood_group && (
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <Badge variant="destructive" className="mt-1">{medicalReport.blood_group}</Badge>
                </div>
              )}
              {medicalReport.height_cm && (
                <div>
                  <p className="text-xs text-gray-500">Height</p>
                  <p className="font-semibold">{medicalReport.height_cm} cm</p>
                </div>
              )}
              {medicalReport.weight_kg && (
                <div>
                  <p className="text-xs text-gray-500">Weight</p>
                  <p className="font-semibold">{medicalReport.weight_kg} kg</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Critical Info */}
            {medicalReport.allergies && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-1">Known Allergies</p>
                    <p className="text-sm text-red-800">{medicalReport.allergies}</p>
                  </div>
                </div>
              </div>
            )}

            {medicalReport.current_conditions && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Current Medical Conditions
                </p>
                <p className="text-sm text-gray-600 bg-white rounded p-2">{medicalReport.current_conditions}</p>
              </div>
            )}

            {medicalReport.medications && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Current Medications
                </p>
                <p className="text-sm text-gray-600 bg-white rounded p-2">{medicalReport.medications}</p>
              </div>
            )}

            {medicalReport.medical_history && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Medical History</p>
                <p className="text-sm text-gray-600 bg-white rounded p-2">{medicalReport.medical_history}</p>
              </div>
            )}

            {/* Emergency Contact */}
            {(medicalReport.emergency_contact_name || medicalReport.emergency_contact_phone) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Emergency Contact
                  </p>
                  <div className="bg-white rounded p-2 space-y-1">
                    {medicalReport.emergency_contact_name && (
                      <p className="text-sm text-gray-700">Name: {medicalReport.emergency_contact_name}</p>
                    )}
                    {medicalReport.emergency_contact_phone && (
                      <a href={`tel:${medicalReport.emergency_contact_phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                        <Phone className="h-4 w-4" />
                        {medicalReport.emergency_contact_phone}
                      </a>
                    )}
                    {medicalReport.emergency_contact_relation && (
                      <p className="text-xs text-gray-500">Relation: {medicalReport.emergency_contact_relation}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Primary Physician */}
            {(medicalReport.primary_physician_name || medicalReport.primary_physician_phone) && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Primary Physician
                </p>
                <div className="bg-white rounded p-2 space-y-1">
                  {medicalReport.primary_physician_name && (
                    <p className="text-sm text-gray-700">{medicalReport.primary_physician_name}</p>
                  )}
                  {medicalReport.primary_physician_phone && (
                    <a href={`tel:${medicalReport.primary_physician_phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Phone className="h-4 w-4" />
                      {medicalReport.primary_physician_phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Insurance */}
            {(medicalReport.insurance_provider || medicalReport.insurance_policy_number) && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Insurance Information
                </p>
                <div className="bg-white rounded p-2 space-y-1">
                  {medicalReport.insurance_provider && (
                    <p className="text-sm text-gray-700">Provider: {medicalReport.insurance_provider}</p>
                  )}
                  {medicalReport.insurance_policy_number && (
                    <p className="text-sm text-gray-700">Policy: {medicalReport.insurance_policy_number}</p>
                  )}
                </div>
              </div>
            )}

            {/* Background Notes */}
            {medicalReport.background_notes && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Additional Notes</p>
                <p className="text-sm text-gray-600 bg-white rounded p-2">{medicalReport.background_notes}</p>
              </div>
            )}

            {medicalReport.updated_at && (
              <p className="text-xs text-gray-400 text-right">
                Last updated: {new Date(medicalReport.updated_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MedicalReportView;

