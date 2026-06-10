import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Search, UserPlus, Users, MessageCircle, MoreHorizontal } from 'lucide-react-native';

const FRIENDS = [
  { id: '1', name: 'Ayşe Yılmaz', username: '@ayseyilmaz', mutual: 12, trustScore: 94, color: '#F43F5E', initials: 'AY' },
  { id: '2', name: 'Mustafa Demir', username: '@mustafad', mutual: 8, trustScore: 88, color: '#3B82F6', initials: 'MD' },
  { id: '3', name: 'Zeynep Kaya', username: '@zkaya', mutual: 15, trustScore: 97, color: '#10B981', initials: 'ZK' },
  { id: '4', name: 'Can Özkan', username: '@canozkan', mutual: 3, trustScore: 76, color: '#F59E0B', initials: 'CÖ' },
];

export default function NetworkScreen() {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ağım</Text>
        <TouchableOpacity style={styles.addFriendBtn}>
          <UserPlus size={20} color="#7B2CBF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Güvendiklerim (128)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>İstekler (3)</Text>
          {activeTab !== 'requests' && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'friends' ? (
          <View style={styles.listContainer}>
            {/* Search Friends */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#94A3B8" />
              <Text style={styles.searchText}>Bağlantılarında ara...</Text>
            </View>

            {FRIENDS.map(friend => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={[styles.avatar, { backgroundColor: friend.color }]}>
                  <Text style={styles.avatarText}>{friend.initials}</Text>
                </View>
                
                <View style={styles.friendInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{friend.trustScore}</Text>
                    </View>
                  </View>
                  <Text style={styles.friendUsername}>{friend.username}</Text>
                  <View style={styles.mutualContainer}>
                    <Users size={12} color="#64748B" />
                    <Text style={styles.mutualText}>{friend.mutual} ortak tercih</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.actionBtn}>
                  <MoreHorizontal size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <UserPlus size={32} color="#7B2CBF" />
            </View>
            <Text style={styles.emptyTitle}>Yeni İstek Yok</Text>
            <Text style={styles.emptyDesc}>Şu anda bekleyen bir ağa katılma isteğiniz bulunmuyor.</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 20 },
  searchText: { marginLeft: 8, color: '#94A3B8', fontSize: 15 },

  friendCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  
  friendInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  friendName: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginRight: 8 },
  scoreBadge: { backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  scoreText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  friendUsername: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  
  mutualContainer: { flexDirection: 'row', alignItems: 'center' },
  mutualText: { fontSize: 12, color: '#64748B', marginLeft: 4 },

  actionBtn: { padding: 8 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(123, 44, 191, 0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
