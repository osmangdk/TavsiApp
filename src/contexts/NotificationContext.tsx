import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default';

interface NotificationContextType {
  permissionStatus: NotificationPermissionStatus;
  isNotificationsEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  sendLocalNotification: (title: string, body: string, icon?: string) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  permissionStatus: 'default',
  isNotificationsEnabled: false,
  requestPermission: async () => false,
  sendLocalNotification: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('default');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  // Initial check for notification permissions on web/mobile
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPerm = Notification.permission as NotificationPermissionStatus;
      setPermissionStatus(currentPerm);
      setIsNotificationsEnabled(currentPerm === 'granted');
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

        if (enabled) {
          sendLocalNotification('Tavsi Bildirimleri Aktif 🔔', 'Ağınızdaki yeni istekler ve tavsiyeler anında cep telefonunuza/ekranınıza iletilecektir.');
        }
        return enabled;
      } catch (err) {
        console.error('Bildirim izni alma hatası:', err);
        return false;
      }
    }
    return false;
  };

  const sendLocalNotification = (title: string, body: string, icon: string = '/favicon.ico') => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          // Native Web Notification
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
    if (!session?.user?.id) return;

    // Supabase Realtime Subscription for incoming connections
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
            // Fetch inviter info for rich notification
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
        sendLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
