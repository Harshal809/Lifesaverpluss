import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Droplet, Plus, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import BloodRequestList from '@/components/BloodRequestList';

interface BloodInventory {
  id: string;
  hospital_id: string;
  blood_group: string;
  units_available: number;
  units_reserved: number;
  last_updated: string;
  expiry_dates: string[] | null;
}

interface HospitalBloodRequest {
  id: string;
  hospital_id: string;
  blood_group: string;
  units_required: number;
  units_received: number;
  urgency_level: string;
  status: string;
  created_at: string;
}

const HospitalBloodConnect = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [requests, setRequests] = useState<HospitalBloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    blood_group: '',
    units_available: 0,
    units_reserved: 0,
  });
  const [requestFormData, setRequestFormData] = useState({
    blood_group: '',
    units_required: 1,
    urgency_level: 'normal' as 'normal' | 'urgent' | 'critical',
  });

  useEffect(() => {
    fetchInventory();
    fetchHospitalRequests();
  }, [user]);

  const fetchInventory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hospital_blood_inventory')
        .select('*')
        .eq('hospital_id', user.id)
        .order('blood_group', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitalRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hospital_blood_requests')
        .select('*')
        .eq('hospital_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
    }
  };

  const updateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.blood_group || formData.units_available < 0) return;

    try {
      const { error } = await supabase
        .from('hospital_blood_inventory')
        .upsert({
          hospital_id: user.id,
          blood_group: formData.blood_group,
          units_available: formData.units_available,
          units_reserved: formData.units_reserved || 0,
        }, {
          onConflict: 'hospital_id,blood_group'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Inventory updated successfully',
      });

      setFormData({ blood_group: '', units_available: 0, units_reserved: 0 });
      fetchInventory();
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update inventory',
        variant: 'destructive',
      });
    }
  };

  const createHospitalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !requestFormData.blood_group || requestFormData.units_required < 1) return;

    try {
      const { error } = await supabase
        .from('hospital_blood_requests')
        .insert({
          hospital_id: user.id,
          blood_group: requestFormData.blood_group,
          units_required: requestFormData.units_required,
          urgency_level: requestFormData.urgency_level,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Blood request created successfully',
      });

      setRequestFormData({ blood_group: '', units_required: 1, urgency_level: 'normal' });
      fetchHospitalRequests();
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request',
        variant: 'destructive',
      });
    }
  };

  const getInventoryStats = () => {
    const total = inventory.reduce((sum, item) => sum + item.units_available, 0);
    const reserved = inventory.reduce((sum, item) => sum + item.units_reserved, 0);
    const available = total - reserved;
    const lowStock = inventory.filter(item => item.units_available < 10).length;

    return { total, reserved, available, lowStock };
  };

  const stats = getInventoryStats();

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          Hospital Blood Management
        </h1>
        <p className="text-gray-600">
          Manage blood inventory and requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Units</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reserved</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.reserved}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="create-request">
            <Plus className="h-4 w-4 mr-2" />
            Create Request
          </TabsTrigger>
          <TabsTrigger value="all-requests">
            <Droplet className="h-4 w-4 mr-2" />
            All Requests
          </TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Update Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={updateInventory} className="space-y-4">
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
                    <Label htmlFor="units_available">Units Available *</Label>
                    <Input
                      id="units_available"
                      type="number"
                      min="0"
                      value={formData.units_available}
                      onChange={(e) => setFormData({ ...formData, units_available: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="units_reserved">Units Reserved</Label>
                    <Input
                      id="units_reserved"
                      type="number"
                      min="0"
                      value={formData.units_reserved}
                      onChange={(e) => setFormData({ ...formData, units_reserved: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Update Inventory
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No inventory records</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inventory.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-red-100 text-red-800 text-base px-3 py-1">
                            {item.blood_group}
                          </Badge>
                          <span className={`text-sm font-semibold ${
                            item.units_available < 10 ? 'text-red-600' : 
                            item.units_available < 20 ? 'text-orange-600' : 
                            'text-green-600'
                          }`}>
                            {item.units_available - (item.units_reserved || 0)} available
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Total: {item.units_available} units</p>
                          {item.units_reserved > 0 && (
                            <p>Reserved: {item.units_reserved} units</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => setFormData({
                            blood_group: item.blood_group,
                            units_available: item.units_available,
                            units_reserved: item.units_reserved || 0,
                          })}
                        >
                          Update
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Create Request Tab */}
        <TabsContent value="create-request" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Hospital Blood Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createHospitalRequest} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="request_blood_group">Blood Group *</Label>
                    <Select
                      value={requestFormData.blood_group}
                      onValueChange={(value) => setRequestFormData({ ...requestFormData, blood_group: value })}
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
                    <Label htmlFor="request_units_required">Units Required *</Label>
                    <Input
                      id="request_units_required"
                      type="number"
                      min="1"
                      value={requestFormData.units_required}
                      onChange={(e) => setRequestFormData({ ...requestFormData, units_required: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="request_urgency_level">Urgency Level *</Label>
                  <Select
                    value={requestFormData.urgency_level}
                    onValueChange={(value: 'normal' | 'urgent' | 'critical') => 
                      setRequestFormData({ ...requestFormData, urgency_level: value })
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

                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                  Create Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {requests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>My Hospital Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requests.slice(0, 5).map((req) => (
                    <div key={req.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <Badge className="bg-red-100 text-red-800 mr-2">{req.blood_group}</Badge>
                        <span className="text-sm">{req.units_required} units • {req.urgency_level}</span>
                      </div>
                      <Badge variant={req.status === 'active' ? 'default' : 'secondary'}>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Requests Tab */}
        <TabsContent value="all-requests" className="space-y-4">
          <BloodRequestList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HospitalBloodConnect;

