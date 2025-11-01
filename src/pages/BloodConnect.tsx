import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import BloodDonorRegistration from '@/components/BloodDonorRegistration';
import BloodRequestForm from '@/components/BloodRequestForm';
import BloodRequestList from '@/components/BloodRequestList';
import BloodDonorList from '@/components/BloodDonorList';
import { Heart, Droplet, List, Users, Plus } from 'lucide-react';
import { useBloodDonor } from '@/hooks/useBloodDonor';

const BloodConnect = () => {
  const { isDonor } = useBloodDonor();
  const [activeTab, setActiveTab] = useState('donors');

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Heart className="h-8 w-8 text-red-600" />
          Blood Connect
        </h1>
        <p className="text-gray-600">
          Connect with donors, request blood, and save lives
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="donors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Find Donors</span>
            <span className="sm:hidden">Donors</span>
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Register</span>
            <span className="sm:hidden">Donate</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Droplet className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
            <span className="sm:hidden">Need</span>
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">My Requests</span>
            <span className="sm:hidden">Mine</span>
          </TabsTrigger>
        </TabsList>

        {/* Find Donors Tab */}
        <TabsContent value="donors" className="space-y-4">
          <BloodDonorList />
        </TabsContent>

        {/* Register as Donor Tab */}
        <TabsContent value="register" className="space-y-4">
          <BloodDonorRegistration />
        </TabsContent>

        {/* Create Request Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <BloodRequestForm onSuccess={() => setActiveTab('my-requests')} />
            </div>
            <div>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">How it works</h3>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-gray-600">
                      <li>Fill in the blood request form with all required details</li>
                      <li>Set the urgency level (Normal, Urgent, or Critical)</li>
                      <li>Available donors will see your request</li>
                      <li>Donors can contact you directly or chat with you</li>
                      <li>Coordinate the donation and mark request as fulfilled</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="my-requests" className="space-y-4">
          <BloodRequestList showMyRequests={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BloodConnect;

