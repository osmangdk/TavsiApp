import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image } from 'react-native';
import { Bell, MapPin, Star, ShieldCheck, Users, Plus, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  
  const [feed, setFeed] = useState<any[]>([]);
  const [myPlaces, setMyPlaces] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([
    { name: 'Yeme & İçme', count: 0, emoji: '🍽️', color: '#F59E0B' },
    { name: 'Sağlık', count: 0, emoji: '🏥', color: '#10B981' },
    { name: 'Kişisel Bakım', count: 0, emoji: '✂️', color: '#EC4899' },
    { name: 'Aktivite', count: 0, emoji: '🏃', color: '#3B82F6' },
  ]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchAll();
    }
  }, [session]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (session?.user?.id) {
        fetchMyPlaces();
      }
    });
    return unsubscribe;
  }, [navigation, session]);


  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchFeed(), fetchMyPlaces(), fetchPendingRequests()]);
    setIsLoading(false);
  };

  const fetchMyPlaces = async () => {
    try {
      // 1. Kullanıcının eklediği tüm mekanları çek
      const { data } = await supabase
        .from('user_places')
        .select('id, places(id, name, category, district, city)')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.places?.id,
          name: item.places?.name,
          category: item.places?.category,
          location: `${item.places?.district || ''}, ${item.places?.city || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
        })).filter(p => p.name);
        
        // Tavsiyeleriniz listesine sadece son 5 tanesini koyalım
        setMyPlaces(formatted.slice(0, 5));

        // Kategori kelime eşleştirmeleri (Tavsi ana kategorileri ve alt kategorileri)
        const catKeywords: { [key: string]: string[] } = {
          'Yeme & İçme': ['yeme', 'içme', 'restoran', 'cafe', 'kafe', 'kebap', 'kahvaltı', 'tatlı', 'burger', 'sokak lezzetleri', 'meyhane', 'food', 'bakery', 'bar', 'pub'],
          'Sağlık': ['sağlık', 'medikal', 'doktor', 'diş', 'psikolog', 'diyetisyen', 'göz', 'veteriner', 'fizik tedavi', 'klinik', 'hastane', 'eczane', 'health'],
          'Kişisel Bakım': ['kişisel bakım', 'kuaför', 'berber', 'güzellik', 'lazer', 'tırnak', 'cilt bakımı', 'spa', 'beauty', 'salon'],
          'Aktivite': ['aktivite', 'spor', 'pilates', 'yoga', 'halı saha', 'dans', 'gym', 'fitness', 'müze', 'sinema'],
        };

        const updatedCats = [
          { name: 'Yeme & İçme', emoji: '🍽️', color: '#F59E0B' },
          { name: 'Sağlık', emoji: '🏥', color: '#10B981' },
          { name: 'Kişisel Bakım', emoji: '✂️', color: '#EC4899' },
          { name: 'Aktivite', emoji: '🏃', color: '#3B82F6' },
        ].map(cat => {
          const keywords = catKeywords[cat.name] || [];
          const count = formatted.filter(p => {
            const cat_lower = (p.category || '').toLowerCase();
            return keywords.some(kw => cat_lower.includes(kw));
          }).length;
          return { ...cat, count };
        });

        setCategories(updatedCats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFeed = async () => {
    try {
      const { data: networkData } = await supabase
        .from('connections')
        .select('following_id')
        .eq('follower_id', session!.user.id)
        .eq('status', 'accepted');

      const networkIds = networkData?.map(n => n.following_id) || [];
      if (networkIds.length === 0) return;

      const { data: feedData } = await supabase
        .from('user_places')
        .select(`
          id, rating, review_text, visibility, created_at,
          profiles!user_places_user_id_fkey (id, full_name, username, avatar_url),
          places (id, name, category, district, city)
        `)
        .in('user_id', networkIds)
        .in('visibility', ['public', 'network'])
        .order('created_at', { ascending: false })
        .limit(20);

      setFeed(feedData || []);
    } catch (error) {
      console.error("Feed çekilirken hata:", error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { count } = await supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('following_id', session!.user.id)
        .eq('status', 'pending');
      setPendingRequests(count || 0);
    } catch (e) {}
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={14} color={i <= rating ? '#F59E0B' : '#E2E8F0'} fill={i <= rating ? '#F59E0B' : 'transparent'} />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tavsi</Text>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('Notifications')}>
          <Bell size={24} color="#1E293B" />
          {pendingRequests > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingRequests > 9 ? '9+' : pendingRequests}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7B2CBF" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Welcome Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTag}>VERİ TABANI GÜNCEL</Text>
              <Text style={styles.heroTitle}>Ankara'da 144K+ Mekan Keşfet</Text>
              <Text style={styles.heroSub}>Güvendiğin kişilerin tavsiyeleriyle en doğru yere ulaş.</Text>
            </View>
            <TouchableOpacity 
              style={styles.heroButton} 
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SearchTab')}
            >
              <Text style={styles.heroButtonText}>Haritada Gör</Text>
            </TouchableOpacity>
          </View>

          {/* Kategoriler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.categoryCard} 
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('SearchTab', { categoryFilter: cat.name })}
                >
                  <View style={styles.categoryHeaderRow}>
                    <View style={[styles.categoryIconCapsule, { backgroundColor: `${cat.color}15` }]}>
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={[styles.categoryCount, { color: cat.color }]}>
                    {cat.count > 0 ? `${cat.count} Mekanınız` : 'Mekanları İncele'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tavsiyeleriniz */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tavsiyeleriniz</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AddTab')}>
                <Text style={styles.seeAll}>+ Ekle</Text>
              </TouchableOpacity>
            </View>
            
            {myPlaces.length === 0 ? (
              <TouchableOpacity style={styles.emptyCard} onPress={() => navigation.navigate('AddTab')}>
                <View style={styles.emptyPlusWrapper}>
                  <Plus size={28} color="#7B2CBF" />
                </View>
                <Text style={styles.emptyTitle}>İlk Mekanınızı Ekleyin</Text>
                <Text style={styles.emptyDesc}>Güvendiğiniz mekanları ve uzmanları ağınızla paylaşın.</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.placesList}>
                {myPlaces.map((place, i) => (
                  <TouchableOpacity 
                    key={place.id || i} 
                    style={styles.placeItem}
                    onPress={() => place.id && navigation.navigate('PlaceDetail', { placeId: place.id, placeData: place })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.placeIcon}>
                      <MapPin size={20} color="#7B2CBF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.placeName}>{place.name}</Text>
                      <Text style={styles.placeDetails}>{place.category} • {place.location}</Text>
                    </View>
                    <ChevronRight size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Güvendiğin Kişilerin Feed'i */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Güvendiklerin Nereye Gidiyor?</Text>
            
            {feed.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Users size={32} color="#7B2CBF" />
                <Text style={styles.emptyTitle}>Ağınız Çok Sessiz</Text>
                <Text style={styles.emptyDesc}>Güvendiğiniz kişiler henüz bir tavsiye paylaşmadı.</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('NetworkTab')}>
                  <Text style={styles.primaryBtnText}>Ağını Büyüt</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalFeed}>
                {feed.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <TouchableOpacity 
                      style={styles.cardHeader}
                      onPress={() => item.profiles?.id && navigation.navigate('UserProfile', { userId: item.profiles.id })}
                      activeOpacity={0.8}
                    >
                      <View style={styles.avatarMock}>
                        {item.profiles?.avatar_url ? (
                          <Image source={{ uri: item.profiles.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                        ) : (
                          <Text style={styles.avatarText}>{getInitials(item.profiles?.full_name)}</Text>
                        )}
                      </View>
                      <View>
                        <Text style={styles.userName}>{item.profiles?.full_name}</Text>
                        <Text style={styles.actionText}>tavsiye ediyor</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.cardContent}
                      onPress={() => item.places?.id && navigation.navigate('PlaceDetail', { placeId: item.places.id, placeData: item.places })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cardPlaceName}>{item.places?.name}</Text>
                      <Text style={styles.categoryText}>{item.places?.category} • {item.places?.district}</Text>
                      <View style={styles.ratingRow}>{renderStars(item.rating || 0)}</View>
                      {item.review_text && (
                        <Text style={styles.reviewText} numberOfLines={3}>"{item.review_text}"</Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.trustBadge}>
                      <ShieldCheck size={14} color="#10B981" />
                      <Text style={styles.trustText}>Güvenli Ağ</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#7B2CBF', letterSpacing: -0.5 },
  notificationBtn: { padding: 8, position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  scrollContent: { paddingVertical: 20, paddingBottom: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  seeAll: { color: '#7B2CBF', fontWeight: '700', fontSize: 14 },

  heroBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#7B2CBF',
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroTextContainer: { flex: 1, paddingRight: 12 },
  heroTag: { fontSize: 10, fontWeight: '800', color: '#E9D5FF', letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 4, lineHeight: 24 },
  heroSub: { fontSize: 12, color: '#F3E8FF', lineHeight: 17 },
  heroButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroButtonText: { color: '#7B2CBF', fontWeight: '800', fontSize: 12 },

  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconCapsule: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: { fontSize: 20 },
  categoryName: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
  categoryCount: { fontSize: 12, fontWeight: '600' },

  emptyCard: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 2, borderColor: '#F3E8FF', borderStyle: 'dashed' },
  emptyPlusWrapper: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyFeed: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginTop: 4, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  primaryBtn: { backgroundColor: '#7B2CBF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  placesList: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  placeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  placeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(123,44,191,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  placeName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  placeDetails: { fontSize: 13, color: '#64748B' },

  horizontalFeed: { paddingHorizontal: 16, gap: 16 },
  card: { width: 300, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginLeft: 4, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarMock: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  actionText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardContent: { marginBottom: 16 },
  cardPlaceName: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  categoryText: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  reviewText: { fontSize: 14, color: '#334155', fontStyle: 'italic', lineHeight: 20 },
  trustBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start' },
  trustText: { color: '#10B981', fontWeight: '700', fontSize: 12, marginLeft: 6 },
});
