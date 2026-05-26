import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    registerAndSaveToken(userId);
    scheduleDailyReminder();
  }, [userId]);
}

async function registerAndSaveToken(userId: string) {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('verdant', {
      name: 'Verdant',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
  if (!tokenData) return;

  await supabase
    .from('users')
    .update({ push_token: tokenData.data })
    .eq('id', userId);
}

async function scheduleDailyReminder() {
  // Cancelar notificaciones previas para no duplicar
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 ¿Ya reportaste tu día limpio?',
      body: 'Tu planta te espera. ¡Sigue la racha!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
