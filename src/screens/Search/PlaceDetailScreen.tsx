import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Linking, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, MapPin, Star, Navigation, Bookmark, ShieldCheck, Check } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import MapComponent from '../../components/MapComponent';

export default function PlaceDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  
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
      let currentPlace = placeData;

      if (placeId && !currentPlace?.latitude) {
        const { data: dbPlace } = await supabase
          .from('places')
          .select('*')
          .eq('id', placeId)
          .single();
        if (dbPlace) currentPlace = dbPlace;
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
    if (!place?.latitude || !place?.longitude) {
      Alert.alert('Konum Bilgisi', 'Bu mekanın harita koordinatları bulunmuyor.');
      return;
    }

    const lat = place.latitude;
    const lng = place.longitude;
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
      <Star key={i} size={14} color={i <= rating ? '#F59E0B' : '#E2E8F0'} fill={i <= rating ? '#F59E0B' : 'transparent'} />
    ));
  };

  if (isLoading && !place) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      </SafeAreaView>
    );
  }

  const mapPlaceData = place?.latitude ? [{
    id: place.id || '1',
    name: place.name || 'Mekan',
    category: place.category || 'Mekan',
    rating: 5,
    latitude: place.latitude,
    longitude: place.longitude,
    recommendedBy: place.district ? `${place.district}, ${place.city || ''}` : place.city
  }] : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{place?.name || 'Mekan Detayı'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleToggleSave} disabled={savedLoading}>
          <Bookmark size={22} color={isSaved ? '#7B2CBF' : '#64748B'} fill={isSaved ? '#7B2CBF' : 'transparent'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Harita Görünümü */}
        {place?.latitude && place?.longitude ? (
          <View style={styles.mapWrapper}>
            <MapComponent places={mapPlaceData} initialRegion={{ latitude: place.latitude, longitude: place.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }} />
          </View>
        ) : null}

        {/* Ana Bilgiler */}
        <View style={styles.infoCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{place?.category || 'Mekan'}</Text>
          </View>
          <Text style={styles.placeName}>{place?.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.locationText}>
              {[place?.district, place?.city].filter(Boolean).join(', ') || 'Konum belirtilmemiş'}
            </Text>
          </View>

          {/* Eylem Butonları */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.directionBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
              <Navigation size={18} color="#FFFFFF" />
              <Text style={styles.directionBtnText}>Yol Tarifi Al</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveActionBtn, isSaved && styles.saveActionBtnActive]} 
              onPress={handleToggleSave} 
              disabled={savedLoading}
              activeOpacity={0.8}
            >
              {isSaved ? <Check size={18} color="#7B2CBF" /> : <Bookmark size={18} color="#7B2CBF" />}
              <Text style={[styles.saveActionText, isSaved && styles.saveActionTextActive]}>
                {isSaved ? 'Kaydedildi' : 'Rehberime Ekle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tavsiyeler & Yorumlar Bölümü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ağınızdaki Tavsiyeler ({reviews.length})</Text>

          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <ShieldCheck size={36} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>Henüz ağınızda bu mekana özel bir değerlendirme yapılmamış.</Text>
            </View>
          ) : (
            reviews.map((rev) => (
              <TouchableOpacity 
                key={rev.id} 
                style={styles.reviewCard}
                onPress={() => rev.profiles?.id && navigation.navigate('UserProfile', { userId: rev.profiles.id })}
                activeOpacity={0.8}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.avatarMock}>
                    <Text style={styles.avatarText}>
                      {(rev.profiles?.full_name || 'U').substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{rev.profiles?.full_name || 'Gizli Kullanıcı'}</Text>
                    <Text style={styles.reviewerUsername}>@{rev.profiles?.username || 'kullanici'}</Text>
                  </View>
                  <View style={styles.ratingRow}>{renderStars(rev.rating || 5)}</View>
                </View>
                {rev.review_text ? (
                  <Text style={styles.reviewBody}>{rev.review_text}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginHorizontal: 8 },
  scrollContent: { paddingBottom: 40 },

  mapWrapper: { height: 220, width: '100%', overflow: 'hidden' },
  infoCard: { backgroundColor: '#FFFFFF', margin: 20, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', marginTop: -20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(123,44,191,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12 },
  categoryBadgeText: { color: '#7B2CBF', fontSize: 12, fontWeight: '700' },
  placeName: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { fontSize: 14, color: '#64748B', marginLeft: 6 },

  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  directionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7B2CBF', paddingVertical: 14, borderRadius: 16, gap: 8 },
  directionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  saveActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3E8FF', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#D8B4E2', gap: 8 },
  saveActionBtnActive: { backgroundColor: '#E9D5FF' },
  saveActionText: { color: '#7B2CBF', fontSize: 15, fontWeight: '700' },
  saveActionTextActive: { color: '#6B21A8' },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  emptyState: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyStateText: { marginTop: 12, color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  reviewCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarMock: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  reviewerName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  reviewerUsername: { fontSize: 12, color: '#94A3B8' },
  ratingRow: { flexDirection: 'row', gap: 2 },
  reviewBody: { fontSize: 14, color: '#334155', lineHeight: 20, marginTop: 4 },
});
