import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

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
}

export default function MapComponent({ places, initialRegion }: MapComponentProps) {
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
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeCategory}>{place.category}</Text>
                <Text style={styles.placeRating}>{'⭐'.repeat(place.rating)}</Text>
                {place.recommendedBy && (
                  <Text style={styles.recommendedBy}>Öneren: {place.recommendedBy}</Text>
                )}
                {place.reviewText && (
                  <Text style={styles.reviewText} numberOfLines={2}>{place.reviewText}</Text>
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
    color: '#64748B',
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
