import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Bell, MapPin, Star, ShieldCheck } from 'lucide-react-native';

export default function HomeScreen() {
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
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalFeed}>
            {/* Kart 1 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarMock}><Text style={styles.avatarText}>A</Text></View>
                <View>
                  <Text style={styles.userName}>Ayşe K.</Text>
                  <Text style={styles.actionText}>yeni bir tercih ekledi</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.placeName}>Trilye Restaurant</Text>
                <Text style={styles.categoryText}>Restoran • Çankaya</Text>
                <View style={styles.ratingRow}>
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                </View>
              </View>
              <View style={styles.trustBadge}>
                <ShieldCheck size={14} color="#10B981" />
                <Text style={styles.trustText}>Aktif Gidiyor</Text>
              </View>
            </View>

            {/* Kart 2 */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarMock, { backgroundColor: '#F43F5E' }]}><Text style={styles.avatarText}>M</Text></View>
                <View>
                  <Text style={styles.userName}>Mustafa Y.</Text>
                  <Text style={styles.actionText}>öneriyor</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.placeName}>Dr. Ali Veli</Text>
                <Text style={styles.categoryText}>Çocuk Doktoru • Çayyolu</Text>
                <View style={styles.ratingRow}>
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#F59E0B" fill="#F59E0B" />
                  <Star size={16} color="#E2E8F0" />
                </View>
              </View>
              <View style={styles.trustBadge}>
                <ShieldCheck size={14} color="#10B981" />
                <Text style={styles.trustText}>Aktif Gidiyor</Text>
              </View>
            </View>
          </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#7B2CBF',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    paddingVertical: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 16,
  },
  horizontalFeed: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginLeft: 4, // for shadow
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarMock: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7B2CBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardContent: {
    marginBottom: 16,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trustText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  trendingIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  trendingDetail: {
    fontSize: 13,
    color: '#7B2CBF',
    fontWeight: '600',
  }
});
