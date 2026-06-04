export async function sendPushNotification(
  pushToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!pushToken) {
    console.log(`[notif] Sin token push — título: "${title}"`);
    return;
  }
  await sendExpoPushNotification(pushToken, title, body, data);
}

async function sendExpoPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: object,
): Promise<void> {
  if (!pushToken.startsWith('ExponentPushToken')) return;

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: pushToken, sound: 'default', title, body, data: data ?? {} }),
    });

    const result = await response.json() as { data?: { status: string; message?: string } };
    if (result.data?.status === 'error') {
      console.error('[notif] Expo push error:', result.data.message);
    } else {
      console.log(`[notif] ✅ Push enviado — "${title}"`);
    }
  } catch (error) {
    console.error('[notif] Error enviando push:', error);
  }
}
