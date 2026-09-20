import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, UserPlus, Check, X } from 'lucide-react-native';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { colors, isDark } = useTheme();

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [session]);

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('connections')
        .select(`
          id, created_at, status,
          follower:follower_id (id, full_name, username, avatar_url)
        `)
        .eq('following_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setRequests(data || []);
    } catch (error) {
      console.error('Bildirimler yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (requestId: string, accept: boolean) => {
    setActionId(requestId);
    try {
      if (accept) {
        await supabase
          .from('connections')
          .update({ status: 'accepted' })
          .eq('id', requestId);
      } else {
        await supabase
          .from('connections')
          .delete()
          .eq('id', requestId);
      }

      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e) {
      console.error('İstek yanıtlanamadı:', e);
    } finally {
      setActionId(null);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bildirimler & İstekler</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ağ Bağlantı İstekleri ({requests.length})</Text>

          {requests.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Bell size={36} color={colors.subText} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>Henüz Yeni İstek Yok</Text>
              <Text style={[styles.emptyStateText, { color: colors.subText }]}>Birisi sizi ağından güvenilen kişi olarak eklemek istediğinde burada görünecek.</Text>
            </View>
          ) : (
            requests.map((req) => {
              const follower = req.follower;
              const initials = follower?.full_name
                ? follower.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U';

              return (
                <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <TouchableOpacity 
                    style={styles.requestLeft}
                    onPress={() => follower?.id && navigation.navigate('UserProfile', { userId: follower.id })}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.avatarMock, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.text }]}>{follower?.full_name || 'İsimsiz Kullanıcı'}</Text>
                      <Text style={[styles.username, { color: colors.subText }]}>@{follower?.username || 'kullanici'}</Text>
                      <Text style={[styles.subtext, { color: colors.subText }]}>Sizi güvenilen ağa eklemek istiyor</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: colors.primary }]} 
                      onPress={() => handleResponse(req.id, true)}
                      disabled={actionId === req.id}
                      activeOpacity={0.8}
                    >
                      {actionId === req.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Check size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} 
                      onPress={() => handleResponse(req.id, false)}
                      disabled={actionId === req.id}
                      activeOpacity={0.8}
                    >
                      <X size={18} color={isDark ? '#F87171' : '#64748B'} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
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
  scrollContent: { padding: 20 },

  section: {},
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 16 },

  emptyState: { backgroundColor: '#FFFFFF', padding: 32, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyStateTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 12, marginBottom: 6 },
  emptyStateText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 18 },

  requestCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  requestLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  avatarMock: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7B2CBF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  name: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  username: { fontSize: 12, color: '#94A3B8' },
  subtext: { fontSize: 12, color: '#64748B', marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: '#7B2CBF' },
  rejectBtn: { backgroundColor: '#F1F5F9' },
});
