import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Shield, Users, Globe, Lock, Trash2, ChevronRight, LogOut, Award, KeyRound, X } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../services/supabaseClient';

export default function PrivacyCenterScreen() {
  const navigation = useNavigation<any>();
  const { session, signOut } = useAuth();
  const { colors, isDark } = useTheme();

  const [visibility, setVisibility] = useState('2nd');
  const [allowSearch, setAllowSearch] = useState(true);
  const [anonymousStats, setAnonymousStats] = useState(true);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword) {
      setPasswordError('Lütfen mevcut şifrenizi girin.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Lütfen yeni şifrenizi girin.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('Yeni şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Yeni şifreniz mevcut şifrenizle aynı olamaz.');
      return;
    }

    const userEmail = session?.user?.email;
    if (!userEmail) {
      setPasswordError('Kullanıcı e-posta adresi bulunamadı.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError('Mevcut şifreniz hatalı. Lütfen kontrol edip tekrar deneyin.');
        setIsChangingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message || 'Şifre güncellenemedi.');
      } else {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Başarılı 🔐', 'Şifreniz başarıyla güncellendi.');
      }
    } catch (e: any) {
      setPasswordError('Şifre güncellenirken beklenmedik bir hata oluştu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    supabase
      .from('profiles')
      .select('default_visibility, allow_search, anonymous_stats')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return;
        if (data.default_visibility) setVisibility(data.default_visibility);
        if (typeof data.allow_search === 'boolean') setAllowSearch(data.allow_search);
        if (typeof data.anonymous_stats === 'boolean') setAnonymousStats(data.anonymous_stats);
      });
  }, [session?.user?.id]);

  const savePrivacyPreference = async (changes: Record<string, boolean | string>) => {
    if (!session?.user?.id) return false;
    const { error } = await supabase
      .from('profiles')
      .update(changes)
      .eq('id', session.user.id);

    if (error) {
      Alert.alert('Hata', 'Gizlilik tercihi kaydedilemedi. Lütfen tekrar deneyin.');
      return false;
    }
    return true;
  };

  const handleVisibilityChange = async (value: string) => {
    const previous = visibility;
    setVisibility(value);
    if (!(await savePrivacyPreference({ default_visibility: value }))) setVisibility(previous);
  };

  const handleAllowSearchChange = async (value: boolean) => {
    const previous = allowSearch;
    setAllowSearch(value);
    if (!(await savePrivacyPreference({ allow_search: value }))) setAllowSearch(previous);
  };

  const handleAnonymousStatsChange = async (value: boolean) => {
    const previous = anonymousStats;
    setAnonymousStats(value);
    if (!(await savePrivacyPreference({ anonymous_stats: value }))) setAnonymousStats(previous);
  };

  const handleSignOut = async () => {
    const doSignOut = async () => {
      await signOut();
    };

    if (Platform.OS === 'web') {
      const confirmOut = window.confirm("Oturumunuz kapatılsın mı?");
      if (confirmOut) await doSignOut();
    } else {
      Alert.alert(
        "Çıkış Yap",
        "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          { text: "Çıkış Yap", style: "destructive", onPress: doSignOut }
        ]
      );
    }
  };

  const handleDeleteAccount = () => {
    const doDelete = async () => {
      try {
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw error;
        await signOut();
      } catch (e) {
        console.error('Hesap silme hatası:', e);
        Alert.alert('Hata', 'Hesabınız silinemedi. Verileriniz korunmaya devam ediyor; lütfen tekrar deneyin.');
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm tercih haritanız silinir.");
      if (confirmDelete) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Hesabı Sil",
        "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm tercih haritanız silinir.",
        [
          { text: "İptal", style: "cancel" },
          { text: "Evet, Sil", style: "destructive", onPress: doDelete }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Gizlilik & Ayarlar</Text>
        <View style={{ width: 40 }} /> {/* Layout dengelemesi için */}
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryBg, borderColor: isDark ? colors.border : 'rgba(123, 44, 191, 0.1)' }]}>
          <Shield size={24} color={colors.primary} />
          <View style={styles.infoBannerText}>
            <Text style={[styles.infoBannerTitle, { color: colors.primary }]}>Verileriniz Sizin Kontrolünüzde</Text>
            <Text style={[styles.infoBannerDesc, { color: colors.subText }]}>Tavsi'de reklam için veri satılmaz. Tercihlerinizi kimlerin görebileceğine tamamen siz karar verirsiniz.</Text>
          </View>
        </View>

        {/* Görünürlük Ayarları */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tercih Haritası Görünürlüğü</Text>
          <Text style={[styles.sectionDesc, { color: colors.subText }]}>Mekan tavsiyelerinizi kimler görebilir?</Text>

          <TouchableOpacity 
            style={[styles.radioOption, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, visibility === '1st' && [styles.radioOptionActive, { borderColor: colors.primary, backgroundColor: colors.primaryBg }]]}
            onPress={() => handleVisibilityChange('1st')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioIcon, { backgroundColor: colors.primaryBg }]}><Lock size={20} color={visibility === '1st' ? colors.primary : colors.subText} /></View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, { color: colors.text }, visibility === '1st' && [styles.radioTitleActive, { color: colors.primary }]]}>Sadece Güvendiklerim (1. Derece)</Text>
              <Text style={[styles.radioDesc, { color: colors.subText }]}>Sadece sizin direkt olarak "Güveniyorum" dediğiniz kişiler görebilir.</Text>
            </View>
            <View style={[styles.radioCircle, { borderColor: colors.border }, visibility === '1st' && [styles.radioCircleActive, { borderColor: colors.primary }]]}>
              {visibility === '1st' && <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioOption, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, visibility === '2nd' && [styles.radioOptionActive, { borderColor: colors.primary, backgroundColor: colors.primaryBg }]]}
            onPress={() => handleVisibilityChange('2nd')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioIcon, { backgroundColor: colors.primaryBg }]}><Users size={20} color={visibility === '2nd' ? colors.primary : colors.subText} /></View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, { color: colors.text }, visibility === '2nd' && [styles.radioTitleActive, { color: colors.primary }]]}>Ağım (2. Derece - Önerilen)</Text>
              <Text style={[styles.radioDesc, { color: colors.subText }]}>Güvendiğiniz kişiler ve onların güvendiği kişiler haritanızı görebilir.</Text>
            </View>
            <View style={[styles.radioCircle, { borderColor: colors.border }, visibility === '2nd' && [styles.radioCircleActive, { borderColor: colors.primary }]]}>
              {visibility === '2nd' && <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.radioOption, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, visibility === 'public' && [styles.radioOptionActive, { borderColor: colors.primary, backgroundColor: colors.primaryBg }]]}
            onPress={() => handleVisibilityChange('public')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioIcon, { backgroundColor: colors.primaryBg }]}><Globe size={20} color={visibility === 'public' ? colors.primary : colors.subText} /></View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, { color: colors.text }, visibility === 'public' && [styles.radioTitleActive, { color: colors.primary }]]}>Tüm Tavsi Topluluğu</Text>
              <Text style={[styles.radioDesc, { color: colors.subText }]}>Ağınızda olmayan kişiler de dahil olmak üzere herkes görebilir.</Text>
            </View>
            <View style={[styles.radioCircle, { borderColor: colors.border }, visibility === 'public' && [styles.radioCircleActive, { borderColor: colors.primary }]]}>
              {visibility === 'public' && <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Diğer Ayarlar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Arama ve Keşif</Text>
          
          <View style={[styles.switchRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.switchTextContainer}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>Aramalarda Bulunabilirlik</Text>
              <Text style={[styles.switchDesc, { color: colors.subText }]}>İnsanlar isminizi veya numaranızı aratarak profilinizi bulabilir.</Text>
            </View>
            <Switch
              value={allowSearch}
              onValueChange={handleAllowSearchChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={[styles.switchRow, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.switchTextContainer}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>Anonim İstatistiklere Katıl</Text>
              <Text style={[styles.switchDesc, { color: colors.subText }]}>Trendleri belirlemek için verilerinizin anonim olarak kullanılmasına izin verin.</Text>
            </View>
            <Switch
              value={anonymousStats}
              onValueChange={handleAnonymousStatsChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </View>

        {/* Yasal, Görünüm ve Telif Hakları */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Uygulama Ayarları & Telif</Text>
          
          <TouchableOpacity 
            style={[styles.ipMenuBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, marginBottom: 12 }]} 
            onPress={() => navigation.navigate('AppSettings')}
            activeOpacity={0.8}
          >
            <View style={[styles.ipMenuIconWrapper, { backgroundColor: colors.primaryBg }]}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ipMenuTitle, { color: colors.text }]}>Uygulama & Görünüm Ayarları</Text>
              <Text style={[styles.ipMenuSub, { color: colors.subText }]}>Karanlık mod (Dark mode) ve dil tercihleri</Text>
            </View>
            <ChevronRight size={20} color={colors.subText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.ipMenuBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]} 
            onPress={() => navigation.navigate('IntellectualProperty')}
            activeOpacity={0.8}
          >
            <View style={[styles.ipMenuIconWrapper, { backgroundColor: colors.primaryBg }]}>
              <Award size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ipMenuTitle, { color: colors.text }]}>Fikri ve Sınai Haklar</Text>
              <Text style={[styles.ipMenuSub, { color: colors.subText }]}>Proje künyesi, telif bildirimi ve yasal haklar</Text>
            </View>
            <ChevronRight size={20} color={colors.subText} />
          </TouchableOpacity>
        </View>

        {/* Güvenlik & Şifre Yönetimi */}
        {session?.user?.email ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Güvenlik</Text>
            <Text style={[styles.sectionDesc, { color: colors.subText }]}>Hesap ve kimlik doğrulama ayarları</Text>

            <TouchableOpacity
              style={[styles.ipMenuBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => {
                setPasswordError('');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.ipMenuIconWrapper, { backgroundColor: colors.primaryBg }]}>
                <KeyRound size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ipMenuTitle, { color: colors.text }]}>Şifre Değiştir</Text>
                <Text style={[styles.ipMenuSub, { color: colors.subText }]}>Mevcut şifrenizi doğrulayarak yeni şifre belirleyin</Text>
              </View>
              <ChevronRight size={20} color={colors.subText} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Hesap ve Oturum Yönetimi */}
        <View style={[styles.section, { marginTop: 12, gap: 12 }]}>
          <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.primaryBg, borderColor: isDark ? colors.border : '#D8B4E2' }]} onPress={handleSignOut} activeOpacity={0.7}>
            <LogOut size={20} color={colors.primary} />
            <Text style={[styles.signOutText, { color: colors.primary }]}>Oturumu Kapat / Çıkış Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteAccountBtn, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Trash2 size={20} color="#EF4444" />
            <Text style={styles.deleteAccountText}>Hesabımı İptal Et ve Sil</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Şifre Değiştir Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isChangingPassword && setShowPasswordModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBg }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalBg, borderColor: colors.cardBorder, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Şifre Değiştir</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                disabled={isChangingPassword}
                style={styles.modalCloseBtn}
              >
                <X size={22} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.subText }]}>Mevcut Şifreniz</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="Mevcut şifrenizi girin"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: colors.subText }]}>Yeni Şifreniz</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="Yeni şifrenizi girin (en az 8 karakter)"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: colors.subText }]}>Yeni Şifreniz (Tekrar)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                placeholder="Yeni şifrenizi tekrar girin"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />

              <View style={[styles.modalCriteriaBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.modalCriteriaTitle, { color: colors.text }]}>Güvenlik Kuralları:</Text>
                <Text style={[styles.modalCriteriaItem, { color: colors.subText }]}>• En az 8 karakter uzunluğunda olmalı</Text>
                <Text style={[styles.modalCriteriaItem, { color: colors.subText }]}>• En az bir büyük harf (A-Z) içermeli</Text>
                <Text style={[styles.modalCriteriaItem, { color: colors.subText }]}>• En az bir küçük harf (a-z) içermeli</Text>
                <Text style={[styles.modalCriteriaItem, { color: colors.subText }]}>• En az bir rakam (0-9) içermeli</Text>
              </View>

              {passwordError ? (
                <Text style={styles.modalErrorText}>{passwordError}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: colors.primary },
                  isChangingPassword && { opacity: 0.7 },
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
                activeOpacity={0.8}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Şifreyi Güncelle</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  scrollContent: { paddingBottom: 40 },

  infoBanner: { flexDirection: 'row', margin: 20, padding: 16, borderRadius: 16, borderWidth: 1 },
  infoBannerText: { flex: 1, marginLeft: 16 },
  infoBannerTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  infoBannerDesc: { fontSize: 13, lineHeight: 20 },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sectionDesc: { fontSize: 14, marginBottom: 16 },

  radioOption: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  radioOptionActive: {},
  radioIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioTextContainer: { flex: 1, justifyContent: 'center' },
  radioTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  radioTitleActive: {},
  radioDesc: { fontSize: 13, lineHeight: 18 },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginLeft: 12 },
  radioCircleActive: {},
  radioCircleInner: { width: 12, height: 12, borderRadius: 6 },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1 },
  switchTextContainer: { flex: 1, paddingRight: 16 },
  switchTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  switchDesc: { fontSize: 13, lineHeight: 18 },
  divider: { height: 12 },

  ipMenuBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 12 },
  ipMenuIconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  ipMenuTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  ipMenuSub: { fontSize: 12 },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  signOutText: { fontSize: 16, fontWeight: '700', marginLeft: 8 },

  deleteAccountBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA' },
  deleteAccountText: { fontSize: 16, fontWeight: '700', color: '#EF4444', marginLeft: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalCriteriaBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
  },
  modalCriteriaTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalCriteriaItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  modalSubmitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 6,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
