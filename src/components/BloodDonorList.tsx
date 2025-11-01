import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Heart, MapPin, Phone, Calendar, User, Search, Filter } from 'lucide-react';
import { useBloodDonor } from '@/hooks/useBloodDonor';

interface BloodDonor {
  id: string;
  user_id: string;
  blood_group: string;
  is_available: boolean;
  next_available_date: string | null;
  donation_count: number;
  city: string | null;
  state: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface BloodDonorListProps {
  bloodGroupFilter?: string;
  onDonorSelect?: (donor: BloodDonor) => void;
}

const BloodDonorList = ({ bloodGroupFilter, onDonorSelect }: BloodDonorListProps) => {
  const { user } = useAuth();
  const { isDonor, donorProfile } = useBloodDonor();
  const { toast } = useToast();
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState(bloodGroupFilter || 'all');
  const [filterCity, setFilterCity] = useState('all');

  useEffect(() => {
    fetchDonors();
  }, [filterBloodGroup, filterCity]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blood_donors')
        .select(`
          *,
          profiles:profiles!blood_donors_user_id_fkey(first_name, last_name, phone)
        `)
        .eq('is_available', true);

      // Filter by blood group
      if (filterBloodGroup !== 'all') {
        query = query.eq('blood_group', filterBloodGroup);
      }

      // Filter by city
      if (filterCity !== 'all') {
        query = query.eq('city', filterCity);
      }

      // Exclude current user if they are a donor
      if (user && isDonor && donorProfile) {
        query = query.neq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDonors(data || []);
    } catch (error) {
      console.error('Error fetching donors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch blood donors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = donors.filter((donor) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const name = `${donor.profiles?.first_name || ''} ${donor.profiles?.last_name || ''}`.toLowerCase();
    return (
      name.includes(searchLower) ||
      donor.city?.toLowerCase().includes(searchLower) ||
      donor.state?.toLowerCase().includes(searchLower) ||
      donor.blood_group.toLowerCase().includes(searchLower)
    );
  });

  const cities = Array.from(new Set(donors.map(d => d.city).filter(Boolean))) as string[];

  const canDonateNow = (donor: BloodDonor) => {
    if (!donor.next_available_date) return true;
    return new Date(donor.next_available_date) <= new Date();
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Available Blood Donors
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {filteredDonors.length} donor{filteredDonors.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 mt-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterBloodGroup} onValueChange={setFilterBloodGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blood Groups</SelectItem>
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

          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger>
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p>Loading donors...</p>
          </div>
        ) : filteredDonors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No donors found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDonors.map((donor) => {
              const name = `${donor.profiles?.first_name || ''} ${donor.profiles?.last_name || ''}`.trim() || 'Anonymous';
              const availableNow = canDonateNow(donor);

              return (
                <div
                  key={donor.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className="bg-red-100 text-red-800">
                              {donor.blood_group}
                            </Badge>
                            {availableNow ? (
                              <Badge className="bg-green-100 text-green-800">
                                Available Now
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                Available from {new Date(donor.next_available_date!).toLocaleDateString()}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {donor.donation_count} donation{donor.donation_count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 mt-3">
                        {donor.city && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{donor.city}{donor.state ? `, ${donor.state}` : ''}</span>
                          </div>
                        )}
                        {donor.profiles?.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${donor.profiles.phone}`} className="text-blue-600 hover:text-blue-800">
                              {donor.profiles.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {onDonorSelect && (
                        <Button
                          size="sm"
                          onClick={() => onDonorSelect(donor)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Contact
                        </Button>
                      )}
                      {donor.profiles?.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`tel:${donor.profiles?.phone}`)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BloodDonorList;

