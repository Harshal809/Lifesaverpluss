import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";
import { NearbyRespondersCard } from "./NearbyRespondersCard";

interface StatusCardsProps {
  location: string;
  contactsCount: number;
  userLat?: number;
  userLng?: number;
}

export const StatusCards = ({ location, contactsCount, userLat, userLng }: StatusCardsProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">Current Location</p>
              <p className="text-lg font-bold text-gray-900 truncate">{location}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <MapPin className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/30 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-1">Emergency Contacts</p>
              <p className="text-lg font-bold text-gray-900">{contactsCount} Active</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
              <Users className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <NearbyRespondersCard
        userLat={userLat}
        userLng={userLng}
      />
    </div>
  );
};

