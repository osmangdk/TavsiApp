import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Coffee, Stethoscope, Scissors, Wrench, ChevronRight, Plus, Star, Globe, Users, Lock, X, CheckCircle, Check } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import MapComponent from '../../components/MapComponent';
import { buildSupabaseOrFilter, classifyOsmCategory, getPhotonSearchQuery } from '../../utils/categoryMatcher';
import { useTheme } from '../../contexts/ThemeContext';

const CATEGORIES = [
  { id: '1', key: 'cat_restaurant_cafe', name: 'Restoran & Kafe', icon: Coffee, color: '#F59E0B' },
  { id: '2', key: 'cat_doctor_health', name: 'Doktor & Sağlık', icon: Stethoscope, color: '#10B981' },
  { id: '3', key: 'cat_care', name: 'Kişisel Bakım', icon: Scissors, color: '#EC4899' },
  { id: '4', key: 'cat_repair_craftsman', name: 'Usta & Tamirat', icon: Wrench, color: '#3B82F6' },
];

export default function AddPreferenceScreen() {
  const { session } = useAuth();
  const { colors, isDark, t } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewVisibility, setReviewVisibility] = useState('network');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [myNetwork, setMyNetwork] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const fetchNetwork = async () => {
      if (!session?.user?.id) return;
      try {
        const { data: conns, error } = await supabase
          .from('connections')
          .select('id, follower_id, following_id')
          .or(`follower_id.eq.${session.user.id},following_id.eq.${session.user.id}`)
          .eq('status', 'accepted');
          
        if (!error && conns && conns.length > 0) {
          const followingIds = conns.map((c: any) =>
            c.follower_id === session.user.id ? c.following_id : c.follower_id
          );
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', followingIds);

          setMyNetwork(profiles || []);
        } else {
          setMyNetwork([]);
        }
      } catch (e) {
        console.error("Ağ verisi çekilirken hata:", e);
      }
    };
    fetchNetwork();
  }, [session]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        searchFoursquare(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Kullanıcı konumunu al (Web & Mobile Geolocation)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => console.log('Location error:', err),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }, []);

  // Haversine Mesafe Hesaplama (km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Km cinsinden
  };

  const formatDistanceStr = (distKm: number) => {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m`;
    }
    return `${distKm.toFixed(1)} km`;
  };

  const searchFoursquare = async (query: string) => {
    setIsSearching(true);
    try {
      let results: any[] = [];

      const orFilter = buildSupabaseOrFilter(query);

      // 1. Önce kendi veritabanımızda ara
      const { data: dbResults } = await supabase
        .from('places')
        .select('id, name, category, district, city, latitude, longitude')
        .or(orFilter)
        .limit(30);

      if (dbResults && dbResults.length > 0) {
        results = dbResults.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category || 'Mekan',
          city: p.city || '',
          district: p.district || '',
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
        }));
      }

      // 2. Photon (OpenStreetMap) ücretsiz API ile mekan ara
      const photonQuery = encodeURIComponent(getPhotonSearchQuery(query));
      const response = await fetch(`https://photon.komoot.io/api/?q=${photonQuery}&limit=20`);
      const photonData = await response.json();

      if (photonData?.features) {
        const existingIds = new Set(results.map(r => String(r.id)));
        photonData.features.forEach((f: any) => {
          if (!f.properties?.name) return;
          const osmId = 'osm_' + String(f.properties.osm_id);
          if (existingIds.has(osmId)) return;
          const osmVal = f.properties.osm_value || '';
          const cat = classifyOsmCategory(osmVal);
          results.push({
            id: osmId,
            name: f.properties.name,
            category: cat,
            city: f.properties.state || f.properties.country || '',
            district: f.properties.district || f.properties.city || '',
            latitude: f.geometry?.coordinates?.[1],
            longitude: f.geometry?.coordinates?.[0],
          });
          existingIds.add(osmId);
        });
      }

      // Mesafe hesapla & En yakına göre sırala
      if (userLocation) {
        results.forEach(r => {
          if (r.latitude && r.longitude) {
            const dist = calculateDistance(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude);
            r.distanceKm = dist;
            r.distanceStr = formatDistanceStr(dist);
          }
        });

        results.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Arama hatası:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: any) => {
    let placeToReview = { ...place };
    if (!placeToReview.latitude || !placeToReview.longitude) {
      try {
        const searchTerms = [placeToReview.name, placeToReview.district, placeToReview.city || 'Ankara'].filter(Boolean).join(' ');
        const geoRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchTerms)}&limit=1`);
        const geoData = await geoRes.json();
        if (geoData?.features?.[0]?.geometry?.coordinates) {
          placeToReview.longitude = geoData.features[0].geometry.coordinates[0];
          placeToReview.latitude = geoData.features[0].geometry.coordinates[1];
        }
      } catch (e) {}
    }

    setSelectedPlace(placeToReview);
    setReviewRating(0);
    setReviewText('');
    setReviewVisibility('network');
    setSelectedFriends([]);
    setFriendSearchQuery('');
    setReviewModalVisible(true);
  };

  const handleSaveReview = async () => {
    if (reviewRating === 0) {
      Alert.alert(t('missing_info'), t('rate_place_alert'));
      return;
    }
    if (!session?.user?.id) return;
    
    if (reviewVisibility === 'custom' && selectedFriends.length === 0) {
      Alert.alert(t('missing_info'), t('select_friend_alert'));
      return;
    }
    
    setIsSaving(true);
    try {
      let finalPlaceId: string | null = null;

      // 1. Eğer mekan zaten veritabanımızda kayıtlı ise (UUID formatında ise)
      const isExistingUuid = typeof selectedPlace.id === 'string' && selectedPlace.id.length > 20 && !selectedPlace.id.startsWith('osm_');

      if (isExistingUuid) {
        finalPlaceId = selectedPlace.id;
      } else {
        // 2. Veritabanında OSM ID veya isimle ara
        const cleanOsmId = selectedPlace.id.toString().replace('osm_', '');
        const { data: existingPlace } = await supabase
          .from('places')
          .select('id')
          .or(`osm_id.eq.${cleanOsmId},osm_id.eq.${selectedPlace.id},name.ilike.${selectedPlace.name}`)
          .limit(1)
          .maybeSingle();

        if (existingPlace) {
          finalPlaceId = existingPlace.id;
        } else {
          // 3. Mekan veritabanında yoksa yeni satır ekle
          const { data: newPlace, error: placeError } = await supabase
            .from('places')
            .insert([{
              name: selectedPlace.name,
              category: selectedPlace.category || 'Mekan',
              city: selectedPlace.city || null,
              district: selectedPlace.district || null,
              latitude: selectedPlace.latitude || null,
              longitude: selectedPlace.longitude || null,
              osm_id: cleanOsmId || null
            }])
            .select('id')
            .maybeSingle();

          if (newPlace?.id) {
            finalPlaceId = newPlace.id;
          } else if (placeError) {
            console.error("Mekan insert hatası:", placeError);
            // Tekrar sorgula
            const { data: fallbackPlace } = await supabase
              .from('places')
              .select('id')
              .ilike('name', `%${selectedPlace.name}%`)
              .limit(1)
              .maybeSingle();

            if (fallbackPlace?.id) {
              finalPlaceId = fallbackPlace.id;
            } else {
              throw new Error(placeError.message || "Mekan kaydedilemedi.");
            }
          }
        }
      }

      if (!finalPlaceId) {
        throw new Error("Mekan bilgisi doğrulanamadı.");
      }

      // 4. User Place tablosuna ekle
      const { data: upData, error: upError } = await supabase
        .from('user_places')
        .upsert({
          user_id: session.user.id,
          place_id: finalPlaceId,
          rating: reviewRating,
          review_text: reviewText,
          visibility: reviewVisibility
        }, { onConflict: 'user_id, place_id' })
        .select('id')
        .single();
          
      if (upError || !upData) {
        console.error("User place upsert hatası:", upError);
        throw new Error(upError?.message || "Tercih kaydedilemedi.");
      }

      // 4. Yakın çevre (custom share) varsa kaydet
      if (reviewVisibility === 'custom' && selectedFriends.length > 0) {
        // Varsa eski kayıtları sil (güncelleme durumu için)
        await supabase
          .from('user_place_custom_shares')
          .delete()
          .eq('user_place_id', upData.id);

        const shares = selectedFriends.map((friendId: string) => ({
          user_place_id: upData.id,
          shared_with_user_id: friendId
        }));
        
        const { error: shareError } = await supabase
          .from('user_place_custom_shares')
          .insert(shares);
          
        if (shareError) {
          console.error("Yakın çevre paylaşım hatası:", shareError);
        }
      }

      setSuccessMessage(t('place_added_success'));
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setReviewModalVisible(false);
      setSelectedPlace(null);
      setSearchQuery('');
    } catch (error: any) {
      console.error(error);
      Alert.alert(t('error'), error?.message || t('save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('add_preference_title')}</Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
        
        {successMessage !== '' && (
          <View style={styles.successBanner}>
            <CheckCircle size={20} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{t('who_or_where_trust')}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.subText }]}>{t('add_place_or_expert_sub')}</Text>

          <View style={[styles.searchInputWrapper, { backgroundColor: colors.cardBg, borderColor: isDark ? colors.cardBorder : colors.primary }]}>
            <Search size={20} color={colors.mutedText} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('search_place_or_person')}
              placeholderTextColor={colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              spellCheck={false}
            />
            {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </View>

        {/* Arama Sonuçları */}
        {searchQuery.length > 2 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('search_results')}</Text>
            {searchResults.length > 0 ? (
              searchResults.map((place, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.searchResultItem, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                  onPress={() => handleSelectPlace(place)}
                >
                  <View style={[styles.resultIconWrapper, { backgroundColor: colors.primaryBg }]}>
                    <MapPin size={20} color={colors.primary} />
                  </View>
                  <View style={styles.resultInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.resultName, { color: colors.text, flex: 1 }]} numberOfLines={1}>{place.name}</Text>
                      {place.distanceStr && (
                        <View style={[styles.distanceBadge, { backgroundColor: colors.primaryBg }]}>
                          <Text style={[styles.distanceBadgeText, { color: colors.primary }]}>📍 {place.distanceStr}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.resultCategory, { color: colors.subText }]}>{place.category}{place.district ? ` • ${place.district}` : ''}</Text>
                  </View>
                  <View style={[styles.addButton, { backgroundColor: colors.primary }]}>
                    <Plus size={18} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ))
            ) : !isSearching ? (
              <Text style={{ textAlign: 'center', color: colors.subText, marginTop: 10 }}>{t('no_results')}</Text>
            ) : null}
          </View>
        )}

        {searchQuery.length <= 2 && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('quick_category_select')}</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const label = t(cat.key as any) || cat.name;
                  return (
                    <TouchableOpacity key={cat.id} style={[styles.categoryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} activeOpacity={0.7} onPress={() => setSearchQuery(label)}>
                      <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}15` }]}>
                        <Icon size={24} color={cat.color} />
                      </View>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{label}</Text>
                      <ChevronRight size={16} color={colors.subText} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recently_visited_sample')}</Text>
              
              <TouchableOpacity 
                style={[styles.recentItem, { borderBottomColor: colors.border }]} 
                activeOpacity={0.7} 
                onPress={() => handleSelectPlace({ name: 'Trilye Restaurant', category: 'Restoran', district: 'Çankaya', city: 'Ankara' })}
              >
                <View style={[styles.recentIconWrapper, { backgroundColor: colors.primaryBg }]}>
                  <MapPin size={20} color={colors.primary} />
                </View>
                <View style={styles.recentInfo}>
                  <Text style={[styles.recentName, { color: colors.text }]}>Trilye Restaurant</Text>
                  <Text style={[styles.recentDetails, { color: colors.subText }]}>{t('cat_food_drink')} • Çankaya</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.addButton, { backgroundColor: colors.primary }]} 
                  onPress={() => handleSelectPlace({ name: 'Trilye Restaurant', category: 'Restoran', district: 'Çankaya', city: 'Ankara' })}
                >
                  <Plus size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          </>
        )}

      </ScrollView>

      {/* Değerlendirme Modalı */}
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBg }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
          >
            <TouchableOpacity 
              style={{ flex: 1 }} 
              activeOpacity={1} 
              onPress={() => setReviewModalVisible(false)} 
            />
            <View style={[styles.modalContent, { backgroundColor: colors.modalBg, maxHeight: '90%', display: 'flex', flexDirection: 'column' }]}>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setReviewModalVisible(false)}
              >
                <X size={24} color={colors.subText} />
              </TouchableOpacity>
              
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedPlace?.name}</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.subText }]}>{selectedPlace?.category}</Text>
                  
                  {/* Adres Bilgisi Rozeti */}
                  {(selectedPlace?.district || selectedPlace?.city) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: colors.cardBorder, gap: 6 }}>
                      <MapPin size={14} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.subText, fontWeight: '600' }}>
                        {selectedPlace?.district ? `${selectedPlace.district}, ` : ''}{selectedPlace?.city || ''}
                      </Text>
                    </View>
                  )}

                  {/* Küçük Harita Önizlemesi */}
                  {selectedPlace?.latitude && selectedPlace?.longitude ? (
                    <View style={{ height: 210, width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
                      <MapComponent 
                        places={[{
                          id: (selectedPlace.id || 'preview').toString(),
                          name: selectedPlace.name,
                          category: selectedPlace.category || 'Mekan',
                          rating: 5,
                          latitude: Number(selectedPlace.latitude),
                          longitude: Number(selectedPlace.longitude)
                        }]}
                        initialRegion={{
                          latitude: Number(selectedPlace.latitude),
                          longitude: Number(selectedPlace.longitude),
                          latitudeDelta: 0.006,
                          longitudeDelta: 0.006
                        }}
                      />
                    </View>
                  ) : null}
                </View>

                <View style={styles.ratingContainer}>
                  <Text style={[styles.ratingLabel, { color: colors.text }]}>{t('your_rating_for_place')}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                        <Star 
                          size={36} 
                          color={star <= reviewRating ? "#F59E0B" : (isDark ? "#334155" : "#E2E8F0")} 
                          fill={star <= reviewRating ? "#F59E0B" : "transparent"} 
                          style={{ marginHorizontal: 4 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('why_recommend_optional')}</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder={t('review_placeholder')}
                    placeholderTextColor={colors.mutedText}
                    multiline
                    numberOfLines={3}
                    value={reviewText}
                    onChangeText={setReviewText}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <View style={styles.visibilityContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>{t('who_can_see')}</Text>
                  
                  <TouchableOpacity 
                    style={[styles.visibilityOption, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, reviewVisibility === 'public' && [styles.visibilityOptionActive, { borderColor: colors.primary, backgroundColor: colors.primaryBg }]]}
                    onPress={() => setReviewVisibility('public')}
                  >
                    <Globe size={20} color={reviewVisibility === 'public' ? colors.primary : colors.subText} />
                    <View style={styles.visibilityTextContainer}>
                      <Text style={[styles.visibilityTitle, { color: colors.text }, reviewVisibility === 'public' && [styles.visibilityTitleActive, { color: colors.primary }]]}>{t('visibility_public')}</Text>
                      <Text style={[styles.visibilityDesc, { color: colors.subText }]}>{t('visibility_public_desc')}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.visibilityOption, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, reviewVisibility === 'network' && [styles.visibilityOptionActive, { borderColor: colors.primary, backgroundColor: colors.primaryBg }]]}
                    onPress={() => setReviewVisibility('network')}
                  >
                    <Users size={20} color={reviewVisibility === 'network' ? colors.primary : colors.subText} />
                    <View style={styles.visibilityTextContainer}>
                      <Text style={[styles.visibilityTitle, { color: colors.text }, reviewVisibility === 'network' && [styles.visibilityTitleActive, { color: colors.primary }]]}>{t('visibility_network')}</Text>
                      <Text style={[styles.visibilityDesc, { color: colors.subText }]}>{t('visibility_network_desc')}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.visibilityOption, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, reviewVisibility === 'custom' && [styles.visibilityOptionActive, { borderColor: colors.primary, backgroundColor: colors.primaryBg }]]}
                    onPress={() => setReviewVisibility('custom')}
                  >
                    <Lock size={20} color={reviewVisibility === 'custom' ? colors.primary : colors.subText} />
                    <View style={styles.visibilityTextContainer}>
                      <Text style={[styles.visibilityTitle, { color: colors.text }, reviewVisibility === 'custom' && [styles.visibilityTitleActive, { color: colors.primary }]]}>{t('visibility_custom')}</Text>
                      <Text style={[styles.visibilityDesc, { color: colors.subText }]}>{t('visibility_custom_desc')}</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {reviewVisibility === 'custom' && (
                  <View style={[styles.friendSelectorContainer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.friendSelectorTitle, { color: colors.text }]}>{t('select_people_to_share')}</Text>
                    {myNetwork.length === 0 ? (
                      <Text style={[styles.noFriendsText, { backgroundColor: colors.cardBg, color: colors.subText }]}>
                        {t('no_friends_in_network')}
                      </Text>
                    ) : (
                      <>
                        <TextInput
                          style={[styles.friendSearchInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                          placeholder={t('search_in_network')}
                          placeholderTextColor={colors.mutedText}
                          value={friendSearchQuery}
                          onChangeText={setFriendSearchQuery}
                        />
                        <ScrollView style={[styles.friendListScroll, { borderColor: colors.border }]} nestedScrollEnabled={true}>
                          {myNetwork
                            .filter(f => 
                              f.full_name?.toLowerCase().includes(friendSearchQuery.toLowerCase()) || 
                              f.username?.toLowerCase().includes(friendSearchQuery.toLowerCase())
                            )
                            .map((friend) => {
                              const isSelected = selectedFriends.includes(friend.id);
                              return (
                                <TouchableOpacity 
                                  key={friend.id} 
                                  style={[styles.friendItem, { borderBottomColor: colors.border }]} 
                                  onPress={() => {
                                    if (isSelected) {
                                      setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                                    } else {
                                      setSelectedFriends([...selectedFriends, friend.id]);
                                    }
                                  }}
                                >
                                  <View style={[styles.friendAvatar, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.avatarText}>{getInitials(friend.full_name)}</Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.friendNameText, { color: colors.text }]}>{friend.full_name}</Text>
                                    <Text style={[styles.friendUsernameText, { color: colors.subText }]}>@{friend.username}</Text>
                                  </View>
                                  <View style={[styles.checkbox, { borderColor: colors.border }, isSelected && [styles.checkboxChecked, { backgroundColor: colors.primary, borderColor: colors.primary }]]}>
                                    {isSelected && <Check size={14} color="#FFFFFF" />}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                        </ScrollView>
                        <View style={styles.friendSelectorActions}>
                          <TouchableOpacity 
                            onPress={() => setSelectedFriends(myNetwork.map(f => f.id))}
                            style={styles.actionLink}
                          >
                            <Text style={[styles.actionLinkText, { color: colors.primary }]}>{t('select_all')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => setSelectedFriends([])}
                            style={styles.actionLink}
                          >
                            <Text style={[styles.actionLinkText, { color: colors.primary }]}>{t('clear_selection')}</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.primary }, isSaving && { opacity: 0.7 }, { marginTop: 16 }]}
                onPress={handleSaveReview}
                disabled={isSaving}
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? t('saving') : t('save_recommendation')}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  scrollContent: { paddingBottom: 40 },

  heroSection: { paddingHorizontal: 20, marginBottom: 32, marginTop: 10 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: '#64748B', marginBottom: 24 },
  
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, marginHorizontal: 20, marginBottom: 20, borderRadius: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  successText: { color: '#065F46', fontWeight: '600' },

  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 56, shadowColor: '#7B2CBF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#1E293B', outlineStyle: 'none' } as any,

  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  
  searchResultItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  resultIconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  resultInfo: { flex: 1, marginRight: 8 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  resultCategory: { fontSize: 13, color: '#64748B' },
  distanceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 8 },
  distanceBadgeText: { fontSize: 12, fontWeight: '700', color: '#7B2CBF' },
  
  categoriesGrid: { gap: 12 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  categoryIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },

  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  recentIconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  recentDetails: { fontSize: 13, color: '#64748B' },
  addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  modalCloseBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 4 },
  modalHeader: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 15, textAlign: 'center' },
  ratingContainer: { alignItems: 'center', marginBottom: 24 },
  ratingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  starsRow: { flexDirection: 'row', justifyContent: 'center' },
  inputContainer: { marginBottom: 24 },
  inputLabel: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  textArea: { borderWidth: 1, borderRadius: 16, padding: 16, height: 100, textAlignVertical: 'top', fontSize: 15 },
  visibilityContainer: { marginBottom: 32 },
  visibilityOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  visibilityOptionActive: {},
  visibilityTextContainer: { marginLeft: 16, flex: 1 },
  visibilityTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  visibilityTitleActive: {},
  visibilityDesc: { fontSize: 13 },
  saveBtn: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  friendSelectorContainer: { marginTop: 12, borderTopWidth: 1, paddingTop: 16, marginBottom: 20 },
  friendSelectorTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  noFriendsText: { fontSize: 13, lineHeight: 18, padding: 12, borderRadius: 12 },
  friendSearchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, marginBottom: 10 },
  friendListScroll: { maxHeight: 150, borderWidth: 1, borderRadius: 12, padding: 8 },
  friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  friendAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  friendNameText: { fontSize: 14, fontWeight: '600' },
  friendUsernameText: { fontSize: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: {},
  friendSelectorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  actionLink: { padding: 4 },
  actionLinkText: { fontSize: 12, fontWeight: '700' },
});
