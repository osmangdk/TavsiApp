import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default';

interface NotificationContextType {
  permissionStatus: NotificationPermissionStatus;
  isNotificationsEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  toggleNotifications: (enable?: boolean) => Promise<boolean>;
  sendLocalNotification: (title: string, body: string, icon?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  permissionStatus: 'default',
  isNotificationsEnabled: false,
  requestPermission: async () => false,
  toggleNotifications: async () => false,
  sendLocalNotification: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  // 1. Initial check for system notification permissions
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // 2. Fetch user's saved notification preference from Supabase DB / Storage when session changes
  useEffect(() => {
    fetchSavedUserPreference();
  }, [session?.user?.id]);

  const checkPermissionStatus = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPerm = Notification.permission as NotificationPermissionStatus;
      setPermissionStatus(currentPerm);
    }
  };

  const fetchSavedUserPreference = async () => {
    if (!session?.user?.id) return;

    // First check localStorage for fast offline initial state
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(`tavsi_notif_${session.user.id}`);
        if (saved !== null) {
          setIsNotificationsEnabled(saved === 'true');
        }
      }
    } catch (e) {}

    // Fetch authoritative state from Supabase profiles table
    try {
      const { data } = await supabase
        .from('profiles')
        .select('notifications_enabled')
        .eq('id', session.user.id)
        .maybeSingle();

      if (data && typeof data.notifications_enabled === 'boolean') {
        setIsNotificationsEnabled(data.notifications_enabled);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(`tavsi_notif_${session.user.id}`, String(data.notifications_enabled));
        }
      }
    } catch (err) {
      console.log('Profil bildirim ayarı çekme hatası (kolon bulunamadıysa opsiyonel):', err);
    }
  };

  const saveUserPreferenceToDb = async (userId: string, enabled: boolean) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`tavsi_notif_${userId}`, String(enabled));
      }
      // Update profiles table in Supabase DB (silently ignore if column isn't created yet)
      await supabase
        .from('profiles')
        .update({ notifications_enabled: enabled })
        .eq('id', userId);
    } catch (e) {
      console.log('DB bildirim tercihi kaydetme uyarısı:', e);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        const status = res as NotificationPermissionStatus;
        setPermissionStatus(status);
        const enabled = status === 'granted';
        setIsNotificationsEnabled(enabled);

        if (session?.user?.id) {
          await saveUserPreferenceToDb(session.user.id, enabled);
        }

        if (enabled) {
          sendLocalNotification(
            'Tavsi Bildirimleri Aktif 🔔',
            'Ağınızdaki yeni istekler ve tavsiyeler anında cep telefonunuza/ekranınıza iletilecektir.'
          );
        }
        return enabled;
      } catch (err) {
        console.error('Bildirim izni alma hatası:', err);
        return false;
      }
    }
    return false;
  };

  const toggleNotifications = async (enable?: boolean): Promise<boolean> => {
    const targetState = enable !== undefined ? enable : !isNotificationsEnabled;

    if (targetState) {
      // Turn ON: request browser/system permission
      const granted = await requestPermission();
      return granted;
    } else {
      // Turn OFF: set state to false and save to DB
      setIsNotificationsEnabled(false);
      if (session?.user?.id) {
        await saveUserPreferenceToDb(session.user.id, false);
      }
      return false;
    }
  };

  const sendLocalNotification = (title: string, body: string, icon: string = '/favicon.ico') => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted' && isNotificationsEnabled) {
        try {
          const notif = new Notification(title, {
            body,
            icon,
            badge: icon,
            tag: 'tavsi-notif',
          });

          notif.onclick = () => {
            if (typeof window !== 'undefined') {
              window.focus();
            }
          };
        } catch (e) {
          console.error('Lokal bildirim gönderme hatası:', e);
        }
      }
    }
  };

  // Realtime listener for incoming trust requests when user is logged in
  useEffect(() => {
    if (!session?.user?.id || !isNotificationsEnabled) return;

    const channel = supabase
      .channel('public:connections:' + session.user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
          filter: `following_id=eq.${session.user.id}`,
        },
        async (payload) => {
          if (payload.new && payload.new.status === 'pending') {
            try {
              const { data: followerData } = await supabase
                .from('profiles')
                .select('full_name, username')
                .eq('id', payload.new.follower_id)
                .single();

              const followerName = followerData?.full_name || `@${followerData?.username}` || 'Bir kullanıcı';
              sendLocalNotification(
                'Yeni Ağ İsteyi! 👥',
                `${followerName} sizi güvenilen ağına eklemek istiyor.`
              );
            } catch (err) {
              sendLocalNotification('Yeni Ağ İsteyi! 👥', 'Bir kullanıcı sizi güvenilen ağına eklemek istiyor.');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, isNotificationsEnabled]);

  return (
    <NotificationContext.Provider
      value={{
        permissionStatus,
        isNotificationsEnabled,
        requestPermission,
        toggleNotifications,
        sendLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
