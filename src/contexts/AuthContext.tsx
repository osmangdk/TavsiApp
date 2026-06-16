import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isSetupComplete: boolean;
  checkSetupStatus: () => Promise<void>;
};

// Başlangıç değeri
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isSetupComplete: false,
  checkSetupStatus: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const checkSetupStatus = async (currentUserId?: string) => {
    const targetUserId = currentUserId || session?.user?.id || user?.id;
    if (!targetUserId) {
      setIsSetupComplete(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('setup_completed')
        .eq('id', targetUserId)
        .single();
        
      if (data && data.setup_completed === true) {
        setIsSetupComplete(true);
      } else {
        setIsSetupComplete(false);
      }
    } catch (err) {
      console.log("Setup check error", err);
      setIsSetupComplete(false);
    }
  };

  useEffect(() => {
    // 1. Uygulama açıldığında mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSetupStatus(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // 2. Giriş yapma, Çıkış yapma gibi Auth değişikliklerini anlık dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setIsLoading(true);
        checkSetupStatus(newSession.user.id).finally(() => setIsLoading(false));
      } else {
        setIsSetupComplete(false);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isSetupComplete, checkSetupStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

// Sayfalarda kolayca kullanmak için özel Hook
export const useAuth = () => useContext(AuthContext);
