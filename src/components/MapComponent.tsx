import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { formatCategory } from '../utils/categoryTranslator';

export interface MapPlace {
  id: string;
  name: string;
  category: string;
  rating: number;
  latitude: number;
  longitude: number;
  recommendedBy?: string;
  reviewText?: string;
}

interface MapComponentProps {
  places: MapPlace[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete?: (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => void;
}

// İngilizce → Türkçe kategori çevirisi
const CATEGORY_TR: Record<string, string> = {
  // Yeme & İçme
  'restaurant': 'Restoran',
  'cafe': 'Kafe',
  'fast food': 'Fast Food',
  'fast_food': 'Fast Food',
  'bar': 'Bar',
  'bakery': 'Fırın & Pastane',
  'food': 'Yeme & İçme',
  'coffee shop': 'Kahvehane',
  // Sağlık
  'hospital': 'Hastane',
  'clinic': 'Klinik',
  'pharmacy': 'Eczane',
  'doctor': 'Doktor',
  'dentist': 'Diş Hekimi',
  'veterinary': 'Veteriner',
  // Güzellik & Bakım
  'barber': 'Berber',
  'beauty': 'Güzellik & Bakım',
  'hairdresser': 'Kuaför',
  'nail salon': 'Tırnak Salonu',
  // Alışveriş
  'supermarket': 'Market',
  'convenience': 'Market',
  'clothes': 'Giyim',
  'shoes': 'Ayakkabı',
  'electronics': 'Elektronik',
  'furniture': 'Mobilya',
  'hardware': 'Hırdavat',
  // Finans
  'bank': 'Banka',
  'atm': 'ATM',
  // Eğitim
  'school': 'Okul',
  'university': 'Üniversite',
  'college': 'Kolej',
  'kindergarten': 'Anaokulu',
  // Spor & Eğlence
  'gym': 'Spor Salonu',
  'sports centre': 'Spor Merkezi',
  'sports_centre': 'Spor Merkezi',
  'fitness': 'Fitness',
  // İş & Hizmet
  'coworking space': 'Ortak Çalışma Alanı',
  'coworking_space': 'Ortak Çalışma Alanı',
  'office': 'Ofis',
  'post office': 'Postane',
  'post_office': 'Postane',
  'fuel': 'Akaryakıt',
  'car_wash': 'Oto Yıkama',
  'laundry': 'Çamaşırhane',
  'dry_cleaning': 'Kuru Temizleme',
  // Konaklama
  'hotel': 'Otel',
  'hostel': 'Hostel',
  'motel': 'Motel',
  // Genel
  'place': 'Mekan',
  'hizmet': 'Hizmet',
  'yeme & içme': 'Yeme & İçme',
  'kafe': 'Kafe',
  'hastane': 'Hastane',
  'klinik': 'Klinik',
  'eczane': 'Eczane',
  'berber': 'Berber',
  'banka': 'Banka',
  'okul': 'Okul',
  'spor': 'Spor',
  'market': 'Market',
  'fırın & pastane': 'Fırın & Pastane',
  'güzellik & bakım': 'Güzellik & Bakım',
  'giyim': 'Giyim',
};

function translateCategory(cat: string): string {
  if (!cat) return 'Mekan';
  const lower = cat.toLowerCase().trim();
  return CATEGORY_TR[lower] || cat;
}

export default function MapComponent({ places, initialRegion, onRegionChangeComplete }: MapComponentProps) {
  const defaultRegion = {
    latitude: 39.92077,
    longitude: 32.85411,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={initialRegion || defaultRegion}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.placeName} numberOfLines={2}>{place.name}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.placeCategory}>📍 {formatCategory(place.category)}</Text>
                </View>
                {place.rating > 0 && (
                  <Text style={styles.placeRating}>{'⭐'.repeat(Math.min(place.rating, 5))}</Text>
                )}
                {place.recommendedBy && (
                  <Text style={styles.recommendedBy}>👤 Öneren: {place.recommendedBy}</Text>
                )}
                {place.reviewText && (
                  <Text style={styles.reviewText} numberOfLines={2}>"{place.reviewText}"</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    width: 200,
    padding: 8,
  },
  placeName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: 'rgba(123,44,191,0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  placeRating: {
    fontSize: 12,
    marginBottom: 4,
  },
  recommendedBy: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7B2CBF',
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  }
});
