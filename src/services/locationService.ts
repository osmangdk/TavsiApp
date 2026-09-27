import * as Location from 'expo-location';

export const ANKARA_COORDS = {
  latitude: 39.9334,
  longitude: 32.8597,
};

export const DEFAULT_MAP_REGION = {
  latitude: ANKARA_COORDS.latitude,
  longitude: ANKARA_COORDS.longitude,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * Konum izni durumunu kontrol eder
 */
export async function checkLocationPermission(): Promise<Location.PermissionStatus> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  } catch (error) {
    console.warn('Konum izni kontrol edilirken hata:', error);
    return Location.PermissionStatus.UNDETERMINED;
  }
}

/**
 * Kullanıcıdan konum izni ister (sistem izin modalı gösterilir)
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch (error) {
    console.warn('Konum izni istenirken hata:', error);
    return false;
  }
}

/**
 * Kullanıcının anlık konumunu alır (GPS).
 * İzin verilmemişse kullanıcıdan izin ister.
 */
export async function getCurrentUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const granted = await requestLocationPermission();
    if (!granted) {
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (posError) {
      console.warn('getCurrentPositionAsync hatası, son bilinen konuma bakılıyor:', posError);
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown?.coords) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }
      return null;
    }
  } catch (error) {
    console.warn('Kullanıcı konumu alınamadı:', error);
    return null;
  }
}

/**
 * Haversine formülü ile iki koordinat arası kuş uçuşu mesafeyi km olarak hesaplar
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Dünya yarıçapı km
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
}

/**
 * Mesafeyi insan tarafından okunabilir metne çevirir (örn: '450 m', '2.3 km')
 */
export function formatDistanceStr(distKm: number): string {
  if (isNaN(distKm) || distKm < 0) return '';
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}
