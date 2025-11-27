import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface BloodInventory {
  units_available: number;
  units_reserved: number;
}

interface BloodInventoryStatsCardsProps {
  inventory: BloodInventory[];
}

export const BloodInventoryStatsCards = ({ inventory }: BloodInventoryStatsCardsProps) => {
  const total = inventory.reduce((sum, item) => sum + item.units_available, 0);
  const reserved = inventory.reduce((sum, item) => sum + item.units_reserved, 0);
  const available = total - reserved;
  const lowStock = inventory.filter(item => item.units_available < 10).length;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 font-medium mb-1">Total Units</p>
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-xs text-blue-100 mt-1">All blood groups</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Package className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 font-medium mb-1">Available</p>
              <p className="text-3xl font-bold">{available}</p>
              <p className="text-xs text-green-100 mt-1">Ready to use</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100 font-medium mb-1">Reserved</p>
              <p className="text-3xl font-bold">{reserved}</p>
              <p className="text-xs text-amber-100 mt-1">Pending requests</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Clock className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-none shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100 font-medium mb-1">Low Stock</p>
              <p className="text-3xl font-bold">{lowStock}</p>
              <p className="text-xs text-red-100 mt-1">Needs attention</p>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

