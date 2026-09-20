import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isSetupComplete: boolean;
  hasProfile: boolean;
  checkSetupStatus: (currentUserId?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Başlangıç değeri
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isSetupComplete: false,
  hasProfile: false,
  checkSetupStatus: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const signOut = async () => {
    // Önce tüm state'i sıfırla — AppNavigator anında Welcome'a yönlendirir
    setSession(null);
    setUser(null);
    setIsSetupComplete(false);
    setHasProfile(false);
    // Sonra Supabase oturumunu kapat
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log('SignOut error (ignored):', e);
    }
    setIsLoading(false);
  };

  const checkSetupStatus = async (currentUserId?: string) => {
    const targetUserId = currentUserId || session?.user?.id || user?.id;
    if (!targetUserId) {
      setIsSetupComplete(false);
      setHasProfile(false);
      return;
    }
    
    try {
      // 1. Profil bilgisini ve setup_completed durumunu çek
      const { data: profileData } = await supabase
        .from('profiles')
        .select('setup_completed, full_name, username')
        .eq('id', targetUserId)
        .maybeSingle();
        
      // 2. Kullanıcının user_places tablosundaki mekan sayısını kontrol et
      const { count } = await supabase
        .from('user_places')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      const placeCount = count || 0;
      // Profil dolu sayılması için: full_name VEYA username yeterli
      // (ikisi birden zorunlu değil — biri boş kalsa da devam edebilmeli)
      const isProfileFilled = !!(profileData && (profileData.full_name || profileData.username));
      setHasProfile(isProfileFilled);

      // Kurulumun tamamlanmış sayılma koşulu:
      // Profil dolu + en az 3 mekan var → kurulum tamamdır.
      // setup_completed bayrağı DB'de false kalsa bile 3 mekan varsa otomatik düzelt.
      if (isProfileFilled && placeCount >= 3) {
        // Bayrak DB'de henüz güncellenmemişse otomatik düzelt
        if (!profileData?.setup_completed) {
          await supabase
            .from('profiles')
            .update({ setup_completed: true })
            .eq('id', targetUserId);
        }
        setIsSetupComplete(true);
      } else {
        setIsSetupComplete(false);
      }
    } catch (err) {
      console.log("Setup check error", err);
      setIsSetupComplete(false);
      setHasProfile(false);
    }
  };

  useEffect(() => {
    // 1. Uygulama açıldığında mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const isEmailUser = user?.app_metadata?.provider === 'email';
      const isConfirmed = !isEmailUser || user?.email_confirmed_at != null;

      if (session?.user && isConfirmed) {
        setSession(session);
        setUser(user ?? null);
        checkSetupStatus(user!.id).finally(() => setIsLoading(false));
      } else {
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    // 2. Giriş yapma, Çıkış yapma gibi Auth değişikliklerini anlık dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const user = newSession?.user;
      const isEmailUser = user?.app_metadata?.provider === 'email';
      const isConfirmed = !isEmailUser || user?.email_confirmed_at != null;

      if (newSession?.user && isConfirmed) {
        setSession(newSession);
        setUser(user ?? null);
        setIsLoading(true);
        checkSetupStatus(user!.id).finally(() => setIsLoading(false));
      } else {
        setSession(null);
        setUser(null);
        setIsSetupComplete(false);
        setHasProfile(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isSetupComplete, hasProfile, checkSetupStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Sayfalarda kolayca kullanmak için özel Hook
export const useAuth = () => useContext(AuthContext);
