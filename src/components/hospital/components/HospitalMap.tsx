import React, { useEffect, useRef, useState } from 'react';

interface SOSRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  latitude: number;
  longitude: number;
  emergency_type: string;
  description: string | null;
  status: string;
  created_at: string | null;
}

interface HospitalMapProps {
  sosRequests: SOSRequest[];
  hospitalLocation?: { lat: number; lng: number };
}

const HospitalMap: React.FC<HospitalMapProps> = ({ sosRequests, hospitalLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // Get hospital location or use geolocation
  useEffect(() => {
    const getLocation = () => {
      if (hospitalLocation) {
        setCurrentLocation([hospitalLocation.lat, hospitalLocation.lng]);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation([position.coords.latitude, position.coords.longitude]);
          },
          () => {
            // Default fallback location
            setCurrentLocation([28.6139, 77.2090]); // Delhi
          }
        );
      } else {
        setCurrentLocation([28.6139, 77.2090]);
      }
    };
    getLocation();
  }, [hospitalLocation]);

  // Initialize map
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        if (!mapContainer.current || !currentLocation) return;

        // Fix default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Initialize map
        mapRef.current = L.map(mapContainer.current).setView(currentLocation, 11);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        // Add hospital marker
        const hospitalIcon = L.divIcon({
          html: `
            <div style="
              width: 40px; 
              height: 40px; 
              background: #3b82f6; 
              border: 4px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            ">🏥</div>
            <div style="
              position: absolute; 
              top: -35px; 
              left: 50%; 
              transform: translateX(-50%); 
              background: #3b82f6; 
              color: white; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 11px; 
              font-weight: bold; 
              white-space: nowrap;
            ">Hospital</div>
          `,
          className: 'hospital-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        L.marker(currentLocation, { icon: hospitalIcon }).addTo(mapRef.current);

        setIsMapReady(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    if (currentLocation) {
      loadLeaflet();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentLocation, hospitalLocation]);

  // Add SOS request markers
  useEffect(() => {
    if (!mapRef.current || !isMapReady || sosRequests.length === 0 || !currentLocation) return;

    const loadMarkersAsync = async () => {
      try {
        const L = await import('leaflet');

        // Remove old markers
        markers.forEach(marker => mapRef.current.removeLayer(marker));
        const newMarkers: any[] = [];

        sosRequests.forEach((request) => {
          if (!request.latitude || !request.longitude) return;

          const getStatusColor = (status: string): string => {
            switch (status) {
              case 'active': return '#ef4444';
              case 'pending': return '#f59e0b';
              case 'acknowledged': return '#3b82f6';
              case 'resolved': return '#10b981';
              default: return '#6b7280';
            }
          };

          const getEmergencyIcon = (type: string): string => {
            switch (type) {
              case 'medical': return '🚑';
              case 'safety': return '🛡️';
              case 'general': return '🚨';
              default: return '⚠️';
            }
          };

          const color = getStatusColor(request.status);
          const icon = getEmergencyIcon(request.emergency_type);

          // Calculate distance from hospital
          const distance = calculateDistance(
            currentLocation[0], currentLocation[1],
            request.latitude, request.longitude
          );

          const sosIcon = L.divIcon({
            html: `
              <div style="
                width: 36px; 
                height: 36px; 
                background: ${color}; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                cursor: pointer;
                animation: pulse 2s infinite;
              ">${icon}</div>
              <div style="
                position: absolute; 
                top: -40px; 
                left: 50%; 
                transform: translateX(-50%); 
                background: ${color}; 
                color: white; 
                padding: 3px 8px; 
                border-radius: 4px; 
                font-size: 10px; 
                font-weight: bold; 
                white-space: nowrap;
                border: 1px solid white;
              ">${request.status.toUpperCase()}</div>
              <style>
                @keyframes pulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.1); }
                }
              </style>
            `,
            className: 'sos-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          const marker = L.marker([request.latitude, request.longitude], { icon: sosIcon })
            .bindPopup(`
              <div style="font-family: sans-serif; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: bold;">
                  ${request.emergency_type.toUpperCase()} Emergency
                </h3>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Patient:</strong> ${request.user_name}</p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Phone:</strong> <a href="tel:${request.user_phone}" style="color: #3b82f6;">${request.user_phone}</a></p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Status:</strong> <span style="color: ${color};">${request.status.toUpperCase()}</span></p>
                <p style="margin: 4px 0; font-size: 12px;"><strong>Distance:</strong> ${distance.toFixed(1)} km</p>
                ${request.description ? `<p style="margin: 4px 0; font-size: 11px; color: #6b7280;"><strong>Note:</strong> ${request.description}</p>` : ''}
                <p style="margin: 8px 0 0 0; font-size: 10px; color: #9ca3af;">${request.created_at ? new Date(request.created_at).toLocaleString() : ''}</p>
                <a href="https://www.google.com/maps?q=${request.latitude},${request.longitude}" target="_blank" style="
                  display: inline-block;
                  background: #3b82f6; 
                  color: white; 
                  border: none; 
                  padding: 4px 12px; 
                  border-radius: 4px; 
                  font-size: 11px; 
                  cursor: pointer; 
                  margin-top: 8px;
                  text-decoration: none;
                ">Navigate</a>
              </div>
            `)
            .addTo(mapRef.current);

          newMarkers.push(marker);
        });

        setMarkers(newMarkers);

        // Fit map to show all markers
        if (newMarkers.length > 0) {
          const group = new (await import('leaflet')).LayerGroup(newMarkers);
          mapRef.current.fitBounds(group.getBounds().extend(currentLocation), { padding: [50, 50] });
        }

      } catch (error) {
        console.error('Error adding markers:', error);
      }
    };

    loadMarkersAsync();
  }, [sosRequests, isMapReady, currentLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const activeCount = sosRequests.filter(r => r.status === 'active' || r.status === 'pending').length;
  const acknowledgedCount = sosRequests.filter(r => r.status === 'acknowledged').length;

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />

      {/* Map legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg z-10 max-w-xs">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">🏥</div>
            <span className="text-gray-700">Hospital Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">🚑 Active Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">⚠️ Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">✓ Acknowledged</span>
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg z-10">
        <div className="space-y-2 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">{activeCount}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div className="border-t pt-2">
            <div className="text-xl font-bold text-blue-600">{acknowledgedCount}</div>
            <div className="text-xs text-gray-600">Acknowledged</div>
          </div>
          <div className="border-t pt-2">
            <div className="text-lg font-bold text-gray-700">{sosRequests.length}</div>
            <div className="text-xs text-gray-600">Total Assigned</div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/20 rounded-lg z-20">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalMap;

