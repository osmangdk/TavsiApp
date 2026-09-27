import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, X, TrendingUp, Users, Coffee, Stethoscope, Scissors, Wrench, Map as MapIcon, List, ChevronRight, ExternalLink, AlertCircle, LocateFixed } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import MapComponent, { MapPlace, openInMaps } from '../../components/MapComponent';
import { formatCategory, formatLocation } from '../../utils/categoryTranslator';
import { buildSupabaseOrFilter, classifyOsmCategory, getPhotonSearchQuery } from '../../utils/categoryMatcher';
import {
  DEFAULT_MAP_REGION,
  getCurrentUserLocation,
  calculateDistanceKm,
  formatDistanceStr,
} from '../../services/locationService';

const CATEGORIES = [
  { id: '1', name: 'Yeme İçme', emoji: '🍽️', color: '#F59E0B', keywords: ['restaurant', 'cafe', 'fast_food', 'yemek', 'kafe', 'restoran'] },
  { id: '2', name: 'Sağlık', emoji: '🏥', color: '#10B981', keywords: ['hospital', 'clinic', 'pharmacy', 'doktor', 'eczane'] },
  { id: '3', name: 'Kişisel Bakım', emoji: '✂️', color: '#EC4899', keywords: ['barber', 'beauty', 'salon', 'berber', 'kuaför'] },
  { id: '4', name: 'Hizmetler', emoji: '🔧', color: '#8B5CF6', keywords: ['service', 'repair', 'tamirat', 'usta'] },
];

const FILTERS = ['Tümü', 'Sadece Güvendiklerim', 'Yakınımda'];
const TRENDING_SEARCHES = [
  { key: 'trend_pediatrician', defaultText: 'Çocuk Doktoru' },
  { key: 'trend_italian_restaurant', defaultText: 'İtalyan Restoranı' },
  { key: 'trend_pilates', defaultText: 'Pilates Salonu' },
  { key: 'trend_plumber', defaultText: 'Güvenilir Tesisatçı' },
];

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const { colors, isDark, language, t } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapPlaces, setMapPlaces] = useState<MapPlace[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MapPlace | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionDeniedNotice, setPermissionDeniedNotice] = useState(false);
  const [currentMapRegion, setCurrentMapRegion] = useState(DEFAULT_MAP_REGION);
  const [initialMapRegion, setInitialMapRegion] = useState(DEFAULT_MAP_REGION);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [mapSearchFocused, setMapSearchFocused] = useState(false);

  // Konum izni iste ve kullanıcının anlık GPS konumunu al
  const requestAndApplyUserLocation = async (shouldFetchPlaces = true) => {
    setIsLocating(true);
    try {
      const loc = await getCurrentUserLocation();
      if (loc) {
        setUserLocation(loc);
        setPermissionDeniedNotice(false);
        const userRegion = {
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
        setCurrentMapRegion(userRegion);
        setInitialMapRegion(userRegion);
        if (shouldFetchPlaces) {
          fetchMapPlaces(searchQuery, userRegion);
        }
      } else {
        setPermissionDeniedNotice(true);
        if (shouldFetchPlaces && mapPlaces.length === 0) {
          fetchMapPlaces(searchQuery, DEFAULT_MAP_REGION);
        }
      }
    } catch (e) {
      console.warn('Konum alınırken hata:', e);
      setPermissionDeniedNotice(true);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    requestAndApplyUserLocation(false);
  }, []);

  const getFilterLabel = (fKey: string) => {
    if (fKey === 'Tümü') return t('filter_all');
    if (fKey === 'Sadece Güvendiklerim') return t('filter_trusted');
    if (fKey === 'Yakınımda') return t('filter_nearby');
    return fKey;
  };

  const getCategoryName = (cName: string) => {
    if (cName === 'Yeme İçme' || cName === 'Yeme & İçme') return t('cat_food_drink');
    if (cName === 'Sağlık') return t('cat_health');
    if (cName === 'Kişisel Bakım') return t('cat_care');
    if (cName === 'Hizmetler') return t('cat_services');
    if (cName === 'Aktivite') return t('cat_activity');
    return cName;
  };

  useEffect(() => {
    if (route.params?.categoryFilter) {
      setSearchQuery(getCategoryName(route.params.categoryFilter));
    }
  }, [route.params?.categoryFilter]);

  useEffect(() => {
    if (viewMode === 'map') {
      if (!userLocation && !permissionDeniedNotice) {
        requestAndApplyUserLocation(true);
      } else {
        fetchMapPlaces(searchQuery, currentMapRegion);
      }
    }
  }, [viewMode, searchQuery, activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 2) searchPlaces(searchQuery);
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter]);

  const fetchMapPlaces = async (queryText?: string, targetRegion?: any) => {
    setIsMapLoading(true);
    setShowSearchThisArea(false);
    try {
      let formattedPlaces: MapPlace[] = [];

      let query = supabase
        .from('places')
        .select('id, name, category, latitude, longitude, district, city');

      const region = targetRegion || currentMapRegion;

      // Arama metni varsa doğrudan tüm şehirdeki/veritabanındaki o markaya/kategoriye ait mekanları filtrele
      if (queryText && queryText.trim().length > 0) {
        const orFilter = buildSupabaseOrFilter(queryText);
        query = query.or(orFilter).limit(3000);
      } else if (region) {
        // Haritada görüntülenen alanın koordinat sınırları (bounding box)
        const latDelta = region.latitudeDelta || 0.05;
        const lngDelta = region.longitudeDelta || 0.05;
        const minLat = region.latitude - latDelta / 2;
        const maxLat = region.latitude + latDelta / 2;
        const minLng = region.longitude - lngDelta / 2;
        const maxLng = region.longitude + lngDelta / 2;

        query = query
          .gte('latitude', minLat)
          .lte('latitude', maxLat)
          .gte('longitude', minLng)
          .lte('longitude', maxLng)
          .limit(5000);
      } else {
        // Varsayılan: Ankara ili için mekanları getir
        query = query.eq('city', 'Ankara').limit(5000);
      }

      const { data: placesData } = await query;

      if (placesData && placesData.length > 0) {
        formattedPlaces = placesData
          .filter((p: any) => p.latitude && p.longitude)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            category: formatCategory(p.category, language, p.name),
            rating: 5,
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
            recommendedBy: formatLocation(p.district ? `${p.district}, ${p.city || ''}` : p.city, language),
          }));
      }

      // Live search via Photon if query text exists
      if (queryText && queryText.trim().length > 0) {
        try {
          const photonQuery = encodeURIComponent(getPhotonSearchQuery(queryText));
          const response = await fetch(`https://photon.komoot.io/api/?q=${photonQuery}&limit=30`);
          const photonData = await response.json();

          if (photonData?.features) {
            const existingCoords = new Set(formattedPlaces.map(p => `${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`));

            photonData.features.forEach((f: any) => {
              if (!f.properties?.name || !f.geometry?.coordinates) return;
              const lng = f.geometry.coordinates[0];
              const lat = f.geometry.coordinates[1];
              const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

              if (!existingCoords.has(coordKey)) {
                const osmVal = f.properties.osm_value || '';
                const cat = classifyOsmCategory(osmVal);

                formattedPlaces.push({
                  id: String(f.properties.osm_id || Math.random()),
                  name: f.properties.name,
                  category: formatCategory(cat, language, f.properties?.name),
                  rating: 5,
                  latitude: lat,
                  longitude: lng,
                  recommendedBy: formatLocation([f.properties.district, f.properties.city || f.properties.state].filter(Boolean).join(', '), language) || 'OpenStreetMap',
                });
                existingCoords.add(coordKey);
              }
            });
          }
        } catch (osmErr) {
          console.error("OpenStreetMap canlı çekme hatası:", osmErr);
        }
      }

      setMapPlaces(formattedPlaces);

      if (formattedPlaces.length > 0) {
        if (queryText && queryText.trim().length > 0) {
          setInitialMapRegion({
            latitude: formattedPlaces[0].latitude,
            longitude: formattedPlaces[0].longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04
          });
          setSelectedPlace(formattedPlaces[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsMapLoading(false);
    }
  };

  const searchPlaces = async (query: string) => {
    setIsLoading(true);
    try {
      let results: any[] = [];

      if (activeFilter === 'Sadece Güvendiklerim') {
        // Sadece bağlantıların mekanlarını ara
        const { data: connections } = await supabase
          .from('connections')
          .select('follower_id, following_id')
          .or(`follower_id.eq.${session!.user.id},following_id.eq.${session!.user.id}`)
          .eq('status', 'accepted');
        const ids = connections?.map((connection) =>
          connection.follower_id === session!.user.id
            ? connection.following_id
            : connection.follower_id
        ) || [];

        const { data } = await supabase
          .from('user_places')
          .select(`id, rating, review_text, profiles:user_id (full_name, username), places!inner (id, name, category, district, city, latitude, longitude)`)
          .in('user_id', ids)
          .ilike('places.name', `%${query}%`);

        if (data) {
          results = data.map((item: any) => ({
            id: item.places?.id || item.id,
            name: item.places?.name,
            category: formatCategory(item.places?.category, language, item.places?.name),
            district: item.places?.district,
            city: item.places?.city,
            latitude: item.places?.latitude,
            longitude: item.places?.longitude,
            location: formatLocation(`${item.places?.district || ''}, ${item.places?.city || ''}`, language),
            rating: item.rating,
            recommendedBy: item.profiles?.full_name,
          })).filter(r => r.name);
        }
      } else {
        // Arama eşleştirme mantığı: Kelime veya Kategori veya Anlamsal Eşleşme (Doktor -> Sağlık/Klinik/Hastane vb.)
        const orFilter = buildSupabaseOrFilter(query);

        // Önce kendi DB'de ara (hem name hem category içinden)
        const { data: dbResults } = await supabase
          .from('places')
          .select('id, name, category, district, city, latitude, longitude')
          .or(orFilter)
          .limit(30);

        if (dbResults) {
          results = dbResults.map(p => ({
            id: p.id,
            name: p.name,
            category: formatCategory(p.category, language, p.name),
            location: formatLocation(`${p.district || ''}, ${p.city || ''}`, language),
            latitude: p.latitude,
            longitude: p.longitude,
          }));
        }

        // Sonra Photon API ile açık kaynak OSM araması
        const photonQuery = encodeURIComponent(getPhotonSearchQuery(query));
        const response = await fetch(`https://photon.komoot.io/api/?q=${photonQuery}&limit=15`);
        const photonData = await response.json();

        if (photonData?.features) {
          const existingIds = new Set(results.map(r => String(r.id)));
          photonData.features.forEach((f: any) => {
            if (!f.properties?.name) return;
            const osmId = String(f.properties.osm_id);
            if (!existingIds.has(osmId)) {
              const osmVal = f.properties.osm_value || '';
              const cat = classifyOsmCategory(osmVal);

              const lng = f.geometry?.coordinates?.[0];
              const lat = f.geometry?.coordinates?.[1];
              results.push({
                id: osmId,
                name: f.properties.name,
                category: formatCategory(cat, language, f.properties?.name),
                location: formatLocation([f.properties.district, f.properties.state].filter(Boolean).join(', '), language),
                latitude: lat,
                longitude: lng,
              });
              existingIds.add(osmId);
            }
          });
        }
      }

      if (activeFilter === 'Yakınımda' && userLocation) {
        results.sort((a, b) => {
          const latA = Number(a.latitude ?? a.lat);
          const lngA = Number(a.longitude ?? a.lng);
          const latB = Number(b.latitude ?? b.lat);
          const lngB = Number(b.longitude ?? b.lng);
          const distA = latA && lngA ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, latA, lngA) : 999999;
          const distB = latB && lngB ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, latB, lngB) : 999999;
          return distA - distB;
        });
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (cat: typeof CATEGORIES[0]) => {
    setSearchQuery(getCategoryName(cat.name));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('explore')}</Text>
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]} onPress={() => setViewMode('list')}>
            <List size={18} color={viewMode === 'list' ? '#FFF' : colors.subText} />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>{t('list_view')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]} onPress={() => setViewMode('map')}>
            <MapIcon size={18} color={viewMode === 'map' ? '#FFF' : colors.subText} />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>{t('map_view')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }, mapSearchFocused && viewMode === 'map' && styles.searchInputWrapperFocused]}>
          <Search size={20} color={mapSearchFocused && viewMode === 'map' ? colors.primary : colors.mutedText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('search_placeholder')}
            placeholderTextColor={colors.mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            spellCheck={false}
            onFocus={() => setMapSearchFocused(true)}
            onBlur={() => setTimeout(() => setMapSearchFocused(false), 200)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={18} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapWrapper}>
          {/* Konum İzni Kapalı Uyarısı */}
          {permissionDeniedNotice && (
            <View style={[styles.permissionNoticeBanner, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <AlertCircle size={16} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={[styles.permissionNoticeText, { color: colors.text }]} numberOfLines={2}>
                {t('location_denied_notice')}
              </Text>
              <TouchableOpacity
                style={styles.permissionActionBtn}
                activeOpacity={0.8}
                onPress={() => requestAndApplyUserLocation(true)}
              >
                <Text style={styles.permissionActionBtnText}>{t('location_permission_button')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Map */}
          <View style={styles.mapContainer}>
            {isMapLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
              <MapComponent
                places={mapPlaces}
                initialRegion={initialMapRegion}
                selectedPlace={selectedPlace}
                onSelectPlace={(p) => setSelectedPlace(p)}
                userLocation={userLocation}
                onGoToMyLocation={() => requestAndApplyUserLocation(true)}
                isLocating={isLocating}
                onRegionChangeComplete={(region) => {
                  setCurrentMapRegion(region);
                  setShowSearchThisArea(true);
                }}
              />
            )}
          </View>

          {/* "Bu Bölgede Ara" Floating Button */}
          {showSearchThisArea && !mapSearchFocused && (
            <TouchableOpacity
              style={[styles.searchThisAreaBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              activeOpacity={0.85}
              onPress={() => fetchMapPlaces(searchQuery, currentMapRegion)}
            >
              <MapPin size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.searchThisAreaText, { color: colors.primary }]}>{t('search_this_area')}</Text>
            </TouchableOpacity>
          )}

          {/* Seçili Mekan Bilgi Kartı */}
          {selectedPlace && !mapSearchFocused && (
            <View style={[styles.selectedPlaceCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.selectedPlaceHeader}>
                <View style={[styles.selectedCategoryBadge, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.selectedCategoryText, { color: colors.primary }]}>
                    {selectedPlace.category}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeCardBtn}
                  onPress={() => setSelectedPlace(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={16} color={colors.mutedText} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.selectedPlaceTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedPlace.name}
              </Text>

              <View style={styles.selectedPlaceMetaRow}>
                {selectedPlace.rating > 0 && (
                  <Text style={styles.selectedRating}>⭐ {selectedPlace.rating}</Text>
                )}
                {userLocation && selectedPlace.latitude && selectedPlace.longitude && (
                  <Text style={[styles.selectedMetaText, { color: colors.subText }]}>
                    📍 {formatDistanceStr(calculateDistanceKm(userLocation.latitude, userLocation.longitude, Number(selectedPlace.latitude), Number(selectedPlace.longitude)))}
                  </Text>
                )}
                {(selectedPlace.district || selectedPlace.city) && (
                  <Text style={[styles.selectedMetaText, { color: colors.subText }]} numberOfLines={1}>
                    {[selectedPlace.district, selectedPlace.city].filter(Boolean).join(', ')}
                  </Text>
                )}
              </View>

              {selectedPlace.recommendedBy && (
                <Text style={[styles.selectedRecBy, { color: colors.subText }]} numberOfLines={1}>
                  👤 {selectedPlace.recommendedBy}
                </Text>
              )}

              <View style={styles.selectedPlaceActions}>
                <TouchableOpacity
                  style={[styles.selectedInspectBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PlaceDetail', { placeId: selectedPlace.id, placeData: selectedPlace })}
                >
                  <Text style={styles.selectedInspectBtnText}>Mekanı İncele</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectedDirectionsBtn, { borderColor: colors.primary }]}
                  activeOpacity={0.85}
                  onPress={() => openInMaps(Number(selectedPlace.latitude), Number(selectedPlace.longitude), selectedPlace.name)}
                >
                  <ExternalLink size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.selectedDirectionsBtnText, { color: colors.primary }]}>Yol Tarifi</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Eğer mekan seçili değilse ve haritada mekanlar varsa alt yatay mekan kartları */}
          {!selectedPlace && !mapSearchFocused && mapPlaces.length > 0 && (
            <View style={styles.bottomCarouselContainer} pointerEvents="box-none">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bottomCarouselContent}
              >
                {mapPlaces.slice(0, 10).map((place) => {
                  const dist = userLocation && place.latitude && place.longitude
                    ? formatDistanceStr(calculateDistanceKm(userLocation.latitude, userLocation.longitude, Number(place.latitude), Number(place.longitude)))
                    : null;
                  return (
                    <TouchableOpacity
                      key={place.id}
                      style={[styles.carouselCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedPlace(place);
                        setInitialMapRegion({
                          latitude: Number(place.latitude),
                          longitude: Number(place.longitude),
                          latitudeDelta: 0.03,
                          longitudeDelta: 0.03,
                        });
                      }}
                    >
                      <Text style={[styles.carouselCardName, { color: colors.text }]} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={[styles.carouselCardCat, { color: colors.primary }]} numberOfLines={1}>
                        {place.category}
                      </Text>
                      <View style={styles.carouselCardMeta}>
                        {dist && <Text style={[styles.carouselCardDist, { color: colors.subText }]}>📍 {dist}</Text>}
                        {place.rating > 0 && <Text style={styles.carouselCardRating}>⭐ {place.rating}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Floating search results overlay for map view */}
          {mapSearchFocused && searchQuery.length > 2 && (
            <View style={[styles.mapSearchOverlay, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {isLoading ? (
                <View style={styles.mapOverlayLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.mapOverlayLoadingText, { color: colors.subText }]}>{t('searching')}</Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.mapOverlayEmptyRow}>
                  <Text style={[styles.mapOverlayEmptyText, { color: colors.mutedText }]}>{t('no_results')}</Text>
                </View>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 280 }}>
                  {searchResults.map((place, i) => (
                    <TouchableOpacity
                      key={place.id || i}
                      style={[styles.mapOverlayResultRow, { borderBottomColor: colors.border }]}
                      activeOpacity={0.75}
                      onPress={() => {
                        const placeName = place.name;
                        setSearchQuery(placeName);
                        setMapSearchFocused(false);
                        
                        const lat = place.latitude ?? place.lat;
                        const lng = place.longitude ?? place.lng;
                        if (lat && lng) {
                          setInitialMapRegion({ latitude: Number(lat), longitude: Number(lng), latitudeDelta: 0.02, longitudeDelta: 0.02 });
                          setSelectedPlace(place);
                        }
                        
                        fetchMapPlaces(placeName);
                      }}
                    >
                      <View style={[styles.mapOverlayIcon, { backgroundColor: colors.badgeBg }]}>
                        <MapPin size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.mapOverlayResultName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                        <Text style={[styles.mapOverlayResultSub, { color: colors.subText }]} numberOfLines={1}>
                          {place.category}{place.location ? ` • ${place.location}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      ) : (
        <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Filtreler */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView} contentContainerStyle={styles.filterScroll}>
            {FILTERS.map((filter, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
                  activeFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterChipText, { color: colors.subText }, activeFilter === filter && { color: '#FFFFFF' }]}>
                  {getFilterLabel(filter)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Arama Sonuçları */}
          {searchQuery.length > 2 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('results')}</Text>
              {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.mutedText }]}>"{searchQuery}" {t('no_results')}</Text>
                </View>
              ) : (
                searchResults.map((place, i) => {
                  const distStr = userLocation && place.latitude && place.longitude
                    ? formatDistanceStr(calculateDistanceKm(userLocation.latitude, userLocation.longitude, Number(place.latitude), Number(place.longitude)))
                    : null;
                  return (
                    <TouchableOpacity 
                      key={place.id || i} 
                      style={[styles.resultItem, { borderBottomColor: colors.border }]}
                      onPress={() => place.id && navigation.navigate('PlaceDetail', { placeId: place.id, placeData: place })}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.resultIconWrapper, { backgroundColor: colors.badgeBg }]}>
                        <MapPin size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.resultName, { color: colors.text }]}>{place.name}</Text>
                        <Text style={[styles.resultDetails, { color: colors.subText }]}>
                          {place.category}{place.location ? ` • ${place.location}` : ''}
                          {distStr ? ` • 📍 ${distStr}` : ''}
                          {place.recommendedBy ? ` • 👤 ${place.recommendedBy}` : ''}
                        </Text>
                      </View>
                      {place.rating > 0 && (
                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingText}>⭐ {place.rating}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : (
            <>
              {/* Kategoriler */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('categories')}</Text>
                <View style={styles.categoriesGrid}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                      onPress={() => handleCategoryPress(cat)}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{getCategoryName(cat.name)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Trend Aramalar */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('popular_searches')}</Text>
                <View style={styles.trendingContainer}>
                  {TRENDING_SEARCHES.map((item, index) => {
                    const label = t(item.key as any) || item.defaultText;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.trendingItem, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}
                        onPress={() => setSearchQuery(label)}
                      >
                        <TrendingUp size={16} color={colors.primary} style={{ marginRight: 8 }} />
                        <Text style={[styles.trendingText, { color: colors.primary }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  viewToggleContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 4 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  toggleBtnActive: { backgroundColor: '#7B2CBF' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#64748B', marginLeft: 4 },
  toggleTextActive: { color: '#FFFFFF' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, height: 52 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B', outlineStyle: 'none' } as any,
  mapWrapper: { flex: 1, marginHorizontal: 20, marginBottom: 20, position: 'relative' },
  mapContainer: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  scrollContent: { paddingBottom: 40 },

  searchInputWrapperFocused: { borderColor: '#7B2CBF', backgroundColor: '#FFFFFF', shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },

  searchThisAreaBtn: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#7B2CBF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 90,
  },
  searchThisAreaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7B2CBF',
  },
  mapSearchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    overflow: 'hidden',
  },
  mapOverlayLoadingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  mapOverlayLoadingText: { fontSize: 14, color: '#64748B' },
  mapOverlayEmptyRow: { padding: 16, alignItems: 'center' },
  mapOverlayEmptyText: { fontSize: 14, color: '#94A3B8' },
  mapOverlayResultRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  mapOverlayIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mapOverlayResultName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  mapOverlayResultSub: { fontSize: 12, color: '#64748B' },
  mainScrollView: { flex: 1 },
  filterScrollView: { flexGrow: 0, marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, paddingVertical: 4, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  filterChipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },
  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  categoryCard: { width: '47%', backgroundColor: '#F8F9FA', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  categoryEmoji: { fontSize: 32, marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  trendingContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendingItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(123,44,191,0.05)', borderWidth: 1, borderColor: 'rgba(123,44,191,0.1)' },
  trendingText: { fontSize: 14, fontWeight: '600', color: '#7B2CBF' },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resultIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  resultDetails: { fontSize: 13, color: '#64748B' },
  ratingBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },

  /** Konum İzni Uyarı Bandı */
  permissionNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  permissionNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  permissionActionBtn: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  permissionActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /** Seçili Mekan Bilgi Kartı */
  selectedPlaceCard: {
    position: 'absolute',
    bottom: 36,
    left: 10,
    right: 10,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 120,
  },
  selectedPlaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  selectedCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  selectedCategoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeCardBtn: {
    padding: 4,
  },
  selectedPlaceTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  selectedPlaceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  selectedRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  selectedMetaText: {
    fontSize: 12,
  },
  selectedRecBy: {
    fontSize: 12,
    marginBottom: 10,
  },
  selectedPlaceActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  selectedInspectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  selectedInspectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  selectedDirectionsBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /** Alt Kayan Mekan Kartları Listesi */
  bottomCarouselContainer: {
    position: 'absolute',
    bottom: 34,
    left: 0,
    right: 0,
    zIndex: 110,
  },
  bottomCarouselContent: {
    paddingHorizontal: 10,
    gap: 8,
  },
  carouselCard: {
    width: 170,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  carouselCardName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  carouselCardCat: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  carouselCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carouselCardDist: {
    fontSize: 10,
  },
  carouselCardRating: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
