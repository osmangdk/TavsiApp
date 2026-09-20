import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCategory } from '../utils/categoryTranslator';
import { useTheme } from '../contexts/ThemeContext';

// Custom Tavsi Pin Icon for Leaflet Web
const createCustomIcon = () => {
  return L.divIcon({
    className: 'tavsi-custom-pin',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #9D4EDD 0%, #7B2CBF 100%);
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #7B2CBF;
        "></div>
      </div>
    `,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
};

const customPinIcon = createCustomIcon();

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

function RecenterHelper({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom, { animate: true });
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [center[0], center[1], zoom]);
  return null;
}

export default function MapComponent({ places, initialRegion }: MapComponentProps) {
  const { language } = useTheme();
  const validPlaces = (places || []).filter(
    (p) =>
      p &&
      p.latitude !== undefined &&
      p.longitude !== undefined &&
      !isNaN(Number(p.latitude)) &&
      !isNaN(Number(p.longitude)) &&
      Number(p.latitude) !== 0 &&
      Number(p.longitude) !== 0
  );

  const center: [number, number] = initialRegion && !isNaN(Number(initialRegion.latitude)) && !isNaN(Number(initialRegion.longitude))
    ? [Number(initialRegion.latitude), Number(initialRegion.longitude)]
    : validPlaces.length > 0
    ? [Number(validPlaces[0].latitude), Number(validPlaces[0].longitude)]
    : [39.9334, 32.8597];

  const zoom = initialRegion && initialRegion.latitudeDelta && Number(initialRegion.latitudeDelta) < 0.02 ? 15 : 13;

  return (
    <View style={styles.container}>
      <MapContainer 
        key={`${center[0].toFixed(4)}_${center[1].toFixed(4)}_${validPlaces.length}`}
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <RecenterHelper center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validPlaces.map((place) => {
          const lat = Number(place.latitude);
          const lng = Number(place.longitude);
          return (
            <Marker 
              key={place.id} 
              position={[lat, lng]}
              icon={customPinIcon}
            >
              <Popup>
                <div style={{ minWidth: 150, fontFamily: 'sans-serif' }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>{place.name}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: 12, color: '#7B2CBF', fontWeight: '600' }}>📍 {formatCategory(place.category, language, place.name)}</p>
                  {place.rating > 0 && <p style={{ margin: '0 0 5px 0' }}>{'⭐'.repeat(Math.min(place.rating, 5))}</p>}
                  {place.recommendedBy && (
                    <p style={{ margin: '0 0 5px 0', fontSize: 12, fontWeight: 'bold', color: '#475569' }}>
                      {place.recommendedBy}
                    </p>
                  )}
                  {place.reviewText && (
                    <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', color: '#64748B' }}>
                      "{place.reviewText}"
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
