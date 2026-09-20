import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  TextInput, 
  ActivityIndicator, 
  Modal, 
  Share, 
  KeyboardAvoidingView,
  Animated,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  UserPlus, 
  Users, 
  Check, 
  X, 
  Share2, 
  UserCheck, 
  Clock, 
  Sparkles, 
  ChevronRight,
  UserX,
  CheckCircle,
  AlertCircle,
  Info,
  MapPin,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';

interface ToastState {
  visible: boolean;
  title?: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ConfirmModalState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmBtnColor?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  onConfirm?: () => void;
}

export default function NetworkScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors, isDark, language, t } = useTheme();
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'friends'); // 'friends' or 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [myNetwork, setMyNetwork] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [requestSubTab, setRequestSubTab] = useState<'incoming' | 'sent'>('incoming');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Kişi Ekleme Modalı State'leri
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Şık Bildirim (Toast) ve Özel Onay Modalı State'leri
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<any>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    visible: false,
    title: '',
    message: '',
    confirmText: t('network_confirm_approve'),
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success', title?: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type, title });
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  };

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

  // Ana ekran arama kutusu
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 1) {
        handleSearch(searchQuery, false);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Modal içi arama kutusu
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (modalSearchQuery.length > 1) {
        handleSearch(modalSearchQuery, true);
      } else {
        setModalSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [modalSearchQuery]);

  // Çift yönlü bağlantı haritası oluşturucu
  const getConnectionsMap = async () => {
    if (!session?.user?.id) return new Map();

    const { data: connRows } = await supabase
      .from('connections')
      .select('id, follower_id, following_id, status')
      .or(`follower_id.eq.${session.user.id},following_id.eq.${session.user.id}`);

    const connMap = new Map<string, { id: string; status: 'accepted' | 'pending' | 'incoming' }>();

    (connRows || []).forEach((c: any) => {
      if (c.follower_id === session.user.id) {
        connMap.set(c.following_id, {
          id: c.id,
          status: c.status === 'accepted' ? 'accepted' : 'pending'
        });
      } else if (c.following_id === session.user.id) {
        if (c.status === 'accepted') {
          connMap.set(c.follower_id, { id: c.id, status: 'accepted' });
        } else if (c.status === 'pending') {
          connMap.set(c.follower_id, { id: c.id, status: 'incoming' });
        }
      }
    });

    return connMap;
  };

  // İstek gönderilmemişleri en üste alan akıllı sıralama
  const sortUsersByConnection = (users: any[]) => {
    return [...users].sort((a, b) => {
      const getScore = (u: any) => {
        if (!u.connectionStatus) return 0;
        if (u.connectionStatus === 'incoming') return 1;
        if (u.connectionStatus === 'pending') return 2;
        if (u.connectionStatus === 'accepted') return 3;
        return 4;
      };
      return getScore(a) - getScore(b);
    });
  };

  const fetchNetworkData = async () => {
    setIsLoading(true);
    try {
      // 1. Ağımı Çek (Çift yönlü: Ben takip etmiş olayım ya da karşı taraf takip edip kabul edilmiş olsun)
      const { data: networkRows, error: networkError } = await supabase
        .from('connections')
        .select('id, follower_id, following_id, status')
        .or(`follower_id.eq.${session!.user.id},following_id.eq.${session!.user.id}`)
        .eq('status', 'accepted');

      if (!networkError && networkRows && networkRows.length > 0) {
        // Kendimiz dışındaki karşı tarafın ID'lerini tekilleştirerek topla
        const friendMap = new Map<string, string>(); // friendId -> connectionId
        networkRows.forEach((n: any) => {
          const friendId = n.follower_id === session!.user.id ? n.following_id : n.follower_id;
          if (friendId && friendId !== session!.user.id) {
            friendMap.set(friendId, n.id);
          }
        });

        const friendIds = Array.from(friendMap.keys());
        if (friendIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, trust_score')
            .in('id', friendIds);

          setMyNetwork((profilesData || []).map((p: any) => ({
            connection_id: friendMap.get(p.id) || p.id,
            ...p
          })));
        } else {
          setMyNetwork([]);
        }
      } else {
        setMyNetwork([]);
      }

      // 2. Gelen İstekleri Çek (Bana güvenmek isteyenler)
      const { data: requestsRows, error: requestsError } = await supabase
        .from('connections')
        .select('id, follower_id, created_at, status')
        .eq('following_id', session!.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!requestsError && requestsRows && requestsRows.length > 0) {
        const followerIds = requestsRows.map((r: any) => r.follower_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, trust_score')
          .in('id', followerIds);

        const profMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

        // İsteği gönderenlerin mekan sayılarını ve konumlarını zenginleştir
        const formattedRequests = await Promise.all(
          requestsRows.map(async (r: any) => {
            const prof = profMap.get(r.follower_id) || { id: r.follower_id };
            let userCity = (prof as any).city || '';
            let userDistrict = (prof as any).district || '';
            let placeCount = 0;

            try {
              const { data: userPlaces, count } = await supabase
                .from('user_places')
                .select('places(city, district)', { count: 'exact' })
                .eq('user_id', prof.id)
                .limit(3);

              placeCount = count || 0;
              if ((!userCity || !userDistrict) && userPlaces && userPlaces.length > 0) {
                const firstPlace = (userPlaces[0] as any)?.places;
                if (firstPlace) {
                  if (!userCity) userCity = firstPlace.city || '';
                  if (!userDistrict) userDistrict = firstPlace.district || '';
                }
              }
            } catch (e) {}

            const locationStr = [userDistrict, userCity].filter(Boolean).join(', ');

            return {
              connection_id: r.id,
              ...prof,
              location: locationStr,
              placeCount: placeCount,
              created_at: r.created_at
            };
          })
        );

        setRequests(formattedRequests);
      } else {
        setRequests([]);
      }

      // 3. Gönderilen İstekleri Çek (Benim gönderdiğim ve karşı tarafın henüz yanıtlamadığı istekler)
      const { data: sentRows, error: sentError } = await supabase
        .from('connections')
        .select('id, following_id, created_at, status')
        .eq('follower_id', session!.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!sentError && sentRows && sentRows.length > 0) {
        const followingIds = sentRows.map((r: any) => r.following_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, trust_score')
          .in('id', followingIds);

        const profMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

        const formattedSent = sentRows.map((r: any) => {
          const prof = profMap.get(r.following_id) || { id: r.following_id };
          return {
            connection_id: r.id,
            target_user_id: r.following_id,
            ...prof,
            created_at: r.created_at
          };
        });

        setSentRequests(formattedSent);
      } else {
        setSentRequests([]);
      }
    } catch (error) {
      console.error("Ağ verisi çekilirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!session?.user?.id) return;
    setIsLoadingSuggestions(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', session.user.id)
        .eq('allow_search', true)
        .limit(30);

      if (profiles && !error) {
        const connMap = await getConnectionsMap();

        const formatted = profiles.map(p => {
          const connInfo = connMap.get(p.id);
          return {
            ...p,
            connectionId: connInfo?.id || null,
            connectionStatus: connInfo?.status || null
          };
        });

        setSuggestedUsers(sortUsersByConnection(formatted));
      }
    } catch (error) {
      console.error('Önerilen kullanıcılar çekilirken hata:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearch = async (query: string, isModal: boolean = false) => {
    if (!session?.user?.id) return;
    if (isModal) setIsModalSearching(true);
    else setIsSearching(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', session.user.id)
        .eq('allow_search', true)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (data && !error) {
        const connMap = await getConnectionsMap();

        const formattedResults = data.map(profile => {
          const connInfo = connMap.get(profile.id);
          return {
            ...profile,
            connectionId: connInfo?.id || null,
            connectionStatus: connInfo?.status || null
          };
        });
        
        const sorted = sortUsersByConnection(formattedResults);
        if (isModal) setModalSearchResults(sorted);
        else setSearchResults(sorted);
      }
    } catch (error) {
      console.error("Arama hatası:", error);
    } finally {
      if (isModal) setIsModalSearching(false);
      else setIsSearching(false);
    }
  };

  const handleConnectionAction = async (user: any) => {
    if (!session?.user?.id) return;

    // 1. Zaten istek atılmışsa -> Şık Onay Modalı ile İptal Etme
    if (user.connectionStatus === 'pending') {
      setConfirmModal({
        visible: true,
        title: t('network_confirm_cancel_title'),
        message: language === 'tr'
          ? `@${user.username} (${user.full_name}) kullanıcısına gönderilen güven isteğini iptal etmek istiyor musunuz?`
          : `Do you want to cancel the connection request sent to @${user.username} (${user.full_name})?`,
        confirmText: t('network_confirm_cancel_btn'),
        confirmBtnColor: '#EF4444',
        icon: <UserX size={26} color="#EF4444" />,
        iconBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
        onConfirm: async () => {
          try {
            await supabase
              .from('connections')
              .delete()
              .eq('follower_id', session.user.id)
              .eq('following_id', user.id);

            const updateList = (list: any[]) =>
              sortUsersByConnection(
                list.map(u => u.id === user.id ? { ...u, connectionStatus: null, connectionId: null } : u)
              );

            setSuggestedUsers(updateList);
            setModalSearchResults(updateList);
            setSearchResults(updateList);
            showToast(t('network_toast_request_cancelled'), 'info', t('network_toast_cancelled_title'));
          } catch (err) {
            console.error(err);
            showToast(t('error'), 'error', t('error'));
          }
        }
      });
      return;
    }

    // 2. Karşıdan istek gelmişse -> Onayla
    if (user.connectionStatus === 'incoming') {
      if (user.connectionId) {
        await acceptRequest(user.connectionId, user.id);
      }
      return;
    }

    // 3. Zaten ağdaysa
    if (user.connectionStatus === 'accepted') {
      showToast(t('network_toast_already_in_network'), 'info', t('network_in_network'));
      return;
    }

    // 4. Yeni İstek Gönder (Standart INSERT ile RLS uyumlu)
    try {
      const { error } = await supabase
        .from('connections')
        .insert([{
          follower_id: session.user.id,
          following_id: user.id,
          status: 'pending'
        }]);

      if (!error) {
        const updateList = (list: any[]) =>
          sortUsersByConnection(
            list.map(u => u.id === user.id ? { ...u, connectionStatus: 'pending' } : u)
          );

        setSuggestedUsers(updateList);
        setModalSearchResults(updateList);
        setSearchResults(updateList);
        showToast(
          language === 'tr' 
            ? `${user.full_name} ${t('network_toast_request_sent_success')}`
            : `${t('network_toast_request_sent_success')} ${user.full_name}.`,
          'success',
          t('network_toast_request_sent_title')
        );
      } else {
        console.error('Bağlantı ekleme hatası:', error);
        if (error.code === '23505') {
          // Zaten istek var (unique constraint)
          const updateList = (list: any[]) =>
            sortUsersByConnection(
              list.map(u => u.id === user.id ? { ...u, connectionStatus: 'pending' } : u)
            );
          setSuggestedUsers(updateList);
          setModalSearchResults(updateList);
          setSearchResults(updateList);
          showToast(t('network_toast_already_requested'), 'info', language === 'tr' ? 'Bilgi' : 'Info');
        } else {
          showToast(t('network_toast_error_send'), 'error', t('error'));
        }
      }
    } catch (error) {
      console.error(error);
      showToast(t('error'), 'error', t('error'));
    }
  };

  const acceptRequest = async (connectionId: string, followerId: string) => {
    if (!session?.user?.id) return;
    try {
      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (updateError) throw updateError;

      // Aynı anda iki tarafın da gönderdiği ters bekleyen isteği temizle.
      await supabase
        .from('connections')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', followerId)
        .eq('status', 'pending');

      showToast(t('network_toast_accepted_success'), 'success', t('network_toast_accepted_title'));
      fetchNetworkData();
      
      const updateList = (list: any[]) =>
        sortUsersByConnection(
          list.map(u => u.id === followerId ? { ...u, connectionStatus: 'accepted' } : u)
        );

      setSuggestedUsers(updateList);
      setModalSearchResults(updateList);
      setSearchResults(updateList);
    } catch (error) {
      console.error(error);
      showToast(t('error'), 'error', t('error'));
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
        showToast(t('network_toast_rejected'), 'info', language === 'tr' ? 'Bilgi' : 'Info');
      }
    } catch (error) {
      console.error(error);
      showToast(t('error'), 'error', t('error'));
    }
  };

  const cancelSentRequest = (connectionId: string, targetUserId?: string, targetName?: string) => {
    setConfirmModal({
      visible: true,
      title: t('network_confirm_cancel_title'),
      message: language === 'tr'
        ? `${targetName ? `"${targetName}" kullanıcısına g` : 'G'}önderilen güven ağı isteğini geri çekmek istiyor musunuz?`
        : `Do you want to cancel the connection request sent to ${targetName ? `"${targetName}"` : 'this user'}?`,
      confirmText: t('network_cancel_request'),
      confirmBtnColor: '#EF4444',
      icon: <RotateCcw size={24} color="#EF4444" />,
      iconBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('connections')
            .delete()
            .eq('id', connectionId);

          if (!error) {
            setSentRequests(prev => prev.filter(r => r.connection_id !== connectionId));
            showToast(t('network_toast_request_cancelled'), 'info', t('network_toast_cancelled_title'));

            // Kullanıcı listelerindeki buton durumunu sıfırla
            if (targetUserId) {
              const updateList = (list: any[]) =>
                list.map(u => u.id === targetUserId ? { ...u, connectionStatus: null } : u);
              setSuggestedUsers(updateList);
              setModalSearchResults(updateList);
              setSearchResults(updateList);
            }
          } else {
            throw error;
          }
        } catch (error) {
          console.error('İstek geri alma hatası:', error);
          showToast(t('error'), 'error', t('error'));
        }
      }
    });
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: t('network_share_text'),
        title: t('network_share_title')
      });
    } catch (error) {}
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderConnectionButton = (user: any) => {
    if (user.connectionStatus === 'accepted') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: isDark ? '#334155' : '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
          <UserCheck size={14} color="#10B981" />
          <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>{t('network_in_network')}</Text>
        </View>
      );
    }
    if (user.connectionStatus === 'pending') {
      return (
        <TouchableOpacity 
          style={[
            styles.statusBadge, 
            { 
              backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7', 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 4, 
              borderWidth: 1, 
              borderColor: isDark ? 'rgba(217, 119, 6, 0.4)' : '#FDE68A' 
            }
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            handleConnectionAction(user);
          }}
          activeOpacity={0.8}
        >
          <Clock size={13} color={isDark ? '#FBBF24' : '#D97706'} />
          <Text style={{ color: isDark ? '#FBBF24' : '#D97706', fontSize: 12, fontWeight: '700' }}>{t('network_request_sent')}</Text>
        </TouchableOpacity>
      );
    }
    if (user.connectionStatus === 'incoming') {
      return (
        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: '#10B981' }]} 
          onPress={(e) => {
            e.stopPropagation?.();
            handleConnectionAction(user);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>{t('network_accept')}</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]} 
        onPress={(e) => {
          e.stopPropagation?.();
          handleConnectionAction(user);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryBtnText}>{t('network_add_to_network')}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('network_title')}</Text>
        <TouchableOpacity 
          style={[styles.addFriendBtn, { backgroundColor: colors.primaryBg, borderColor: isDark ? colors.cardBorder : '#E9D5FF' }]} 
          onPress={() => {
            setIsAddModalVisible(true);
            fetchSuggestedUsers();
          }}
          activeOpacity={0.7}
        >
          <UserPlus size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('friends')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: colors.subText }, activeTab === 'friends' && [styles.activeTabText, { color: colors.primary }]]}>
            {t('network_tab_trusted')} ({myNetwork.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: colors.subText }, activeTab === 'requests' && [styles.activeTabText, { color: colors.primary }]]}>
            {t('network_tab_requests')} ({requests.length + sentRequests.length})
          </Text>
          {requests.length > 0 && activeTab !== 'requests' && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={true} 
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'friends' ? (
          <View style={styles.listContainer}>
            {/* Search Box */}
            <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
              <Search size={18} color={colors.subText} />
              <TextInput 
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('network_search_placeholder')}
                placeholderTextColor={colors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color={colors.mutedText} />
                </TouchableOpacity>
              )}
            </View>

            {isLoading && !isSearching ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : searchQuery.length > 1 ? (
              // Arama Sonuçları
              <View>
                <Text style={[styles.sectionTitle, { color: colors.subText }]}>{t('network_search_results')}</Text>
                {isSearching ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                ) : searchResults.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: colors.mutedText, marginTop: 20 }}>{t('network_user_not_found')}</Text>
                ) : (
                  searchResults.map(user => (
                    <TouchableOpacity 
                      key={user.id} 
                      style={[styles.friendCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                      onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>{getInitials(user.full_name)}</Text>
                      </View>
                      
                      <View style={styles.friendInfo}>
                        <Text style={[styles.friendName, { color: colors.text }]}>{user.full_name}</Text>
                        <Text style={[styles.friendUsername, { color: colors.subText }]}>@{user.username}</Text>
                      </View>

                      {renderConnectionButton(user)}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : (
              // Güvendiklerim Listesi
              <View>
                {myNetwork.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primaryBg }]}>
                      <Users size={36} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('network_empty_title')}</Text>
                    <Text style={[styles.emptyDesc, { color: colors.subText }]}>{t('network_empty_desc')}</Text>
                    <TouchableOpacity 
                      style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        setIsAddModalVisible(true);
                        fetchSuggestedUsers();
                      }}
                      activeOpacity={0.8}
                    >
                      <UserPlus size={18} color="#FFFFFF" />
                      <Text style={styles.emptyActionBtnText}>{t('network_add_person_btn')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myNetwork.map(friend => (
                    <TouchableOpacity 
                      key={friend.connection_id || friend.id} 
                      style={[styles.friendCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                      onPress={() => navigation.navigate('UserProfile', { userId: friend.id })}
                      activeOpacity={0.7}
                    >
                      {friend.avatar_url ? (
                        <Image source={{ uri: friend.avatar_url }} style={styles.friendAvatarImage} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.avatarText}>{getInitials(friend.full_name)}</Text>
                        </View>
                      )}
                      
                      <View style={styles.friendInfo}>
                        <Text style={[styles.friendName, { color: colors.text }]}>{friend.full_name}</Text>
                        <Text style={[styles.friendUsername, { color: colors.subText }]}>@{friend.username}</Text>
                      </View>

                      <ChevronRight size={20} color={colors.subText} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {/* Alt Sekmeler: Gelen İstekler vs Gönderilen İstekler */}
            <View style={[styles.subTabsContainer, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <TouchableOpacity
                style={[
                  styles.subTabButton, 
                  requestSubTab === 'incoming' && [styles.subTabButtonActive, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }]
                ]}
                onPress={() => setRequestSubTab('incoming')}
                activeOpacity={0.8}
              >
                <ArrowDownLeft size={16} color={requestSubTab === 'incoming' ? colors.primary : colors.subText} />
                <Text style={[
                  styles.subTabButtonText, 
                  { color: colors.subText },
                  requestSubTab === 'incoming' && [styles.subTabButtonTextActive, { color: colors.primary }]
                ]}>
                  {t('network_subtab_incoming')} ({requests.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.subTabButton, 
                  requestSubTab === 'sent' && [styles.subTabButtonActive, { backgroundColor: isDark ? '#334155' : '#FFFFFF' }]
                ]}
                onPress={() => setRequestSubTab('sent')}
                activeOpacity={0.8}
              >
                <ArrowUpRight size={16} color={requestSubTab === 'sent' ? colors.primary : colors.subText} />
                <Text style={[
                  styles.subTabButtonText, 
                  { color: colors.subText },
                  requestSubTab === 'sent' && [styles.subTabButtonTextActive, { color: colors.primary }]
                ]}>
                  {t('network_subtab_sent')} ({sentRequests.length})
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : requestSubTab === 'incoming' ? (
              /* ── GELEN İSTEKLER LİSTESİ ── */
              requests.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primaryBg }]}>
                    <UserPlus size={36} color={colors.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('network_no_incoming_title')}</Text>
                  <Text style={[styles.emptyDesc, { color: colors.subText }]}>{t('network_no_incoming_desc')}</Text>
                </View>
              ) : (
                requests.map(req => (
                  <TouchableOpacity 
                    key={req.connection_id} 
                    style={[styles.requestCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                    onPress={() => navigation.navigate('UserProfile', { userId: req.id })}
                    activeOpacity={0.85}
                  >
                    {/* Üst Kısım: Fotoğraf, Ad Soyad, Kullanıcı Adı ve Güven Rozeti */}
                    <View style={styles.requestHeader}>
                      {req.avatar_url ? (
                        <Image source={{ uri: req.avatar_url }} style={styles.requestAvatarImage} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.primary, width: 52, height: 52, borderRadius: 26 }]}>
                          <Text style={[styles.avatarText, { fontSize: 18 }]}>{getInitials(req.full_name)}</Text>
                        </View>
                      )}
                      
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.requestName, { color: colors.text }]} numberOfLines={1}>{req.full_name || t('network_unnamed_user')}</Text>
                          <View style={[
                            styles.trustScorePill,
                            isDark && { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)' }
                          ]}>
                            <Shield size={11} color="#10B981" />
                            <Text style={styles.trustScorePillText}>%{req.trust_score || 100}</Text>
                          </View>
                        </View>
                        <Text style={[styles.requestUsername, { color: colors.primary }]}>@{req.username || 'kullanici'}</Text>
                      </View>
                    </View>

                    {/* Konum (İl/İlçe) ve Tavsiye Rozetleri */}
                    {(req.location || req.placeCount > 0) && (
                      <View style={styles.requestMetaRow}>
                        {req.location ? (
                          <View style={[styles.requestMetaItem, { backgroundColor: isDark ? '#334155' : '#F8F9FA', borderColor: colors.cardBorder }]}>
                            <MapPin size={13} color={colors.primary} />
                            <Text style={[styles.requestMetaText, { color: colors.subText }]}>{req.location}</Text>
                          </View>
                        ) : null}

                        {req.placeCount > 0 ? (
                          <View style={[styles.requestMetaItem, { backgroundColor: isDark ? '#334155' : '#F8F9FA', borderColor: colors.cardBorder }]}>
                            <Sparkles size={13} color="#D97706" />
                            <Text style={[styles.requestMetaText, { color: colors.subText }]}>{req.placeCount} {t('network_recommendations_count_suffix')}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}

                    {/* Biyografi varsa */}
                    {req.bio ? (
                      <Text style={[styles.requestBio, { color: colors.subText }]} numberOfLines={2}>"{req.bio}"</Text>
                    ) : null}

                    <Text style={[styles.requestDesc, { color: colors.subText }]}>
                      {t('network_incoming_request_desc')}
                    </Text>

                    {/* Geniş ve Şık Aksiyon Butonları */}
                    <View style={styles.requestActionsRow}>
                      <TouchableOpacity 
                        style={[styles.requestRejectBtn, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} 
                        onPress={(e) => {
                          e.stopPropagation?.();
                          rejectRequest(req.connection_id);
                        }}
                        activeOpacity={0.8}
                      >
                        <X size={18} color="#EF4444" />
                        <Text style={[styles.requestRejectText, isDark && { color: '#F87171' }]}>{t('network_reject')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.requestAcceptBtn} 
                        onPress={(e) => {
                          e.stopPropagation?.();
                          acceptRequest(req.connection_id, req.id);
                        }}
                        activeOpacity={0.85}
                      >
                        <Check size={18} color="#FFFFFF" />
                        <Text style={styles.requestAcceptText}>{t('network_accept')}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )
            ) : (
              /* ── GÖNDERİLEN İSTEKLER LİSTESİ ── */
              sentRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primaryBg }]}>
                    <Clock size={36} color={colors.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('network_no_sent_title')}</Text>
                  <Text style={[styles.emptyDesc, { color: colors.subText }]}>{t('network_no_sent_desc')}</Text>
                </View>
              ) : (
                sentRequests.map(req => (
                  <TouchableOpacity 
                    key={req.connection_id} 
                    style={[styles.requestCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                    onPress={() => navigation.navigate('UserProfile', { userId: req.target_user_id || req.id })}
                    activeOpacity={0.85}
                  >
                    {/* Üst Kısım: Fotoğraf, Ad Soyad, Kullanıcı Adı ve Beklemede Rozeti */}
                    <View style={styles.requestHeader}>
                      {req.avatar_url ? (
                        <Image source={{ uri: req.avatar_url }} style={styles.requestAvatarImage} />
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.primary, width: 52, height: 52, borderRadius: 26 }]}>
                          <Text style={[styles.avatarText, { fontSize: 18 }]}>{getInitials(req.full_name)}</Text>
                        </View>
                      )}
                      
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.requestName, { color: colors.text }]} numberOfLines={1}>{req.full_name || t('network_unnamed_user')}</Text>
                          <View style={[
                            styles.sentPendingBadge,
                            isDark && { backgroundColor: 'rgba(217, 119, 6, 0.2)', borderColor: 'rgba(217, 119, 6, 0.4)' }
                          ]}>
                            <Clock size={12} color={isDark ? '#FBBF24' : '#D97706'} />
                            <Text style={[styles.sentPendingBadgeText, isDark && { color: '#FBBF24' }]}>{t('network_pending_badge')}</Text>
                          </View>
                        </View>
                        <Text style={[styles.requestUsername, { color: colors.primary }]}>@{req.username || 'kullanici'}</Text>
                      </View>
                    </View>

                    <Text style={[styles.requestDesc, { color: colors.subText }]}>
                      {t('network_sent_request_desc')}
                    </Text>

                    {/* İsteği Geri Al Butonu */}
                    <View style={styles.cancelRequestBtnRow}>
                      <TouchableOpacity 
                        style={[
                          styles.cancelRequestBtn,
                          isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }
                        ]} 
                        onPress={(e) => {
                          e.stopPropagation?.();
                          cancelSentRequest(req.connection_id, req.target_user_id || req.id, req.full_name || req.username);
                        }}
                        activeOpacity={0.8}
                      >
                        <RotateCcw size={16} color="#EF4444" />
                        <Text style={[styles.cancelRequestBtnText, isDark && { color: '#F87171' }]}>{t('network_cancel_request')}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )
            )}
          </View>
        )}
      </ScrollView>

      {/* KİŞİ EKLE / AĞINI BÜYÜT MODALI */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsAddModalVisible(false);
          fetchNetworkData();
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBg }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
          >
            <TouchableOpacity 
              style={{ flex: 1 }} 
              activeOpacity={1} 
              onPress={() => {
                setIsAddModalVisible(false);
                setModalSearchQuery('');
                fetchNetworkData();
              }} 
            />
            <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('network_modal_add_title')}</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.subText }]}>{t('network_modal_add_sub')}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} 
                  onPress={() => {
                    setIsAddModalVisible(false);
                    setModalSearchQuery('');
                    fetchNetworkData();
                  }}
                  activeOpacity={0.7}
                >
                  <X size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Arama Inputu */}
              <View style={[styles.modalSearchContainer, { backgroundColor: colors.inputBg, borderColor: isDark ? colors.cardBorder : '#E9D5FF' }]}>
                <Search size={18} color={colors.primary} />
                <TextInput 
                  style={[styles.modalSearchInput, { color: colors.text }]}
                  placeholder={t('network_modal_search_placeholder')}
                  placeholderTextColor={colors.mutedText}
                  value={modalSearchQuery}
                  onChangeText={setModalSearchQuery}
                  autoCapitalize="none"
                  autoFocus={false}
                />
                {modalSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setModalSearchQuery('')}>
                    <X size={16} color={colors.mutedText} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Arkadaşını Davet Et Kartı */}
              <TouchableOpacity 
                style={[
                  styles.inviteBanner,
                  { 
                    backgroundColor: isDark ? 'rgba(157, 78, 221, 0.15)' : '#FAF5FF', 
                    borderColor: isDark ? 'rgba(157, 78, 221, 0.3)' : '#E9D5FF' 
                  }
                ]} 
                onPress={handleShareInvite}
                activeOpacity={0.85}
              >
                <View style={[styles.inviteIconWrapper, { backgroundColor: isDark ? 'rgba(157, 78, 221, 0.25)' : '#F3E8FF' }]}>
                  <Share2 size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inviteTitle, { color: colors.primary }]}>{t('network_invite_banner_title')}</Text>
                  <Text style={[styles.inviteDesc, { color: colors.subText }]}>{t('network_invite_banner_desc')}</Text>
                </View>
                <ChevronRight size={18} color={colors.primary} />
              </TouchableOpacity>

              {/* Kullanıcı Listesi (Arama Sonuçları veya Önerilenler) */}
              <ScrollView 
                style={styles.modalScroll} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {modalSearchQuery.length > 1 ? (
                  <View>
                    <Text style={[styles.modalSectionTitle, { color: colors.subText }]}>{t('network_search_results')}</Text>
                    {isModalSearching ? (
                      <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                    ) : modalSearchResults.length === 0 ? (
                      <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                        <Text style={{ color: colors.mutedText, fontSize: 14 }}>{t('network_user_not_found')}</Text>
                      </View>
                    ) : (
                      modalSearchResults.map(user => (
                        <TouchableOpacity 
                          key={user.id} 
                          style={[styles.modalUserCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                          onPress={() => {
                            setIsAddModalVisible(false);
                            navigation.navigate('UserProfile', { userId: user.id });
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.avatar, { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22 }]}>
                            <Text style={[styles.avatarText, { fontSize: 16 }]}>{getInitials(user.full_name)}</Text>
                          </View>
                          
                          <View style={styles.friendInfo}>
                            <Text style={[styles.friendName, { color: colors.text }]}>{user.full_name}</Text>
                            <Text style={[styles.friendUsername, { color: colors.subText }]}>@{user.username}</Text>
                          </View>

                          {renderConnectionButton(user)}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                ) : (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <Sparkles size={16} color={colors.primary} />
                      <Text style={[styles.modalSectionTitle, { color: colors.subText }]}>{t('network_community_suggestions')}</Text>
                    </View>

                    {isLoadingSuggestions ? (
                      <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                    ) : suggestedUsers.length === 0 ? (
                      <Text style={{ color: colors.mutedText, textAlign: 'center', paddingVertical: 20 }}>{t('network_no_suggestions')}</Text>
                    ) : (
                      suggestedUsers.map(user => (
                        <TouchableOpacity 
                          key={user.id} 
                          style={[styles.modalUserCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                          onPress={() => {
                            setIsAddModalVisible(false);
                            navigation.navigate('UserProfile', { userId: user.id });
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.avatar, { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22 }]}>
                            <Text style={[styles.avatarText, { fontSize: 16 }]}>{getInitials(user.full_name)}</Text>
                          </View>
                          
                          <View style={styles.friendInfo}>
                            <Text style={[styles.friendName, { color: colors.text }]}>{user.full_name}</Text>
                            <Text style={[styles.friendUsername, { color: colors.subText }]}>@{user.username}</Text>
                          </View>

                          {renderConnectionButton(user)}
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
                <View style={{ height: 30 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ŞIK ÖZEL ONAY MODALI (CUSTOM CONFIRM DIALOG) */}
      <Modal
        visible={confirmModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={[styles.confirmOverlay, { backgroundColor: colors.overlayBg }]}>
          <View style={[styles.confirmCard, { backgroundColor: colors.modalBg }]}>
            <View style={[styles.confirmIconCircle, { backgroundColor: confirmModal.iconBg || (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2') }]}>
              {confirmModal.icon || <UserX size={28} color="#EF4444" />}
            </View>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>{confirmModal.title}</Text>
            <Text style={[styles.confirmDesc, { color: colors.subText }]}>{confirmModal.message}</Text>
            
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity 
                style={[styles.confirmCancelBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} 
                onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmCancelText, { color: colors.subText }]}>{t('network_confirm_dismiss')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmActionBtn, { backgroundColor: confirmModal.confirmBtnColor || '#EF4444' }]} 
                onPress={() => {
                  setConfirmModal(prev => ({ ...prev, visible: false }));
                  confirmModal.onConfirm?.();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmActionText}>{confirmModal.confirmText || t('network_confirm_approve')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ŞIK YÜZEN BİLDİRİM (FLOATING CUSTOM TOAST) - EN ÜST SEVİYE */}
      <Modal
        visible={!!toast}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setToast(null)}
      >
        <View style={styles.toastOverlay}>
          <TouchableOpacity 
            style={[
              styles.toastCard, 
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              toast?.type === 'success' && (isDark ? { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' } : styles.toastSuccess),
              toast?.type === 'info' && (isDark ? { borderColor: colors.primary, backgroundColor: 'rgba(157, 78, 221, 0.15)' } : styles.toastInfo),
              toast?.type === 'error' && (isDark ? { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.15)' } : styles.toastError),
            ]}
            onPress={() => setToast(null)}
            activeOpacity={0.9}
          >
            <View style={styles.toastIconWrapper}>
              {toast?.type === 'success' && <CheckCircle size={22} color="#10B981" />}
              {toast?.type === 'info' && <Clock size={22} color={colors.primary} />}
              {toast?.type === 'error' && <AlertCircle size={22} color="#EF4444" />}
            </View>
            <View style={{ flex: 1 }}>
              {toast?.title ? <Text style={[styles.toastTitle, { color: colors.text }]}>{toast.title}</Text> : null}
              <Text style={[styles.toastMessage, { color: colors.subText }]}>{toast?.message}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.toastCloseBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} 
              onPress={() => setToast(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={16} color={colors.subText} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 14 : 10, 
    paddingBottom: 16 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#1E293B', 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' 
  },
  addFriendBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F3E8FF', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF'
  },
  
  tabsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#7B2CBF' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#7B2CBF', fontWeight: '700' },
  badge: { 
    position: 'absolute', 
    top: 12, 
    right: '25%', 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#EF4444' 
  },

  scrollContent: { paddingBottom: 40 },
  
  listContainer: { paddingHorizontal: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#1E293B', fontSize: 15, outlineStyle: 'none' } as any,
  
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#64748B', 
    marginBottom: 14, 
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  friendCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14, 
    backgroundColor: '#FFFFFF', 
    padding: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 6, 
    elevation: 1 
  },
  // Request Card Styles
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  requestUsername: {
    fontSize: 13,
    color: '#7B2CBF',
    fontWeight: '600',
    marginTop: 2,
  },
  trustScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  trustScorePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  requestMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  requestMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  requestMetaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  requestBio: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  requestDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 14,
    lineHeight: 16,
  },
  requestActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  requestRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  requestRejectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  requestAcceptBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  requestAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Sub-tabs for Requests (Gelen vs Gönderilen)
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  subTabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  subTabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabButtonTextActive: {
    color: '#7B2CBF',
    fontWeight: '800',
  },
  sentPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sentPendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  cancelRequestBtnRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelRequestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  avatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 14 
  },
  friendAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  avatarText: { fontSize: 17, fontWeight: 'bold', color: '#FFFFFF' },
  
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  friendUsername: { fontSize: 13, color: '#64748B' },
  
  primaryBtn: { 
    backgroundColor: '#7B2CBF', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 30 },
  emptyIconWrapper: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(123, 44, 191, 0.06)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20 
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#7B2CBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  emptyActionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    padding: 20, 
    maxHeight: '85%',
    minHeight: 480
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#F1F5F9', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14
  },
  modalSearchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1E293B', outlineStyle: 'none' } as any,
  
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    gap: 12
  },
  inviteIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inviteTitle: { fontSize: 14, fontWeight: '700', color: '#7B2CBF', marginBottom: 2 },
  inviteDesc: { fontSize: 12, color: '#64748B', lineHeight: 16 },

  modalScroll: { flexShrink: 1 },
  modalSectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 12 },
  modalUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },

  // Custom Confirm Modal Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center'
  },
  confirmDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B'
  },
  confirmActionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  confirmActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF'
  },

  // Floating Toast Styles
  toastOverlay: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 24 : 50,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent'
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
    gap: 12
  },
  toastSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4'
  },
  toastInfo: {
    borderColor: '#7B2CBF',
    backgroundColor: '#FAF5FF'
  },
  toastError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2'
  },
  toastIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2
  },
  toastMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500'
  },
  toastCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4
  }
});
