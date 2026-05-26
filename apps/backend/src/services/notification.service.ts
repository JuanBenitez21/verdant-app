interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

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

  const message: ExpoMessage = { to: pushToken, title, body, ...(data ? { data } : {}) };

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const json = await res.json() as { data?: { status: string } };
    if (json.data?.status !== 'ok') {
      console.warn('[notif] Expo push respondió con estado inesperado:', json);
    } else {
      console.log(`[notif] ✅ Push enviado — "${title}"`);
    }
  } catch (err) {
    console.error('[notif] Error enviando push:', err);
  }
}
