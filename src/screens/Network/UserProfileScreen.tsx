import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Shield, MapPin, UserPlus, UserCheck, Clock, Check, X, Sparkles } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCategory, formatLocation } from '../../utils/categoryTranslator';

export default function UserProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { session } = useAuth();
  const { colors, isDark, language, t } = useTheme();
  const { userId } = route.params || {};

  const [profile, setProfile] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null); // 'accepted', 'pending', 'incoming', null
  const [connectionId, setConnectionId] = useState<string | null>(null);
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
        .select('id, full_name, username, avatar_url, bio, city, district, trust_score')
        .eq('id', userId)
        .single();
      if (profData) {
        setProfile(profData);
        if (profData.district || profData.city) {
          setUserLocation([profData.district, profData.city].filter(Boolean).join(', '));
        }
      }

      // 2. Çift Yönlü Bağlantı Durumu
      if (session?.user?.id && session.user.id !== userId) {
        // Giden istek (Ben mi istek yolladım?)
        const { data: sentConn } = await supabase
          .from('connections')
          .select('id, status')
          .eq('follower_id', session.user.id)
          .eq('following_id', userId)
          .maybeSingle();

        // Gelen istek (O mu bana istek yolladı?)
        const { data: incomingConn } = await supabase
          .from('connections')
          .select('id, status')
          .eq('follower_id', userId)
          .eq('following_id', session.user.id)
          .maybeSingle();

        if (sentConn?.status === 'accepted' || incomingConn?.status === 'accepted') {
          setConnectionStatus('accepted');
          setConnectionId(sentConn?.id || incomingConn?.id);
        } else if (incomingConn?.status === 'pending') {
          setConnectionStatus('incoming');
          setConnectionId(incomingConn.id);
        } else if (sentConn?.status === 'pending') {
          setConnectionStatus('pending');
          setConnectionId(sentConn.id);
        } else {
          setConnectionStatus(null);
          setConnectionId(null);
        }
      }

      // 3. Kullanıcının Tavsiyeleri
      const { data: placesData } = await supabase
        .from('user_places')
        .select('id, rating, review_text, places(id, name, category, district, city)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (placesData) {
        setPlaces(placesData.map((item: any) => ({
          id: item.places?.id,
          name: item.places?.name,
          category: item.places?.category,
          location: [item.places?.district, item.places?.city].filter(Boolean).join(', '),
          rating: item.rating,
          reviewText: item.review_text
        })));
      }
    } catch (error) {
      console.error('Kullanıcı profili yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConnection = async () => {
    if (!session?.user?.id || !userId || actionLoading) return;
    setActionLoading(true);
    try {
      if (connectionStatus === 'pending') {
        // İsteği Geri Çek
        if (connectionId) {
          await supabase.from('connections').delete().eq('id', connectionId);
        } else {
          await supabase
            .from('connections')
            .delete()
            .eq('follower_id', session.user.id)
            .eq('following_id', userId);
        }
        setConnectionStatus(null);
        setConnectionId(null);
      } else if (connectionStatus === 'accepted') {
        // Takipten Çıkar
        Alert.alert(
          'Ağdan Çıkar',
          `${profile?.full_name} kullanıcısını güven ağınızdan çıkarmak istiyor musunuz?`,
          [
            { text: 'Vazgeç', style: 'cancel' },
            { 
              text: 'Çıkar', 
              style: 'destructive',
              onPress: async () => {
                if (connectionId) {
                  await supabase.from('connections').delete().eq('id', connectionId);
                }
                setConnectionStatus(null);
                setConnectionId(null);
              }
            }
          ]
        );
      } else {
        // Yeni İstek Gönder
        const { data, error } = await supabase
          .from('connections')
          .insert([{
            follower_id: session.user.id,
            following_id: userId,
            status: 'pending'
          }])
          .select('id')
          .single();

        if (!error && data) {
          setConnectionStatus('pending');
          setConnectionId(data.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Gelen isteği kabul etme
  const handleAcceptIncoming = async () => {
    if (!connectionId || actionLoading) return;
    setActionLoading(true);
    try {
      await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      // Karşılıklı pending istekleri temizle
      await supabase
        .from('connections')
        .delete()
        .eq('follower_id', session!.user.id)
        .eq('following_id', userId)
        .eq('status', 'pending');

      setConnectionStatus('accepted');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Gelen isteği reddetme
  const handleRejectIncoming = async () => {
    if (!connectionId || actionLoading) return;
    setActionLoading(true);
    try {
      await supabase.from('connections').delete().eq('id', connectionId);
      setConnectionStatus(null);
      setConnectionId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  const isSelf = session?.user?.id === userId;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>@{profile?.username || 'kullanici'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        {/* Profil Kartı */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarMock, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.trustScoreBadge}>
              <Shield size={12} color="#FFF" />
              <Text style={styles.trustScoreText}>{profile?.trust_score || 100}</Text>
            </View>
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || t('network_unnamed_user')}</Text>
          <Text style={[styles.usernameText, { color: colors.primary }]}>@{profile?.username || 'kullanici'}</Text>

          {/* Konum Bilgisi (İl / İlçe) */}
          {userLocation ? (
            <View style={[styles.locationBadge, { backgroundColor: isDark ? '#334155' : '#F8F9FA', borderColor: colors.cardBorder }]}>
              <MapPin size={14} color={colors.primary} />
              <Text style={[styles.locationBadgeText, { color: colors.subText }]}>{formatLocation(userLocation, language)}</Text>
            </View>
          ) : null}

          {profile?.bio ? (
            <Text style={[styles.bio, { color: colors.subText }]}>"{profile.bio}"</Text>
          ) : null}

          {/* Gelen İstek Var ise Özel Kabul/Reddet Paneli */}
          {!isSelf && connectionStatus === 'incoming' && (
            <View style={[
              styles.incomingBanner, 
              { 
                backgroundColor: isDark ? 'rgba(157, 78, 221, 0.15)' : '#FAF5FF', 
                borderColor: isDark ? 'rgba(157, 78, 221, 0.3)' : '#E9D5FF' 
              }
            ]}>
              <Text style={[styles.incomingBannerText, { color: colors.primary }]}>{t('user_wants_to_connect')}</Text>
              <View style={styles.incomingActionsRow}>
                <TouchableOpacity 
                  style={[styles.incomingRejectBtn, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} 
                  onPress={handleRejectIncoming}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <X size={18} color="#EF4444" />
                  <Text style={[styles.incomingRejectText, isDark && { color: '#F87171' }]}>{t('network_reject')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.incomingAcceptBtn} 
                  onPress={handleAcceptIncoming}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                >
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.incomingAcceptText}>{t('network_accept')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Standart İstek Gönderme / Ağda Aksiyon Butonu */}
          {!isSelf && connectionStatus !== 'incoming' && (
            <TouchableOpacity 
              style={[
                styles.connectBtn, 
                { backgroundColor: colors.primary },
                connectionStatus === 'accepted' && (isDark ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' } : styles.connectBtnAccepted),
                connectionStatus === 'pending' && (isDark ? { backgroundColor: 'rgba(217, 119, 6, 0.15)', borderWidth: 1, borderColor: 'rgba(217, 119, 6, 0.3)' } : styles.connectBtnPending),
              ]}
              onPress={handleToggleConnection}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator color={connectionStatus ? (isDark ? '#FFFFFF' : '#1E293B') : '#FFFFFF'} />
              ) : connectionStatus === 'accepted' ? (
                <>
                  <UserCheck size={18} color="#10B981" />
                  <Text style={styles.connectBtnTextAccepted}>{t('in_your_network_trusted')}</Text>
                </>
              ) : connectionStatus === 'pending' ? (
                <>
                  <Clock size={18} color={isDark ? '#FBBF24' : '#D97706'} />
                  <Text style={[styles.connectBtnTextPending, isDark && { color: '#FBBF24' }]}>{t('request_sent_cancel')}</Text>
                </>
              ) : (
                <>
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.connectBtnText}>{t('add_to_my_network')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Kullanıcının Tavsiyeleri */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('user_recommendations_title')} ({places.length})</Text>
            {places.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Sparkles size={14} color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>{t('recommended_badge')}</Text>
              </View>
            )}
          </View>

          {places.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.emptyStateText, { color: colors.mutedText }]}>{t('no_user_places_yet')}</Text>
            </View>
          ) : (
            places.map((place, i) => (
              <TouchableOpacity 
                key={place.id || i}
                style={[styles.placeCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                onPress={() => place.id && navigation.navigate('PlaceDetail', { placeId: place.id, placeData: place })}
                activeOpacity={0.8}
              >
                <View style={[styles.placeIconWrapper, { backgroundColor: colors.primaryBg }]}>
                  <MapPin size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.placeName, { color: colors.text }]}>{place.name}</Text>
                  <Text style={[styles.placeDetails, { color: colors.subText }]}>{formatCategory(place.category, language, place.name)}{place.location ? ` • ${formatLocation(place.location, language)}` : ''}</Text>
                  {place.reviewText ? (
                    <Text style={[styles.placeReview, { color: colors.subText }]} numberOfLines={2}>"{place.reviewText}"</Text>
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 14 : 10, 
    paddingBottom: 16, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  scrollContent: { paddingBottom: 40 },

  profileCard: { 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    padding: 24, 
    marginHorizontal: 20, 
    marginTop: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  avatarContainer: { position: 'relative', marginBottom: 14 },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarMock: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  trustScoreBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -4, 
    backgroundColor: '#10B981', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 14, 
    borderWidth: 2.5, 
    borderColor: '#FFFFFF' 
  },
  trustScoreText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11, marginLeft: 2 },

  name: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  usernameText: { fontSize: 14, color: '#7B2CBF', fontWeight: '600', marginBottom: 8 },
  
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    marginBottom: 10
  },
  locationBadgeText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  bio: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 16, paddingHorizontal: 10, fontStyle: 'italic' },

  // Gelen İstek Paneli
  incomingBanner: {
    width: '100%',
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 4
  },
  incomingBannerText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14
  },
  incomingActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  incomingRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6
  },
  incomingRejectText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  incomingAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6
  },
  incomingAcceptText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  connectBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#7B2CBF', 
    paddingHorizontal: 26, 
    paddingVertical: 13, 
    borderRadius: 18, 
    gap: 8,
    marginTop: 6
  },
  connectBtnAccepted: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  connectBtnPending: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  connectBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  connectBtnTextAccepted: { color: '#10B981', fontSize: 15, fontWeight: '700' },
  connectBtnTextPending: { color: '#D97706', fontSize: 15, fontWeight: '700' },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  emptyState: { backgroundColor: '#FFFFFF', padding: 24, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyStateText: { color: '#94A3B8', fontSize: 14 },

  placeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  placeIconWrapper: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(123,44,191,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  placeName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  placeDetails: { fontSize: 13, color: '#64748B' },
  placeReview: { fontSize: 13, color: '#475569', fontStyle: 'italic', marginTop: 6 }
});
