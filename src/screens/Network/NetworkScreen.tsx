import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Search, UserPlus, Users, MoreHorizontal, Check, X } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useRoute } from '@react-navigation/native';

export default function NetworkScreen() {
  const { session } = useAuth();
  const route = useRoute<any>();
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'friends'); // 'friends' or 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [myNetwork, setMyNetwork] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Sync tab if route params change
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNetworkData();
    }
  }, [session, activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchNetworkData = async () => {
    setIsLoading(true);
    try {
      // 1. Ağımı Çek (Benim güvendiklerim)
      const { data: networkData, error: networkError } = await supabase
        .from('connections')
        .select(`
          id,
          status,
          profiles!connections_following_id_fkey (
            id, full_name, username, avatar_url
          )
        `)
        .eq('follower_id', session!.user.id)
        .eq('status', 'accepted');

      if (!networkError && networkData) {
        setMyNetwork(networkData.map((n: any) => ({
          connection_id: n.id,
          ...n.profiles
        })));
      }

      // 2. Gelen İstekleri Çek (Bana güvenmek isteyenler)
      const { data: requestsData, error: requestsError } = await supabase
        .from('connections')
        .select(`
          id,
          follower_id,
          profiles!connections_follower_id_fkey (
            id, full_name, username, avatar_url
          )
        `)
        .eq('following_id', session!.user.id)
        .eq('status', 'pending');

      if (!requestsError && requestsData) {
        setRequests(requestsData.map((r: any) => ({
          connection_id: r.id,
          ...r.profiles
        })));
      }
    } catch (error) {
      console.error("Ağ verisi çekilirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!session?.user?.id) return;
    setIsSearching(true);
    try {
      // Profillerde ara (Kendi profilim hariç)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', session.user.id)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (data && !error) {
        // Mevcut bağlantı durumlarını kontrol et
        const { data: connectionData } = await supabase
          .from('connections')
          .select('following_id, status')
          .eq('follower_id', session.user.id)
          .in('following_id', data.map(d => d.id));

        const formattedResults = data.map(profile => {
          const conn = connectionData?.find((c: any) => c.following_id === profile.id);
          return {
            ...profile,
            connectionStatus: conn ? conn.status : null // 'pending', 'accepted', or null
          };
        });
        
        setSearchResults(formattedResults);
      }
    } catch (error) {
      console.error("Arama hatası:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendTrustRequest = async (userId: string) => {
    if (!session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('connections')
        .insert([{
          follower_id: session.user.id,
          following_id: userId,
          status: 'pending'
        }]);
        
      if (!error) {
        // Arama sonuçlarında anında güncelle
        setSearchResults(prev => prev.map(p => p.id === userId ? { ...p, connectionStatus: 'pending' } : p));
        Alert.alert('Başarılı', 'Güven isteği gönderildi.');
      } else {
        console.error(error);
        Alert.alert('Hata', 'İstek gönderilemedi.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const acceptRequest = async (connectionId: string, followerId: string) => {
    if (!session?.user?.id) return;
    try {
      // 1. İsteği onayla
      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (updateError) throw updateError;

      // 2. Karşılıklı güven oluşturmak için ters yönde de otomatik bağlantı kur
      const { error: insertError } = await supabase
        .from('connections')
        .upsert({
          follower_id: session.user.id,
          following_id: followerId,
          status: 'accepted'
        }, { onConflict: 'follower_id, following_id' });

      if (insertError) throw insertError;

      Alert.alert('Kabul Edildi', 'Artık ağınızdasınız.');
      fetchNetworkData(); // Listeleri yenile
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'İstek onaylanamadı.');
    }
  };

  const rejectRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);
        
      if (!error) {
        setRequests(prev => prev.filter(r => r.connection_id !== connectionId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ağım</Text>
        <TouchableOpacity style={styles.addFriendBtn} onPress={() => setSearchQuery('')}>
          <UserPlus size={20} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Güvendiklerim ({myNetwork.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            İstekler ({requests.length})
          </Text>
          {requests.length > 0 && activeTab !== 'requests' && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {activeTab === 'friends' ? (
          <View style={styles.listContainer}>
            {/* Search Box */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#94A3B8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Ağında ara veya yeni kişi bul..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {isLoading && !isSearching ? (
              <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
            ) : searchQuery.length > 2 ? (
              // Arama Sonuçları
              <View>
                <Text style={styles.sectionTitle}>Arama Sonuçları</Text>
                {isSearching ? (
                  <ActivityIndicator color="#7B2CBF" style={{ marginTop: 20 }} />
                ) : searchResults.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20 }}>Kullanıcı bulunamadı.</Text>
                ) : (
                  searchResults.map(user => (
                    <View key={user.id} style={styles.friendCard}>
                      <View style={[styles.avatar, { backgroundColor: '#7B2CBF' }]}>
                        <Text style={styles.avatarText}>{getInitials(user.full_name)}</Text>
                      </View>
                      
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{user.full_name}</Text>
                        <Text style={styles.friendUsername}>@{user.username}</Text>
                      </View>

                      {user.connectionStatus === 'accepted' ? (
                        <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9' }]}>
                          <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>Ağınızda</Text>
                        </View>
                      ) : user.connectionStatus === 'pending' ? (
                        <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                          <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '600' }}>Bekliyor</Text>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => sendTrustRequest(user.id)}>
                          <Text style={styles.primaryBtnText}>Güven İsteği At</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            ) : (
              // Güvendiklerim Listesi
              <View>
                {myNetwork.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrapper}>
                      <Users size={32} color="#7B2CBF" />
                    </View>
                    <Text style={styles.emptyTitle}>Ağınız Çok Sessiz</Text>
                    <Text style={styles.emptyDesc}>Yukarıdaki arama çubuğunu kullanarak arkadaşlarınızı bulabilir ve ağınızı büyütebilirsiniz.</Text>
                  </View>
                ) : (
                  myNetwork.map(friend => (
                    <View key={friend.id} style={styles.friendCard}>
                      <View style={[styles.avatar, { backgroundColor: '#10B981' }]}>
                        <Text style={styles.avatarText}>{getInitials(friend.full_name)}</Text>
                      </View>
                      
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.full_name}</Text>
                        <Text style={styles.friendUsername}>@{friend.username}</Text>
                      </View>

                      <TouchableOpacity style={styles.actionBtn}>
                        <MoreHorizontal size={20} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#7B2CBF" style={{ marginTop: 40 }} />
            ) : requests.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrapper}>
                  <UserPlus size={32} color="#7B2CBF" />
                </View>
                <Text style={styles.emptyTitle}>Yeni İstek Yok</Text>
                <Text style={styles.emptyDesc}>Şu anda bekleyen bir ağa katılma isteğiniz bulunmuyor.</Text>
              </View>
            ) : (
              requests.map(req => (
                <View key={req.connection_id} style={styles.friendCard}>
                  <View style={[styles.avatar, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.avatarText}>{getInitials(req.full_name)}</Text>
                  </View>
                  
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{req.full_name}</Text>
                    <Text style={styles.friendUsername}>@{req.username}</Text>
                    <Text style={{ fontSize: 12, color: '#7B2CBF', marginTop: 4 }}>Sizi ağlarına eklemek istiyorlar.</Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]} 
                      onPress={() => rejectRequest(req.connection_id)}
                    >
                      <X size={20} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.iconBtn, { backgroundColor: '#D1FAE5' }]} 
                      onPress={() => acceptRequest(req.connection_id, req.id)}
                    >
                      <Check size={20} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  addFriendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(123, 44, 191, 0.1)', alignItems: 'center', justifyContent: 'center' },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#7B2CBF' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#7B2CBF', fontWeight: '700' },
  badge: { position: 'absolute', top: 12, right: '25%', width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },

  scrollContent: { paddingBottom: 40 },
  
  listContainer: { paddingHorizontal: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 8, color: '#1E293B', fontSize: 15, outlineStyle: 'none' },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 16, textTransform: 'uppercase' },

  friendCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  friendUsername: { fontSize: 13, color: '#64748B' },
  
  actionBtn: { padding: 8 },
  primaryBtn: { backgroundColor: '#7B2CBF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(123, 44, 191, 0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
