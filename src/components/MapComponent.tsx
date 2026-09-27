/**
 * MapComponent.tsx
 *
 * OSM tile tabanlı interaktif harita.
 * - API key gerektirmez (openstreetmap.org tile sunucusu)
 * - Çoklu mekan pinleri ve seçim desteği
 * - Kaydırma (Pan/Drag) ve Yakınlaştırma (Zoom +/-)
 * - Anlık kullanıcı konumu (GPS mavi nokta)
 * - Haritaya dokunulduğunda dış uygulamaya atmaz; pin seçilince detay kartı gösterir
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  Image,
  Text,
  LayoutChangeEvent,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { MapPin, ExternalLink, Navigation2, Plus, Minus, LocateFixed } from 'lucide-react-native';

export interface MapPlace {
  id: string;
  name: string;
  category: string;
  rating: number;
  latitude: number;
  longitude: number;
  recommendedBy?: string;
  reviewText?: string;
  district?: string;
  city?: string;
}

interface MapComponentProps {
  places: MapPlace[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
  liteMode?: boolean;
  selectedPlace?: MapPlace | null;
  onSelectPlace?: (place: MapPlace) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  onGoToMyLocation?: () => void;
  isLocating?: boolean;
}

const TILE_SIZE = 256;
const DEFAULT_LAT = 39.9334; // Ankara
const DEFAULT_LNG = 32.8597;

/** Enlem/boylamı OSM tile koordinatına ve piksel ofsetine çevirir */
export function latLngToTileInfo(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const xFrac = ((lng + 180) / 360) * n;
  const yFrac =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return {
    worldX: xFrac * TILE_SIZE,
    worldY: yFrac * TILE_SIZE,
    tileX: Math.floor(xFrac),
    tileY: Math.floor(yFrac),
  };
}

/** Piksel koordinatını enlem/boylama çevirir */
export function worldToLatLng(worldX: number, worldY: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (worldX / (n * TILE_SIZE)) * 360 - 180;
  const yFrac = worldY / (n * TILE_SIZE);
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * yFrac)));
  const lat = (latRad * 180) / Math.PI;
  return { latitude: lat, longitude: lng };
}

export function openInMaps(lat: number, lng: number, label?: string) {
  const encoded = encodeURIComponent(label || 'Mekan');
  const url =
    Platform.select({
      ios: `maps:0,0?q=${encoded}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${encoded})`,
    }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`
    )
  );
}

export default function MapComponent({
  places,
  initialRegion,
  liteMode,
  selectedPlace,
  onSelectPlace,
  userLocation,
  onGoToMyLocation,
  isLocating = false,
  onRegionChangeComplete,
}: MapComponentProps) {
  const [containerW, setContainerW] = useState(350);
  const [containerH, setContainerH] = useState(240);
  const [zoom, setZoom] = useState(16);

  // Harita merkez koordinatları
  const [centerLat, setCenterLat] = useState(() => {
    if (initialRegion?.latitude && !isNaN(Number(initialRegion.latitude))) {
      return Number(initialRegion.latitude);
    }
    return DEFAULT_LAT;
  });

  const [centerLng, setCenterLng] = useState(() => {
    if (initialRegion?.longitude && !isNaN(Number(initialRegion.longitude))) {
      return Number(initialRegion.longitude);
    }
    return DEFAULT_LNG;
  });

  // initialRegion veya selectedPlace değiştiğinde merkezi güncelle
  useEffect(() => {
    if (initialRegion?.latitude && !isNaN(Number(initialRegion.latitude))) {
      setCenterLat(Number(initialRegion.latitude));
      setCenterLng(Number(initialRegion.longitude));
    }
  }, [initialRegion?.latitude, initialRegion?.longitude]);

  useEffect(() => {
    if (selectedPlace?.latitude && selectedPlace?.longitude) {
      setCenterLat(Number(selectedPlace.latitude));
      setCenterLng(Number(selectedPlace.longitude));
    }
  }, [selectedPlace?.id]);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });
  panOffsetRef.current = panOffset;

  const centerLatRef = useRef(centerLat);
  const centerLngRef = useRef(centerLng);
  centerLatRef.current = centerLat;
  centerLngRef.current = centerLng;

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Harita sürükleme (PanResponder)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          return Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
        },
        onPanResponderGrant: () => {
          // Sürükleme başladı
        },
        onPanResponderMove: (_, gesture) => {
          setPanOffset({ x: gesture.dx, y: gesture.dy });
        },
        onPanResponderRelease: (_, gesture) => {
          const cZoom = zoomRef.current;
          const cInfo = latLngToTileInfo(centerLatRef.current, centerLngRef.current, cZoom);
          const newWorldX = cInfo.worldX - gesture.dx;
          const newWorldY = cInfo.worldY - gesture.dy;
          const newCoords = worldToLatLng(newWorldX, newWorldY, cZoom);

          setCenterLat(newCoords.latitude);
          setCenterLng(newCoords.longitude);
          setPanOffset({ x: 0, y: 0 });

          if (onRegionChangeComplete) {
            onRegionChangeComplete({
              latitude: newCoords.latitude,
              longitude: newCoords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        },
        onPanResponderTerminate: () => {
          setPanOffset({ x: 0, y: 0 });
        },
      }),
    [onRegionChangeComplete]
  );

  const validPlaces = useMemo(() => {
    return (places || []).filter(
      (p) =>
        p &&
        !isNaN(Number(p.latitude)) &&
        !isNaN(Number(p.longitude)) &&
        Number(p.latitude) !== 0 &&
        Number(p.longitude) !== 0
    );
  }, [places]);

  // Lite mod — profil veya özet ekranlarındaki küçük rozet
  if (liteMode) {
    const firstPlace = validPlaces[0];
    return (
      <TouchableOpacity
        style={styles.liteBadge}
        onPress={() => openInMaps(centerLat, centerLng, firstPlace?.name)}
        activeOpacity={0.8}
      >
        <MapPin size={14} color="#7B2CBF" />
        <Text style={styles.liteBadgeText}>Haritada Gör</Text>
      </TouchableOpacity>
    );
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0) setContainerW(width);
    if (height > 0) setContainerH(height);
  };

  // Aktif dünya piksel koordinatı (sürükleme ofseti dahil)
  const centerWorld = latLngToTileInfo(centerLat, centerLng, zoom);
  const activeWorldX = centerWorld.worldX - panOffset.x;
  const activeWorldY = centerWorld.worldY - panOffset.y;

  // Ekrana düşen OSM tile aralıkları (1 fazladan kenar tamponu ile)
  const minTileX = Math.floor((activeWorldX - containerW / 2) / TILE_SIZE) - 1;
  const maxTileX = Math.floor((activeWorldX + containerW / 2) / TILE_SIZE) + 1;
  const minTileY = Math.floor((activeWorldY - containerH / 2) / TILE_SIZE) - 1;
  const maxTileY = Math.floor((activeWorldY + containerH / 2) / TILE_SIZE) + 1;

  const subs = ['a', 'b', 'c'];
  const tiles: { key: string; left: number; top: number; url: string }[] = [];

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const left = tx * TILE_SIZE - activeWorldX + containerW / 2;
      const top = ty * TILE_SIZE - activeWorldY + containerH / 2;
      const s = subs[Math.abs(tx + ty) % 3];
      tiles.push({
        key: `${tx}_${ty}_${zoom}`,
        left,
        top,
        url: `https://${s}.tile.openstreetmap.de/${zoom}/${tx}/${ty}.png`,
      });
    }
  }

  // Kullanıcı GPS konumu ekran koordinatları
  let userMarker: { x: number; y: number } | null = null;
  if (userLocation && !isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) {
    const uInfo = latLngToTileInfo(userLocation.latitude, userLocation.longitude, zoom);
    const ux = uInfo.worldX - activeWorldX + containerW / 2;
    const uy = uInfo.worldY - activeWorldY + containerH / 2;
    if (ux >= -30 && ux <= containerW + 30 && uy >= -30 && uy <= containerH + 30) {
      userMarker = { x: ux, y: uy };
    }
  }

  // Mekan pinleri ekran koordinatları
  const visiblePlacePins = validPlaces
    .map((place) => {
      const pInfo = latLngToTileInfo(Number(place.latitude), Number(place.longitude), zoom);
      const px = pInfo.worldX - activeWorldX + containerW / 2;
      const py = pInfo.worldY - activeWorldY + containerH / 2;
      const isVisible = px >= -50 && px <= containerW + 50 && py >= -50 && py <= containerH + 50;
      const isSelected = selectedPlace?.id === place.id;
      return { place, x: px, y: py, isVisible, isSelected };
    })
    .filter((item) => item.isVisible);

  const handleZoomIn = () => {
    if (zoom < 18) setZoom((prev) => prev + 1);
  };

  const handleZoomOut = () => {
    if (zoom > 12) setZoom((prev) => prev - 1);
  };

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      {/* ── OSM Tile Katmanı ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {tiles.map(({ key, left, top, url }) => (
          <Image
            key={key}
            source={{
              uri: url,
              headers: { 'User-Agent': 'TavsiMobile/1.0' },
            }}
            style={{
              position: 'absolute',
              left,
              top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            fadeDuration={100}
          />
        ))}
      </View>

      {/* ── Kullanıcı Konumu (Mavi Nokta) ── */}
      {userMarker && (
        <View
          style={[styles.userDotWrapper, { left: userMarker.x - 14, top: userMarker.y - 14 }]}
          pointerEvents="none"
        >
          <View style={styles.userDotHalo} />
          <View style={styles.userDotCore} />
        </View>
      )}

      {/* ── Mekan Pinleri ── */}
      {visiblePlacePins.map(({ place, x, y, isSelected }) => (
        <TouchableOpacity
          key={place.id}
          activeOpacity={0.8}
          style={[
            styles.placePinTouchArea,
            {
              left: x - 22,
              top: y - 42,
              zIndex: isSelected ? 999 : 50,
            },
          ]}
          onPress={() => onSelectPlace && onSelectPlace(place)}
        >
          {/* Seçili mekan adı etiketi */}
          {isSelected && (
            <View style={styles.selectedPinBadge}>
              <Text style={styles.selectedPinBadgeText} numberOfLines={1}>
                {place.name}
              </Text>
            </View>
          )}

          {/* Pin İkonu */}
          <View style={[styles.pinCircle, isSelected && styles.pinCircleSelected]}>
            <MapPin size={isSelected ? 20 : 16} color="#FFFFFF" />
          </View>
          <View style={[styles.pinPoint, isSelected && styles.pinPointSelected]} />
        </TouchableOpacity>
      ))}

      {/* ── Eğer hiç mekan pini yoksa Merkez Pin ── */}
      {visiblePlacePins.length === 0 && (
        <View
          style={[
            styles.centerPinWrapper,
            { left: containerW / 2 - 18, top: containerH / 2 - 40 },
          ]}
          pointerEvents="none"
        >
          <View style={styles.pinCircle}>
            <MapPin size={20} color="#FFFFFF" />
          </View>
          <View style={styles.pinPoint} />
        </View>
      )}

      {/* ── Harita Kontrolleri (Zoom & GPS) ── */}
      <View style={styles.mapControls} pointerEvents="box-none">
        {onGoToMyLocation && (
          <TouchableOpacity
            style={styles.controlBtn}
            activeOpacity={0.8}
            onPress={onGoToMyLocation}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#7B2CBF" />
            ) : (
              <LocateFixed size={18} color="#7B2CBF" />
            )}
          </TouchableOpacity>
        )}

        <View style={styles.zoomGroup}>
          <TouchableOpacity
            style={styles.zoomBtn}
            activeOpacity={0.8}
            onPress={handleZoomIn}
            disabled={zoom >= 18}
          >
            <Plus size={18} color={zoom >= 18 ? '#CBD5E1' : '#1E293B'} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            activeOpacity={0.8}
            onPress={handleZoomOut}
            disabled={zoom <= 12}
          >
            <Minus size={18} color={zoom <= 12 ? '#CBD5E1' : '#1E293B'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Alt Bilgi Bandı (Koordinat & Haritada Aç) ── */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerLeft}>
          <Navigation2 size={11} color="#475569" />
          <Text style={styles.infoCoords} numberOfLines={1}>
            {centerLat.toFixed(5)}, {centerLng.toFixed(5)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.openBtn}
          activeOpacity={0.8}
          onPress={() => openInMaps(centerLat, centerLng, selectedPlace?.name || validPlaces[0]?.name)}
        >
          <ExternalLink size={11} color="#7B2CBF" />
          <Text style={styles.openBtnText}>Haritada Aç</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0EBE3',
    position: 'relative',
  },

  /** Kullanıcı GPS Mavi Nokta */
  userDotWrapper: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  userDotHalo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  userDotCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },

  /** Mekan Pini Dokunma Alanı */
  placePinTouchArea: {
    position: 'absolute',
    width: 44,
    alignItems: 'center',
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinCircleSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7B2CBF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  pinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E53E3E',
    marginTop: -1,
  },
  pinPointSelected: {
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderTopColor: '#7B2CBF',
  },
  selectedPinBadge: {
    position: 'absolute',
    bottom: 48,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 160,
  },
  selectedPinBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /** Merkez Pin */
  centerPinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: 36,
    zIndex: 30,
  },

  /** Sağ taraftaki kontroller */
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 14,
    gap: 10,
    zIndex: 100,
    alignItems: 'center',
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomBtn: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
  },

  /** Alt bilgi bandı */
  infoBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    zIndex: 80,
  },
  infoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoCoords: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7B2CBF',
  },

  /** Lite mod rozeti */
  liteBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FAF5FF',
  },
  liteBadgeText: {
    fontSize: 11,
    color: '#7B2CBF',
    fontWeight: '700',
  },
});
