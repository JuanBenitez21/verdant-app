import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';

const T = ScreenTheme.light;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface TokenInfo {
  userName: string;
  plantName: string;
  plantEmoji: string;
  daysCount: number;
  frictionOptions: string[];
}

type ScreenState = 'loading' | 'error' | 'ready' | 'submitting' | 'success' | 'uncertain';

export default function ConfirmarPadrinoScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/padrino/confirmar/${token}`)
      .then(r => r.json())
      .then((json: { success: boolean; data?: TokenInfo; error?: { message: string } }) => {
        if (!json.success || !json.data) {
          setErrorMsg(json.error?.message ?? 'Token inválido o expirado');
          setScreenState('error');
          return;
        }
        setInfo(json.data);
        setScreenState('ready');
      })
      .catch(() => {
        setErrorMsg('No se pudo conectar al servidor');
        setScreenState('error');
      });
  }, [token]);

  async function handleConfirm() {
    if (!selected) return;
    setScreenState('submitting');

    const res = await fetch(`${API_URL}/api/padrino/confirmar/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frictionAnswer: selected }),
    });

    const json = await res.json() as {
      success: boolean;
      data?: { confirmed: boolean; message?: string };
      error?: { message: string };
    };

    if (!json.success) {
      setErrorMsg(json.error?.message ?? 'Error al confirmar');
      setScreenState('error');
      return;
    }

    setScreenState(json.data?.confirmed ? 'success' : 'uncertain');
  }

  if (screenState === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.green500} size="large" />
        <Text style={styles.loadingText}>Verificando enlace…</Text>
      </View>
    );
  }

  if (screenState === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Ups</Text>
        <Text style={styles.errorBody}>{errorMsg}</Text>
      </View>
    );
  }

  if (screenState === 'success') {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>{info?.plantEmoji ?? '🌿'}</Text>
        <Text style={styles.successTitle}>¡Confirmado!</Text>
        <Text style={styles.successBody}>
          Le dijiste que sí. La planta <Text style={{ fontWeight: '700' }}>{info?.plantName}</Text> de {info?.userName} creció hoy.{'\n'}Gracias por acompañarlo/a en este camino.
        </Text>
        <View style={styles.daysBadge}>
          <Text style={styles.daysBadgeText}>Día {info?.daysCount} 🔥</Text>
        </View>
      </View>
    );
  }

  if (screenState === 'uncertain') {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>🤝</Text>
        <Text style={styles.successTitle}>Gracias por tu honestidad</Text>
        <Text style={styles.successBody}>
          Tu respuesta quedó registrada. {info?.userName} sabrá que hoy no pudiste confirmar.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.logo}>🌿 Verdant</Text>

      <View style={styles.plantHeader}>
        <Text style={styles.plantEmoji}>{info?.plantEmoji}</Text>
        <View>
          <Text style={styles.title}>Confirma el día de {info?.userName}</Text>
          <Text style={styles.subtitle}>
            Día {info?.daysCount} · Planta: {info?.plantName}
          </Text>
        </View>
      </View>

      <Text style={styles.questionLabel}>¿Cómo fue hoy?</Text>

      {info?.frictionOptions.map((option) => (
        <Pressable
          key={option}
          style={[styles.option, selected === option && styles.optionSelected]}
          onPress={() => setSelected(option)}
        >
          <View style={[styles.radio, selected === option && styles.radioSelected]} />
          <Text style={[styles.optionText, selected === option && styles.optionTextSelected]}>
            {option}
          </Text>
        </Pressable>
      ))}

      <Pressable
        style={[styles.btnPrimary, (!selected || screenState === 'submitting') && styles.btnDisabled]}
        onPress={handleConfirm}
        disabled={!selected || screenState === 'submitting'}
      >
        {screenState === 'submitting'
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.btnText}>Confirmar</Text>
        }
      </Pressable>

      <Text style={styles.disclaimer}>
        Este enlace expira a medianoche de hoy. No necesitas crear una cuenta.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  loadingText: { ...Typography.bodyMedium, color: Colors.textSoft },
  errorEmoji: { fontSize: 48 },
  errorTitle: { ...Typography.displaySmall, color: Colors.textDark },
  errorBody: { ...Typography.bodyMedium, color: Colors.textMid, textAlign: 'center' },
  logo: { ...Typography.labelLarge, color: Colors.green500 },
  plantHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  plantEmoji: { fontSize: 48 },
  title: { ...Typography.displaySmall, color: Colors.textDark, flexShrink: 1 },
  subtitle: { ...Typography.bodySmall, color: Colors.textSoft, marginTop: 2 },
  questionLabel: { ...Typography.labelLarge, color: Colors.textMid },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.warm,
  },
  optionSelected: {
    borderColor: Colors.green500,
    backgroundColor: Colors.green50,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSoft,
  },
  radioSelected: { borderColor: Colors.green500, backgroundColor: Colors.green500 },
  optionText: { ...Typography.bodyMedium, color: Colors.textMid, flex: 1 },
  optionTextSelected: { color: Colors.textDark, fontWeight: '600' },
  btnPrimary: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { ...Typography.labelLarge, color: Colors.white },
  disclaimer: { ...Typography.caption, color: Colors.textSoft, textAlign: 'center' },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successEmoji: { fontSize: 72 },
  successTitle: { ...Typography.displayMedium, color: Colors.green800 },
  successBody: { ...Typography.bodyLarge, color: Colors.textMid, textAlign: 'center', lineHeight: 26 },
  daysBadge: {
    backgroundColor: Colors.green500,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  daysBadgeText: { ...Typography.labelLarge, color: Colors.white },
});
