import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';

// Web'de Leaflet kullanmak için dinamik import veya require
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in React apps
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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
  const center: [number, number] = initialRegion 
    ? [initialRegion.latitude, initialRegion.longitude]
    : [39.92077, 32.85411];

  return (
    <View style={styles.container}>
      {/* Web'de MapContainer için div benzeri bir stil gerekiyor, View içindeyiz ama MapContainer tam yüksekliği almalı */}
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((place) => (
          <Marker 
            key={place.id} 
            position={[place.latitude, place.longitude]}
          >
            <Popup>
              <div style={{ minWidth: 150 }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: 14 }}>{place.name}</h4>
                <p style={{ margin: '0 0 5px 0', fontSize: 12, color: '#64748B' }}>{place.category}</p>
                <p style={{ margin: '0 0 5px 0' }}>{'⭐'.repeat(place.rating)}</p>
                {place.recommendedBy && (
                  <p style={{ margin: '0 0 5px 0', fontSize: 12, fontWeight: 'bold', color: '#7B2CBF' }}>
                    Öneren: {place.recommendedBy}
                  </p>
                )}
                {place.reviewText && (
                  <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', color: '#475569' }}>
                    "{place.reviewText}"
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  }
});
