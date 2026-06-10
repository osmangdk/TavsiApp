import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Users, Globe, Lock, Trash2, ChevronRight } from 'lucide-react-native';

export default function PrivacyCenterScreen() {
  const navigation = useNavigation();
  
  const [visibility, setVisibility] = useState('2nd'); // '1st', '2nd', 'public'
  const [allowSearch, setAllowSearch] = useState(true);
  const [anonymousStats, setAnonymousStats] = useState(true);

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm tercih haritanız silinir.");
      if (confirmDelete) {
        // Çıkış yap ve Onboarding'e gönder
        navigation.navigate('Welcome' as never);
      }
    } else {
      Alert.alert(
        "Hesabı Sil",
        "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm tercih haritanız silinir.",
        [
          { text: "İptal", style: "cancel" },
          { text: "Evet, Sil", style: "destructive", onPress: () => navigation.navigate('Welcome' as never) }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik Merkezi</Text>
        <View style={{ width: 40 }} /> {/* Layout dengelemesi için */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.infoBanner}>
          <Shield size={24} color="#7B2CBF" />
          <View style={styles.infoBannerText}>
            <Text style={styles.infoBannerTitle}>Verileriniz Sizin Kontrolünüzde</Text>
            <Text style={styles.infoBannerDesc}>Tavsi'de reklam için veri satılmaz. Tercihlerinizi kimlerin görebileceğine tamamen siz karar verirsiniz.</Text>
          </View>
        </View>

        {/* Görünürlük Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tercih Haritası Görünürlüğü</Text>
          <Text style={styles.sectionDesc}>Mekan tavsiyelerinizi kimler görebilir?</Text>

          <TouchableOpacity 
            style={[styles.radioOption, visibility === '1st' && styles.radioOptionActive]}
            onPress={() => setVisibility('1st')}
            activeOpacity={0.8}
          >
            <View style={styles.radioIcon}><Lock size={20} color={visibility === '1st' ? '#7B2CBF' : '#64748B'} /></View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, visibility === '1st' && styles.radioTitleActive]}>Sadece Güvendiklerim (1. Derece)</Text>
              <Text style={styles.radioDesc}>Sadece sizin direkt olarak "Güveniyorum" dediğiniz kişiler görebilir.</Text>
            </View>
            <View style={[styles.radioCircle, visibility === '1st' && styles.radioCircleActive]}>
              {visibility === '1st' && <View style={styles.radioCircleInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioOption, visibility === '2nd' && styles.radioOptionActive]}
            onPress={() => setVisibility('2nd')}
            activeOpacity={0.8}
          >
            <View style={styles.radioIcon}><Users size={20} color={visibility === '2nd' ? '#7B2CBF' : '#64748B'} /></View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, visibility === '2nd' && styles.radioTitleActive]}>Ağım (2. Derece - Önerilen)</Text>
              <Text style={styles.radioDesc}>Güvendiğiniz kişiler ve onların güvendiği kişiler haritanızı görebilir.</Text>
            </View>
            <View style={[styles.radioCircle, visibility === '2nd' && styles.radioCircleActive]}>
              {visibility === '2nd' && <View style={styles.radioCircleInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioOption, visibility === 'public' && styles.radioOptionActive]}
            onPress={() => setVisibility('public')}
            activeOpacity={0.8}
          >
            <View style={styles.radioIcon}><Globe size={20} color={visibility === 'public' ? '#7B2CBF' : '#64748B'} /></View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, visibility === 'public' && styles.radioTitleActive]}>Tüm Tavsi Topluluğu</Text>
              <Text style={styles.radioDesc}>Ağınızda olmayan kişiler de dahil olmak üzere herkes görebilir.</Text>
            </View>
            <View style={[styles.radioCircle, visibility === 'public' && styles.radioCircleActive]}>
              {visibility === 'public' && <View style={styles.radioCircleInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Diğer Ayarlar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arama ve Keşif</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Aramalarda Bulunabilirlik</Text>
              <Text style={styles.switchDesc}>İnsanlar isminizi veya numaranızı aratarak profilinizi bulabilir.</Text>
            </View>
            <Switch
              value={allowSearch}
              onValueChange={setAllowSearch}
              trackColor={{ false: '#E2E8F0', true: '#7B2CBF' }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>Anonim İstatistiklere Katıl</Text>
              <Text style={styles.switchDesc}>Trendleri belirlemek için verilerinizin anonim olarak kullanılmasına izin verin.</Text>
            </View>
            <Switch
              value={anonymousStats}
              onValueChange={setAnonymousStats}
              trackColor={{ false: '#E2E8F0', true: '#7B2CBF' }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Tehlikeli Bölge */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.deleteAccountText}>Hesabımı İptal Et ve Sil</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  scrollContent: { paddingBottom: 40 },

  infoBanner: { flexDirection: 'row', backgroundColor: 'rgba(123, 44, 191, 0.05)', margin: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(123, 44, 191, 0.1)' },
  infoBannerText: { flex: 1, marginLeft: 16 },
  infoBannerTitle: { fontSize: 15, fontWeight: '700', color: '#7B2CBF', marginBottom: 4 },
  infoBannerDesc: { fontSize: 13, color: '#475569', lineHeight: 20 },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: '#64748B', marginBottom: 16 },

  radioOption: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  radioOptionActive: { borderColor: '#7B2CBF', backgroundColor: 'rgba(123, 44, 191, 0.02)' },
  radioIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioTextContainer: { flex: 1, justifyContent: 'center' },
  radioTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  radioTitleActive: { color: '#7B2CBF' },
  radioDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginLeft: 12 },
  radioCircleActive: { borderColor: '#7B2CBF' },
  radioCircleInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#7B2CBF' },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  switchTextContainer: { flex: 1, paddingRight: 16 },
  switchTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  switchDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  divider: { height: 12 },

  deleteAccountBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  deleteAccountText: { fontSize: 16, fontWeight: '700', color: '#EF4444', marginLeft: 8 },
});
