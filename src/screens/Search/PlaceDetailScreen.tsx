import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, MapPin, Star, Navigation, Bookmark, ShieldCheck, Check, Compass, Building } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import MapComponent from '../../components/MapComponent';
import { formatCategory, formatLocation } from '../../utils/categoryTranslator';

export default function PlaceDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const { colors, isDark, language, t } = useTheme();
  
  const { placeId, placeData } = route.params || {};

  const [place, setPlace] = useState<any>(placeData || null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId]);

  const fetchPlaceDetails = async () => {
    setIsLoading(true);
    try {
      let currentPlace = { ...placeData };

      // 1. Veritabanından tam mekan verisini çek
      const lookupId = placeId || placeData?.id;
      if (lookupId) {
        const { data: dbPlace } = await supabase
          .from('places')
          .select('*')
          .eq('id', lookupId)
          .maybeSingle();
        if (dbPlace) {
          currentPlace = { ...currentPlace, ...dbPlace };
        }
      }

      // 2. Koordinat veya konum bilgisi eksikse akıllı kademeli arama yap
      let hasCoords = Number(currentPlace?.latitude) && Number(currentPlace?.longitude) && !isNaN(Number(currentPlace?.latitude)) && Number(currentPlace?.latitude) !== 0;
      
      if (!hasCoords && currentPlace?.name) {
        try {
          const candidates = [
            [currentPlace.name, currentPlace.district, currentPlace.city].filter(Boolean).join(' '),
            currentPlace.name,
            currentPlace.name.split(' ')[0], // İlk anahtar kelime (örn: 'İdealtepe', 'İtalyan')
            [currentPlace.district, currentPlace.city].filter(Boolean).join(' ')
          ].filter(q => q && q.trim().length > 1);

          for (const queryStr of candidates) {
            const geoRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(queryStr)}&limit=1`);
            const geoData = await geoRes.json();
            const feat = geoData?.features?.[0];
            if (feat?.geometry?.coordinates) {
              const lon = feat.geometry.coordinates[0];
              const lat = feat.geometry.coordinates[1];
              currentPlace.longitude = lon;
              currentPlace.latitude = lat;
              hasCoords = true;
              
              if (!currentPlace.city && (feat.properties?.city || feat.properties?.state)) {
                currentPlace.city = feat.properties.city || feat.properties.state;
              }
              if (!currentPlace.district && (feat.properties?.district || feat.properties?.suburb)) {
                currentPlace.district = feat.properties.district || feat.properties.suburb;
              }
              if (!currentPlace.neighborhood && feat.properties?.locality) {
                currentPlace.neighborhood = feat.properties.locality;
              }
              if (feat.properties?.street) {
                currentPlace.street = feat.properties.street;
              }
              if (feat.properties?.housenumber) {
                currentPlace.housenumber = feat.properties.housenumber;
              }
              if (feat.properties?.postcode) {
                currentPlace.postcode = feat.properties.postcode;
              }
              break;
            }
          }
        } catch (e) {}
      }

      // 3. Koordinatlardan detaylı ters coğrafi çözümleme (Reverse Geocoding)
      if (hasCoords) {
        try {
          const revRes = await fetch(`https://photon.komoot.io/reverse?lat=${currentPlace.latitude}&lon=${currentPlace.longitude}`);
          const revData = await revRes.json();
          const p = revData?.features?.[0]?.properties;
          if (p) {
            const neigh = p.locality || p.suburb || p.district;
            const dist = p.city || p.district;
            const prov = p.state || p.city;
            const str = p.street;
            const house = p.housenumber;
            const post = p.postcode;

            if (!currentPlace.city && prov) currentPlace.city = prov;
            if (!currentPlace.district && dist) currentPlace.district = dist;
            if (!currentPlace.neighborhood && neigh) currentPlace.neighborhood = neigh;
            if (!currentPlace.street && str) currentPlace.street = str;
            if (!currentPlace.housenumber && house) currentPlace.housenumber = house;
            if (!currentPlace.postcode && post) currentPlace.postcode = post;

            // Açık adres derleme
            const addrParts: string[] = [];
            if (str) addrParts.push(house ? `${str} No: ${house}` : str);
            if (neigh && neigh !== dist) addrParts.push(neigh.endsWith('Mah.') || neigh.endsWith('Mahallesi') ? neigh : `${neigh} Mah.`);
            if (post) addrParts.push(post);
            if (dist) addrParts.push(dist);
            if (prov && prov !== dist) addrParts.push(prov);

            if (addrParts.length > 0) {
              currentPlace.full_address = addrParts.join(', ');
            }

            // Harici geocoding sonucu yalnızca ekranda kullanılır. Ortak mekan kaydı,
            // doğrulanmamış istemci verisiyle arka planda değiştirilemez.
          }
        } catch (revErr) {}
      }

      setPlace(currentPlace);

      // Bu mekana yapılan tavsiyeleri/yorumları çek
      if (currentPlace?.id) {
        const { data: reviewData } = await supabase
          .from('user_places')
          .select(`
            id, rating, review_text, created_at, user_id,
            profiles:user_id (id, full_name, username, avatar_url)
          `)
          .eq('place_id', currentPlace.id)
          .order('created_at', { ascending: false });

        setReviews(reviewData || []);

        // Kullanıcının kendi kaydını kontrol et
        if (session?.user?.id) {
          const userSaved = reviewData?.some((r: any) => r.user_id === session.user.id);
          setIsSaved(!!userSaved);
        }
      }
    } catch (error) {
      console.error('Mekan detay çekme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMaps = () => {
    const lat = Number(place?.latitude);
    const lng = Number(place?.longitude);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      const addressQuery = encodeURIComponent([place?.name, place?.district, place?.city].filter(Boolean).join(' '));
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addressQuery}`);
      return;
    }

    const label = encodeURIComponent(place.name || 'Mekan');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    }
  };

  const handleToggleSave = async () => {
    if (!session?.user?.id || !place?.id) return;
    setSavedLoading(true);
    try {
      if (isSaved) {
        // Kaydı sil
        await supabase
          .from('user_places')
          .delete()
          .eq('user_id', session.user.id)
          .eq('place_id', place.id);
        setIsSaved(false);
      } else {
        // Kaydet
        await supabase
          .from('user_places')
          .insert({
            user_id: session.user.id,
            place_id: place.id,
            rating: 5,
            review_text: 'Tavsi rehberime kaydedildi.',
            visibility: 'network'
          });
        setIsSaved(true);
      }
    } catch (e) {
      console.error('Kaydetme hatası:', e);
    } finally {
      setSavedLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={14} color={i <= rating ? '#F59E0B' : (isDark ? '#334155' : '#E2E8F0')} fill={i <= rating ? '#F59E0B' : 'transparent'} />
    ));
  };

  if (isLoading && !place) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const validLat = Number(place?.latitude);
  const validLng = Number(place?.longitude);
  const hasValidCoords = !isNaN(validLat) && !isNaN(validLng) && validLat !== 0 && validLng !== 0;

  const mapPlaceData = hasValidCoords ? [{
    id: place.id,
    name: place.name,
    category: formatCategory(place.category, language, place.name),
    rating: 5,
    latitude: validLat,
    longitude: validLng,
    recommendedBy: formatLocation(place.district ? `${place.district}, ${place.city || ''}` : place.city, language)
  }] : [];

  // Konum ve Açık Adres Derlemesi
  const cleanNeigh = place?.neighborhood && place.neighborhood !== 'null' && place.neighborhood !== 'undefined' ? place.neighborhood.trim() : '';
  const cleanDist = place?.district && place.district !== 'null' && place.district !== 'undefined' ? place.district.trim() : '';
  const cleanCity = place?.city && place.city !== 'null' && place.city !== 'undefined' ? place.city.trim() : '';

  const locationDisplay = [
    cleanNeigh ? (cleanNeigh.endsWith('Mah.') || cleanNeigh.endsWith('Mahallesi') ? cleanNeigh : `${cleanNeigh} Mah.`) : null,
    cleanDist,
    cleanCity && cleanCity !== cleanDist ? cleanCity : null
  ].filter(Boolean).join(', ');

  const fullAddressDisplay = place?.full_address || place?.address || (
    [
      place?.street ? (place?.housenumber ? `${place.street} No: ${place.housenumber}` : place.street) : null,
      cleanNeigh ? (cleanNeigh.endsWith('Mah.') || cleanNeigh.endsWith('Mahallesi') ? cleanNeigh : `${cleanNeigh} Mah.`) : null,
      place?.postcode || null,
      cleanDist,
      cleanCity && cleanCity !== cleanDist ? cleanCity : null
    ].filter(Boolean).join(', ')
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{place?.name || t('place_detail_title')}</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]} onPress={handleToggleSave} disabled={savedLoading} activeOpacity={0.7}>
          <Bookmark size={22} color={isSaved ? colors.primary : colors.subText} fill={isSaved ? colors.primary : 'transparent'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        {/* Harita Görünümü */}
        {hasValidCoords ? (
          <View style={styles.mapWrapper}>
            <MapComponent 
              places={mapPlaceData} 
              initialRegion={{ 
                latitude: validLat, 
                longitude: validLng, 
                latitudeDelta: 0.008, 
                longitudeDelta: 0.008 
              }} 
            />
          </View>
        ) : (
          <View style={[styles.mapPlaceholder, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <MapPin size={28} color={colors.mutedText} />
            <Text style={[styles.mapPlaceholderText, { color: colors.mutedText }]}>
              {isLoading ? t('map_locating') : t('map_searching_coords')}
            </Text>
          </View>
        )}

        {/* Ana Bilgiler Kartı */}
        <View style={[styles.infoCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{formatCategory(place?.category, language, place?.name)}</Text>
          </View>
          
          <Text style={[styles.placeName, { color: colors.text }]}>{place?.name}</Text>
          
          {/* Bölge / Mahalle / Şehir Satırı */}
          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.subText }]}>
              {formatLocation(locationDisplay, language) || t('location_detecting')}
            </Text>
          </View>

          {/* Açık Adres Kutusu */}
          {fullAddressDisplay ? (
            <View style={[styles.fullAddressBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={[styles.addressIconCircle, { backgroundColor: colors.primaryBg }]}>
                  <Compass size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fullAddressLabel, { color: colors.subText }]}>{t('full_address')}</Text>
                  <Text style={[styles.fullAddressText, { color: colors.text }]}>{fullAddressDisplay}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Eylem Butonları */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.directionBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
              <Navigation size={18} color="#FFFFFF" />
              <Text style={styles.directionBtnText}>{t('get_directions')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.saveActionBtn, 
                { backgroundColor: isDark ? '#334155' : '#F1F5F9', borderColor: colors.cardBorder },
                isSaved && { backgroundColor: colors.primaryBg, borderColor: colors.primary }
              ]} 
              onPress={handleToggleSave} 
              disabled={savedLoading}
              activeOpacity={0.8}
            >
              {isSaved ? <Check size={18} color={colors.primary} /> : <Bookmark size={18} color={colors.primary} />}
              <Text style={[styles.saveActionText, { color: colors.primary }, isSaved && styles.saveActionTextActive]}>
                {isSaved ? t('saved_to_guide') : t('add_to_guide')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tavsiyeler & Yorumlar Bölümü */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('network_reviews_title')} ({reviews.length})</Text>

          {reviews.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <ShieldCheck size={36} color={colors.subText} />
              <Text style={[styles.emptyStateText, { color: colors.subText }]}>{t('no_reviews_yet')}</Text>
            </View>
          ) : (
            reviews.map((rev) => (
              <TouchableOpacity 
                key={rev.id} 
                style={[styles.reviewCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                onPress={() => rev.profiles?.id && navigation.navigate('UserProfile', { userId: rev.profiles.id })}
                activeOpacity={0.8}
              >
                <View style={styles.reviewHeader}>
                  <View style={[styles.avatarMock, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {(rev.profiles?.full_name || 'U').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewerName, { color: colors.text }]}>{rev.profiles?.full_name || t('hidden_user')}</Text>
                    <Text style={[styles.reviewerUsername, { color: colors.subText }]}>@{rev.profiles?.username || 'kullanici'}</Text>
                  </View>
                  <View style={styles.ratingRow}>{renderStars(rev.rating || 5)}</View>
                </View>
                {rev.review_text ? (
                  <Text style={[styles.reviewBody, { color: colors.text }]}>{rev.review_text}</Text>
                ) : null}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'android' ? 12 : 8, 
    paddingBottom: 12, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#1E293B', 
    textAlign: 'center', 
    marginHorizontal: 8 
  },
  scrollContent: { paddingBottom: 40 },

  mapWrapper: { height: 220, width: '100%', overflow: 'hidden' },
  mapPlaceholder: { 
    height: 120, 
    width: '100%', 
    backgroundColor: '#F1F5F9', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8 
  },
  mapPlaceholderText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  infoCard: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginTop: 16, 
    marginBottom: 16, 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 
  },
  categoryBadge: { 
    alignSelf: 'flex-start', 
    backgroundColor: 'rgba(123,44,191,0.08)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10, 
    marginBottom: 10 
  },
  categoryBadgeText: { color: '#7B2CBF', fontSize: 12, fontWeight: '700' },
  placeName: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  locationText: { fontSize: 14, color: '#475569', marginLeft: 6, flex: 1, fontWeight: '600' },

  // Açık Adres Kutusu
  fullAddressBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  addressIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  fullAddressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B2CBF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  fullAddressText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500'
  },

  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  directionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#7B2CBF', 
    paddingVertical: 14, 
    borderRadius: 16, 
    gap: 8 
  },
  directionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  saveActionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F3E8FF', 
    paddingVertical: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#D8B4E2', 
    gap: 8 
  },
  saveActionBtnActive: { backgroundColor: '#E9D5FF' },
  saveActionText: { color: '#7B2CBF', fontSize: 15, fontWeight: '700' },
  saveActionTextActive: { color: '#6B21A8' },

  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 14 },
  emptyState: { 
    backgroundColor: '#FFFFFF', 
    padding: 24, 
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  emptyStateText: { marginTop: 12, color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  reviewCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarMock: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#7B2CBF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  reviewerName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  reviewerUsername: { fontSize: 12, color: '#94A3B8' },
  ratingRow: { flexDirection: 'row', gap: 2 },
  reviewBody: { fontSize: 14, color: '#334155', lineHeight: 20, marginTop: 4 },
});
