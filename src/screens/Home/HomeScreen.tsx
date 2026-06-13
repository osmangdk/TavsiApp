import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Bell, MapPin, Star, ShieldCheck, Users } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  
  const [feed, setFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFeed();
    }
  }, [session]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      // 1. Ağımı al
      const { data: networkData, error: networkError } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', session!.user.id)
        .eq('status', 'accepted');

      if (networkError) throw networkError;

      const networkIds = networkData?.map(n => n.following_id) || [];

      if (networkIds.length === 0) {
        setFeed([]);
        setIsLoading(false);
        return;
      }

      // 2. Ağımın eklediği mekanları al (Sadece Public ve Network görünürlüğündekiler)
      const { data: feedData, error: feedError } = await supabase
        .from('user_places')
        .select(`
          id, rating, review_text, visibility, created_at,
          profiles (id, full_name, username, avatar_url),
          places (id, name, category, district, city)
        `)
        .in('user_id', networkIds)
        .in('visibility', ['public', 'network'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (feedError) throw feedError;

      setFeed(feedData || []);
    } catch (error) {
      console.error("Feed çekilirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          color={i <= rating ? '#F59E0B' : '#E2E8F0'} 
          fill={i <= rating ? '#F59E0B' : 'transparent'} 
        />
      );
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tavsi</Text>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell size={24} color="#1E293B" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Güvendiğim Kişilerin Gittiği Yerler (Trust Feed) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Güvendiklerin Nereye Gidiyor?</Text>
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 20 }} />
          ) : feed.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Users size={32} color="#7B2CBF" />
              </View>
              <Text style={styles.emptyTitle}>Ağınız Çok Sessiz</Text>
              <Text style={styles.emptyDesc}>Güvendiğiniz kişiler henüz bir tavsiye paylaşmadı veya ağınıza yeni kişiler eklemeniz gerekiyor.</Text>
              <TouchableOpacity 
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Network')}
              >
                <Text style={styles.primaryBtnText}>Ağını Büyüt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalFeed}>
              {feed.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarMock}>
                      <Text style={styles.avatarText}>{getInitials(item.profiles?.full_name)}</Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{item.profiles?.full_name}</Text>
                      <Text style={styles.actionText}>tavsiye ediyor</Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.placeName}>{item.places?.name}</Text>
                    <Text style={styles.categoryText}>{item.places?.category} • {item.places?.district}</Text>
                    <View style={styles.ratingRow}>
                      {renderStars(item.rating || 0)}
                    </View>
                    {item.review_text && (
                      <Text style={styles.reviewText} numberOfLines={3}>"{item.review_text}"</Text>
                    )}
                  </View>
                  <View style={styles.trustBadge}>
                    <ShieldCheck size={14} color="#10B981" />
                    <Text style={styles.trustText}>Güvenli Ağ</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Ağımda Trend Olanlar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginHorizontal: 20 }]}>Ağınızdaki Trendler</Text>
          
          <TouchableOpacity style={styles.trendingItem}>
            <View style={styles.trendingIconWrapper}><Text style={{fontSize: 24}}>☕</Text></View>
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingName}>Paper Roasting Coffee</Text>
              <Text style={styles.trendingDetail}>Ağınızdan 12 kişi burayı önerdi</Text>
            </View>
            <MapPin size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.trendingItem}>
            <View style={styles.trendingIconWrapper}><Text style={{fontSize: 24}}>🏋️</Text></View>
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingName}>MACFit Armada</Text>
              <Text style={styles.trendingDetail}>Ağınızdan 8 kişi aktif olarak gidiyor</Text>
            </View>
            <MapPin size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#7B2CBF', letterSpacing: -0.5, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  notificationBtn: { padding: 8, position: 'relative' },
  badge: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF' },
  
  scrollContent: { paddingVertical: 20 },
  section: { marginBottom: 32 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', marginBottom: 16 },
  
  horizontalFeed: { paddingHorizontal: 16, gap: 16 },
  card: { width: 300, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginLeft: 4, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarMock: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  actionText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  
  cardContent: { marginBottom: 16 },
  placeName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  categoryText: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  reviewText: { fontSize: 14, color: '#334155', fontStyle: 'italic', lineHeight: 20 },
  
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start' },
  trustText: { color: '#10B981', fontWeight: '700', fontSize: 12, marginLeft: 6 },
  
  trendingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  trendingIconWrapper: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  trendingInfo: { flex: 1 },
  trendingName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  trendingDetail: { fontSize: 13, color: '#7B2CBF', fontWeight: '600' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 40, backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyIconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(123, 44, 191, 0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  primaryBtn: { backgroundColor: '#7B2CBF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
