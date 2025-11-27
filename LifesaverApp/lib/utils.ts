// Utility function to calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  // Convert degrees to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
}

// Parse responder location string format: "(lng,lat)"
export function parseResponderLocation(
  locationStr: string | null | undefined
): { lat: number; lng: number } | null {
  if (!locationStr) return null;

  // Try to parse JSON first
  try {
    const parsed = JSON.parse(locationStr);
    if (parsed.lat && parsed.lng) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
    if (parsed.latitude && parsed.longitude) {
      return { lat: parsed.latitude, lng: parsed.longitude };
    }
  } catch {
    // Not JSON, try string format
  }

  // Try to parse "(lng,lat)" format
  const match = locationStr.match(/\(([^,]+),([^)]+)\)/);
  if (match) {
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

