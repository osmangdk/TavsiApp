import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Shield, MapPin, UserPlus, UserCheck, Clock } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function UserProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const { userId } = route.params || {};

  const [profile, setProfile] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null); // 'accepted', 'pending', null
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      // 1. Profil Bilgileri
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profData) setProfile(profData);

      // 2. Bağlantı Durumu
      if (session?.user?.id && session.user.id !== userId) {
        const { data: conn } = await supabase
          .from('connections')
          .select('status')
          .eq('follower_id', session.user.id)
          .eq('following_id', userId)
          .maybeSingle();

        setConnectionStatus(conn?.status || null);
      }

      // 3. Kullanıcının Eklediği Mekanlar
      const { data: userPlaces } = await supabase
        .from('user_places')
        .select('id, rating, review_text, places(id, name, category, district, city)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (userPlaces) {
        const formatted = userPlaces.map((up: any) => ({
          id: up.places?.id,
          name: up.places?.name,
          category: up.places?.category,
          location: `${up.places?.district || ''}, ${up.places?.city || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
          rating: up.rating,
          reviewText: up.review_text
        })).filter(p => p.name);
        setPlaces(formatted);
      }
    } catch (error) {
      console.error('Kullanıcı profili yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConnection = async () => {
    if (!session?.user?.id || !userId || session.user.id === userId) return;
    setActionLoading(true);
    try {
      if (connectionStatus === 'accepted' || connectionStatus === 'pending') {
        // İsteği/Bağlantıyı Sil
        await supabase
          .from('connections')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', userId);
        setConnectionStatus(null);
      } else {
        // Bağlantı İsteği Gönder
        await supabase
          .from('connections')
          .insert({
            follower_id: session.user.id,
            following_id: userId,
            status: 'pending'
          });
        setConnectionStatus('pending');
      }
    } catch (e) {
      console.error('Bağlantı işlemi hatası:', e);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      </SafeAreaView>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const isSelf = session?.user?.id === userId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{profile?.username || 'kullanici'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        {/* Profil Kartı */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarMock}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.trustScoreBadge}>
              <Shield size={12} color="#FFF" />
              <Text style={styles.trustScoreText}>{profile?.trust_score || 100}</Text>
            </View>
          </View>

          <Text style={styles.name}>{profile?.full_name || 'İsimsiz Kullanıcı'}</Text>
          <Text style={styles.bio}>{profile?.bio || 'Tavsi topluluk üyesi'}</Text>

          {/* Aksiyon Butonu */}
          {!isSelf && (
            <TouchableOpacity 
              style={[
                styles.connectBtn, 
                connectionStatus === 'accepted' && styles.connectBtnAccepted,
                connectionStatus === 'pending' && styles.connectBtnPending,
              ]}
              onPress={handleToggleConnection}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color={connectionStatus ? '#1E293B' : '#FFFFFF'} />
              ) : connectionStatus === 'accepted' ? (
                <>
                  <UserCheck size={18} color="#10B981" />
                  <Text style={styles.connectBtnTextAccepted}>Güveniyorsun</Text>
                </>
              ) : connectionStatus === 'pending' ? (
                <>
                  <Clock size={18} color="#F59E0B" />
                  <Text style={styles.connectBtnTextPending}>İstek Gönderildi</Text>
                </>
              ) : (
                <>
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.connectBtnText}>Ağıma Ekle</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Kullanıcının Tavsiyeleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tavsiye Ettikleri ({places.length})</Text>

          {places.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Henüz kayıtlı tavsiyesi bulunmuyor.</Text>
            </View>
          ) : (
            places.map((place, i) => (
              <TouchableOpacity 
                key={place.id || i}
                style={styles.placeCard}
                onPress={() => place.id && navigation.navigate('PlaceDetail', { placeId: place.id, placeData: place })}
                activeOpacity={0.8}
              >
                <View style={styles.placeIconWrapper}>
                  <MapPin size={20} color="#7B2CBF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeDetails}>{place.category}{place.location ? ` • ${place.location}` : ''}</Text>
                  {place.reviewText ? (
                    <Text style={styles.placeReview} numberOfLines={2}>"{place.reviewText}"</Text>
                  ) : null}
                </View>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  scrollContent: { paddingBottom: 40 },

  profileCard: { backgroundColor: '#FFFFFF', alignItems: 'center', padding: 24, marginHorizontal: 20, marginTop: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarMock: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  trustScoreBadge: { position: 'absolute', bottom: 0, right: -6, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16, borderWidth: 3, borderColor: '#FFFFFF' },
  trustScoreText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, marginLeft: 2 },

  name: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  bio: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 16 },

  connectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7B2CBF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, gap: 8 },
  connectBtnAccepted: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  connectBtnPending: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  connectBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  connectBtnTextAccepted: { color: '#10B981', fontSize: 15, fontWeight: '700' },
  connectBtnTextPending: { color: '#D97706', fontSize: 15, fontWeight: '700' },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  emptyState: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyStateText: { color: '#94A3B8', fontSize: 14 },

  placeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  placeIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(123,44,191,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  placeName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  placeDetails: { fontSize: 13, color: '#64748B' },
  placeReview: { fontSize: 13, color: '#475569', fontStyle: 'italic', marginTop: 6 }
});
