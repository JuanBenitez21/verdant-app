import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import {
  registerForPushNotifications,
  scheduleDaily8pmReminder,
  cancelDailyReminder,
  sendLocalCelebration,
} from '@/services/notifications.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications(hasReportedToday: boolean) {
  const listenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('verdant', {
          name: 'Verdant',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      const token = await registerForPushNotifications();
      if (!token || !mounted) return;

      // Persistir token en Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id) {
        await supabase
          .from('users')
          .update({ push_token: token })
          .eq('id', session.user.id);
      }

      // Recordatorio diario solo si no reportó hoy
      if (!hasReportedToday) {
        await scheduleDaily8pmReminder();
      } else {
        await cancelDailyReminder();
      }
    }

    setup().catch(console.warn);

    // Escucha respuestas a notificaciones en background
    listenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.event === 'day_confirmed' && data.daysCount) {
        sendLocalCelebration(Number(data.daysCount)).catch(console.warn);
      }
    });

    return () => {
      mounted = false;
      listenerRef.current?.remove();
    };
  }, [hasReportedToday]);
}

export { cancelDailyReminder };
