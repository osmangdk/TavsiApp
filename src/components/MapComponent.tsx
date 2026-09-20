/**
 * MapComponent.tsx
 *
 * OSM tile tabanlı interaktif harita.
 * - WebView gerektirmez (native Image bileşeni kullanır)
 * - API key gerektirmez (openstreetmap.org ücretsiz tile sunucusu)
 * - Sokak/cadde isimleri tam görünür (Google Maps karşılaştırmalı zoom 15)
 * - Tıklanınca Google/Apple Haritalar açılır
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  Image,
  Text,
  LayoutChangeEvent,
} from 'react-native';
import { MapPin, ExternalLink, Navigation2 } from 'lucide-react-native';

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
  onRegionChangeComplete?: (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => void;
  liteMode?: boolean;
}

const TILE_SIZE = 256;

/** Enlem/boylamı OSM tile koordinatına ve tile içi piksel ofsetine çevirir */
function latLngToTileInfo(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const latRad = (lat * Math.PI) / 180;
  const xFrac = ((lng + 180) / 360) * n;
  const yFrac =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n;
  const tileX = Math.floor(xFrac);
  const tileY = Math.floor(yFrac);
  const pixelX = (xFrac - tileX) * TILE_SIZE; // 0-256, tile içi x pikseli
  const pixelY = (yFrac - tileY) * TILE_SIZE; // 0-256, tile içi y pikseli
  return { tileX, tileY, pixelX, pixelY };
}

function openInMaps(lat: number, lng: number, label?: string) {
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
}: MapComponentProps) {
  const [containerW, setContainerW] = useState(350);
  const [containerH, setContainerH] = useState(210);

  const defaultLat = 39.9334;
  const defaultLng = 32.8597;

  const validPlaces = (places || []).filter(
    (p) =>
      p &&
      !isNaN(Number(p.latitude)) &&
      !isNaN(Number(p.longitude)) &&
      Number(p.latitude) !== 0 &&
      Number(p.longitude) !== 0
  );

  const lat =
    initialRegion && !isNaN(Number(initialRegion.latitude))
      ? Number(initialRegion.latitude)
      : validPlaces.length > 0
      ? Number(validPlaces[0].latitude)
      : defaultLat;

  const lng =
    initialRegion && !isNaN(Number(initialRegion.longitude))
      ? Number(initialRegion.longitude)
      : validPlaces.length > 0
      ? Number(validPlaces[0].longitude)
      : defaultLng;

  const placeName = validPlaces[0]?.name;

  // Lite mod — küçük tıklanabilir rozet
  if (liteMode) {
    return (
      <TouchableOpacity
        style={styles.liteBadge}
        onPress={() => openInMaps(lat, lng, placeName)}
        activeOpacity={0.8}
      >
        <MapPin size={14} color="#7B2CBF" />
        <Text style={styles.liteBadgeText}>Haritada Gör</Text>
      </TouchableOpacity>
    );
  }

  /** Haritanın kap boyutunu ölç */
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0) setContainerW(width);
    if (height > 0) setContainerH(height);
  };

  // ── Tile hesaplama ──
  // zoom 16 → Sokak ve cadde isimlerini en net gösteren ölçek (Google Maps cadde görünümü)
  const zoom = 16;
  const { tileX, tileY, pixelX, pixelY } = latLngToTileInfo(lat, lng, zoom);

  // 3×3 tile grid göster; lat/lng tam merkeze gelsin
  // Grid sol üst köşe = (containerW/2) - (TILE_SIZE + pixelX)
  const gridLeft = containerW / 2 - TILE_SIZE - pixelX;
  const gridTop  = containerH / 2 - TILE_SIZE - pixelY;

  // OSM Almanya CDN subdomain round-robin (a/b/c) — engelleme ve API key yok
  const subs = ['a', 'b', 'c'];

  const tiles: { dx: number; dy: number; url: string; headers: Record<string, string> }[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = tileX + dx;
      const ty = tileY + dy;
      const s = subs[Math.abs(tx + ty) % 3];
      // tile.openstreetmap.de: Ücretsiz, filigransız (watermark yok), API key gerektirmez
      tiles.push({
        dx,
        dy,
        url: `https://${s}.tile.openstreetmap.de/${zoom}/${tx}/${ty}.png`,
        headers: {
          'User-Agent': 'TavsiMobile/1.0',
        },
      });
    }
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.92}
      onPress={() => openInMaps(lat, lng, placeName)}
      onLayout={onLayout}
    >
      {/* ── OSM Tile Grid ── */}
      <View
        style={[
          styles.tileGrid,
          { left: gridLeft, top: gridTop },
        ]}
        pointerEvents="none"
      >
        {tiles.map(({ dx, dy, url, headers }) => (
          <Image
            key={`${dx}_${dy}`}
            source={{ uri: url, headers }}
            style={{
              position: 'absolute',
              left: (dx + 1) * TILE_SIZE,
              top:  (dy + 1) * TILE_SIZE,
              width:  TILE_SIZE,
              height: TILE_SIZE,
            }}
            fadeDuration={150}
          />
        ))}
      </View>

      {/* ── Merkez Pin (Google Maps tarzı, ucu tam koordinata denk) ── */}
      <View
        style={[
          styles.pinWrapper,
          {
            left: containerW / 2 - 18,
            top:  containerH / 2 - 44,
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.pinHead}>
          <MapPin size={24} color="#FFFFFF" />
        </View>
        <View style={styles.pinStem} />
        <View style={styles.pinShadow} />
      </View>

      {/* ── Alt Bilgi Bandı ── */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerLeft}>
          <Navigation2 size={11} color="#475569" />
          <Text style={styles.infoCoords} numberOfLines={1}>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </Text>
        </View>
        <View style={styles.openBtn}>
          <ExternalLink size={11} color="#7B2CBF" />
          <Text style={styles.openBtnText}>Haritada Aç</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0EBE3',
  },

  /** 3×3 tile grid — 768×768 px, konuma göre kaydırılır */
  tileGrid: {
    position: 'absolute',
    width:  TILE_SIZE * 3,
    height: TILE_SIZE * 3,
  },

  /** Merkez pin */
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: 36,
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  pinStem: {
    width: 3,
    height: 8,
    backgroundColor: '#E53E3E',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.18)',
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
