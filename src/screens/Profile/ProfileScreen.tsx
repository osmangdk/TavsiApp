import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Image, Share, Clipboard, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Settings, Shield, MapPin, Copy, Check } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const CAT_KEYWORDS: { [key: string]: string[] } = {
  'Yeme & İçme': ['restaurant', 'cafe', 'fast_food', 'bar', 'bakery', 'restoran', 'kafe', 'yemek'],
  'Sağlık': ['hospital', 'clinic', 'pharmacy', 'doctors', 'doktor', 'klinik', 'hastane', 'eczane', 'sağlık'],
  'Kişisel Bakım': ['beauty', 'hairdresser', 'barber', 'spa', 'berber', 'kuaför', 'güzellik', 'bakım'],
  'Aktivite': ['gym', 'fitness', 'park', 'sport', 'spor', 'aktivite', 'müze', 'sinema'],
};

const CATEGORY_META = [
  { name: 'Yeme & İçme', emoji: '🍽️', color: '#F59E0B' },
  { name: 'Sağlık', emoji: '🏥', color: '#10B981' },
  { name: 'Kişisel Bakım', emoji: '✂️', color: '#EC4899' },
  { name: 'Aktivite', emoji: '🏃', color: '#3B82F6' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [recentPlaces, setRecentPlaces] = useState<any[]>([]);
  const [categories, setCategories] = useState(CATEGORY_META.map(c => ({ ...c, count: 0 })));
  const [stats, setStats] = useState({ following: 0, followers: 0, places: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteUsage, setInviteUsage] = useState({ used: 0, max: 5 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      // Profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profileData) setProfile(profileData);

      // Mekanlar
      const { data: placesData } = await supabase
        .from('user_places')
        .select('id, places(id, name, category, city, district)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (placesData) {
        const formatted = placesData.map((item: any) => ({
          id: item.places?.id,
          name: item.places?.name,
          category: item.places?.category || '',
          location: `${item.places?.district || ''}, ${item.places?.city || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, ''),
        })).filter(p => p.name);
        setRecentPlaces(formatted);

        // Kategori sayıları
        const updatedCats = CATEGORY_META.map(cat => {
          const keywords = CAT_KEYWORDS[cat.name] || [];
          const count = formatted.filter(p => {
            const c = (p.category || '').toLowerCase();
            return keywords.some(kw => c.includes(kw));
          }).length;
          return { ...cat, count };
        });
        setCategories(updatedCats);
      }

      // Bağlantı istatistikleri
      const [{ count: following }, { count: followers }] = await Promise.all([
        supabase.from('connections').select('id', { count: 'exact' }).eq('follower_id', session.user.id).eq('status', 'accepted'),
        supabase.from('connections').select('id', { count: 'exact' }).eq('following_id', session.user.id).eq('status', 'accepted'),
      ]);
      const { count: placesCount } = await supabase
        .from('user_places')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id);
      setStats({ following: following || 0, followers: followers || 0, places: placesCount || 0 });

      // Davetiye
      const { data: inviteData } = await supabase
        .from('invitations')
        .select('*')
        .eq('inviter_id', session.user.id)
        .single();
      if (inviteData) {
        setInviteCode(inviteData.code);
        setInviteUsage({ used: inviteData.used_count, max: inviteData.max_uses });
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await Clipboard.setString(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Kopyalandı', inviteCode);
    }
  };

  const handleShareCode = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `Seni Tavsi'ye davet ediyorum! Davetiye kodun: ${inviteCode}\nTavsi, güvendiğin kişilerin tavsiyelerini keşfetme uygulaması. tavsi.vercel.app`,
    });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#7B2CBF" />
      </View>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>@{profile?.username || 'kullanici'}</Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('PrivacyCenter')}>
          <Settings size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profil Bilgileri */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarMock}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.trustScoreBadge}>
              <Shield size={12} color="#FFF" />
              <Text style={styles.trustScoreText}>{profile?.trust_score || 100}</Text>
            </View>
          </View>
          
          <Text style={styles.name}>{profile?.full_name || 'İsimsiz Kullanıcı'}</Text>
          <Text style={styles.bio}>Tavsi ağı üyesi</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.following}</Text>
              <Text style={styles.statLabel}>Güvendiği</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.followers}</Text>
              <Text style={styles.statLabel}>Güvenenler</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.places}</Text>
              <Text style={styles.statLabel}>Tercih</Text>
            </View>
          </View>
        </View>

        {/* Kategoriler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat, i) => (
              <TouchableOpacity key={i} style={styles.categoryCard} activeOpacity={0.7}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={[styles.categoryCount, { color: cat.color }]}>{cat.count} Mekan</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tavsiyelerim */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Tavsiyeleriniz</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Add')}>
              <Text style={styles.seeAllText}>+ Ekle</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentList}>
            {recentPlaces.length === 0 ? (
              <Text style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>Henüz mekan eklemediniz.</Text>
            ) : (
              recentPlaces.slice(0, 5).map((place, i) => (
                <View key={place.id || i} style={[styles.recentItem, i === recentPlaces.slice(0, 5).length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.recentIconWrapper}>
                    <MapPin size={18} color="#7B2CBF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName}>{place.name}</Text>
                    <Text style={styles.recentDetails}>{place.category}{place.location ? ` • ${place.location}` : ''}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Davetiye */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arkadaşlarını Davet Et</Text>
          <View style={styles.inviteContainer}>
            <Text style={styles.inviteDescription}>
              Tavsi ağı sadece davetle büyür. Güvendiğiniz kişileri ağınıza katmak için bu kodu paylaşın.
            </Text>
            {inviteCode ? (
              <>
                <View style={styles.inviteCodeBox}>
                  <Text style={styles.inviteCodeLabel}>Davetiye Kodunuz</Text>
                  <Text style={styles.inviteCodeText} selectable={true}>{inviteCode}</Text>
                  <View style={styles.inviteProgressContainer}>
                    <Text style={styles.inviteUsageText}>Kalan Hakkınız: {inviteUsage.max - inviteUsage.used} / {inviteUsage.max}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${((inviteUsage.max - inviteUsage.used) / inviteUsage.max) * 100}%` as any }]} />
                    </View>
                  </View>
                </View>
                <View style={styles.inviteActions}>
                  <TouchableOpacity style={styles.inviteActionBtn} onPress={handleCopyCode}>
                    {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} color="#7B2CBF" />}
                    <Text style={[styles.inviteActionText, copied && { color: '#10B981' }]}>{copied ? 'Kopyalandı!' : 'Kopyala'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.inviteActionBtn, styles.inviteShareBtn]} onPress={handleShareCode}>
                    <Text style={styles.inviteShareText}>Paylaş</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={{ color: '#94A3B8', marginTop: 10 }}>Davetiye kodunuz yükleniyor...</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  settingsBtn: { padding: 4 },
  scrollContent: { paddingBottom: 60 },
  
  profileSection: { backgroundColor: '#FFFFFF', paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2, marginBottom: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarMock: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF' },
  trustScoreBadge: { position: 'absolute', bottom: 0, right: -10, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, borderWidth: 3, borderColor: '#FFFFFF' },
  trustScoreText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12, marginLeft: 3 },
  
  name: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  bio: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  
  statsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 24, width: '100%' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: '#E2E8F0', marginHorizontal: 8 },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  seeAllText: { color: '#7B2CBF', fontWeight: '700', fontSize: 14 },
  
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  categoryCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  categoryEmoji: { fontSize: 28, marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  categoryCount: { fontSize: 13, fontWeight: '600' },

  recentList: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  recentIconWrapper: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(123,44,191,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  recentName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  recentDetails: { fontSize: 13, color: '#64748B' },
  
  inviteContainer: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  inviteDescription: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 16 },
  inviteCodeBox: { backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 16 },
  inviteCodeLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 },
  inviteCodeText: { fontSize: 26, fontWeight: '900', color: '#7B2CBF', letterSpacing: 4, marginBottom: 16 },
  inviteProgressContainer: { width: '100%' },
  inviteUsageText: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  inviteActions: { flexDirection: 'row', gap: 12 },
  inviteActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#7B2CBF', gap: 6 },
  inviteActionText: { fontSize: 14, fontWeight: '700', color: '#7B2CBF' },
  inviteShareBtn: { backgroundColor: '#7B2CBF', borderColor: '#7B2CBF' },
  inviteShareText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
