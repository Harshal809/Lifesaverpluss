import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, MapPin, Phone, Mail, Droplet, ArrowLeft, MessageCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HospitalRequestForm } from '@/components/hospital/bloodconnect';

interface HospitalInventory {
  blood_group: string;
  units_available: number;
  units_reserved: number;
}

interface Hospital {
  id: string;
  hospital_name: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  inventory: HospitalInventory[];
}

const HospitalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchHospital();
    } else {
      setError('Hospital ID is missing');
      setLoading(false);
    }
  }, [id]);

  const fetchHospital = async () => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Hospital ID is missing',
        variant: 'destructive',
      });
      navigate('/dashboard/user/bloodconnect?tab=hospitals');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch hospital details
      const { data: hospitalData, error: hospitalError } = await supabase
        .from('hospital_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (hospitalError) {
        console.error('Hospital fetch error:', hospitalError);
        throw hospitalError;
      }

      if (!hospitalData) {
        throw new Error('Hospital not found');
      }

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('hospital_blood_inventory')
        .select('*')
        .eq('hospital_id', id);

      if (inventoryError) {
        console.error('Inventory fetch error:', inventoryError);
        throw inventoryError;
      }

      setHospital({
        ...hospitalData,
        inventory: inventoryData || []
      });
      setError(null);
    } catch (error: any) {
      console.error('Error fetching hospital:', error);
      const errorMessage = error.message || 'Failed to fetch hospital details. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
            <Building2 className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-medium">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  if (error || (!loading && !hospital)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Hospital not found'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/dashboard/user/bloodconnect?tab=hospitals')} 
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hospitals
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  if (id) fetchHospital();
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hospital || !hospital.id) {
    return null;
  }

  const totalAvailable = hospital.inventory.reduce((sum, inv) => sum + (inv.units_available - (inv.units_reserved || 0)), 0);
  const totalUnits = hospital.inventory.reduce((sum, inv) => sum + inv.units_available, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/user/bloodconnect?tab=hospitals')}
            className="mb-4 hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hospitals
          </Button>
          
          {/* Hospital Header Card */}
          <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white rounded-xl shadow-md">
                    <Building2 className="h-10 w-10 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl mb-2 text-gray-900">
                      {hospital.hospital_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Droplet className="h-3 w-3 mr-1" />
                        {totalAvailable} Units Available
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{hospital.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{hospital.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{hospital.email}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/dashboard/user/bloodconnect/chat?hospitalId=${hospital.id}&hospitalName=${encodeURIComponent(hospital.hospital_name)}`)}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat with Hospital
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Blood Inventory - Left Side */}
          <div className="lg:col-span-1">
            <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b-2 border-red-100">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Droplet className="h-6 w-6 text-red-600" />
                  </div>
                  Blood Inventory
                </CardTitle>
                <CardDescription>
                  Real-time availability status
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {hospital.inventory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 p-4 bg-gray-100 rounded-full w-fit">
                      <Droplet className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground font-medium">No blood inventory available</p>
                    <p className="text-xs text-muted-foreground mt-2">Please check back later</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <p className="text-xs font-medium text-green-700 mb-1">Available</p>
                        <p className="text-2xl font-bold text-green-700">{totalAvailable}</p>
                        <p className="text-xs text-green-600">units ready</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                        <p className="text-xs font-medium text-blue-700 mb-1">Total Stock</p>
                        <p className="text-2xl font-bold text-blue-700">{totalUnits}</p>
                        <p className="text-xs text-blue-600">units total</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Blood Groups Grid */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700 mb-3">By Blood Group</p>
                      <div className="grid grid-cols-2 gap-3">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => {
                          const inventoryItem = hospital.inventory.find(inv => inv.blood_group === bg);
                          const available = inventoryItem ? inventoryItem.units_available - (inventoryItem.units_reserved || 0) : 0;
                          const total = inventoryItem ? inventoryItem.units_available : 0;
                          const reserved = inventoryItem ? (inventoryItem.units_reserved || 0) : 0;
                          const isAvailable = available > 0;
                          
                          return (
                            <div
                              key={bg}
                              className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                                isAvailable
                                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Droplet className={`h-5 w-5 ${isAvailable ? 'text-red-600' : 'text-gray-400'}`} />
                                  <span className="font-bold text-lg text-gray-900">{bg}</span>
                                </div>
                                {isAvailable && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    Available
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-baseline gap-1">
                                  <span className={`text-3xl font-bold ${isAvailable ? 'text-green-700' : 'text-gray-400'}`}>
                                    {available}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">units</span>
                                </div>
                                {total > 0 && (
                                  <div className="pt-2 border-t border-gray-200 space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">Total:</span>
                                      <span className="font-semibold text-gray-700">{total}</span>
                                    </div>
                                    {reserved > 0 && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Reserved:</span>
                                        <span className="font-semibold text-orange-600">{reserved}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Request Form - Right Side (2 columns) */}
          <div className="lg:col-span-2">
            <HospitalRequestForm
              hospitalId={hospital.id}
              hospitalName={hospital.hospital_name}
              onSuccess={() => {
                navigate('/dashboard/user/bloodconnect?tab=my-requests');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDetail;
