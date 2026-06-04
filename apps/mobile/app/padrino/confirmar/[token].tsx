import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { supabase } from '@/services/supabase';
import { API_URL } from '@/services/api.service';

const T = ScreenTheme.light;

interface TokenInfo {
  userName: string; plantName: string; plantType?: string;
  daysCount: number; frictionOptions: string[];
}
type ScreenState = 'loading' | 'error' | 'ready' | 'submitting' | 'success' | 'uncertain';

const PLANT_EMOJI: Record<string, string> = {
  sakura: '🌸', clasico: '🌿', orquidea: '💜', cactus: '🌵',
};

async function loadTokenInfo(token: string): Promise<{ ok: true; data: TokenInfo } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/padrino/confirmar/${token}`, { signal: AbortSignal.timeout(4000) });
    const j = await res.json() as { success: boolean; data?: TokenInfo; error?: { message: string } };
    if (j.success && j.data) return { ok: true, data: j.data };
    return { ok: false, error: j.error?.message ?? 'Token inválido' };
  } catch { /* backend no disponible */ }

  // Fallback Supabase
  const { data, error } = await supabase.rpc('get_godparent_token_info', { p_token: token });
  if (error || !data) return { ok: false, error: 'No se pudo verificar el enlace' };
  const d = data as { success: boolean; error?: string } & TokenInfo;
  if (!d.success) return { ok: false, error: d.error ?? 'Token inválido o expirado' };
  return { ok: true, data: d };
}

async function submitConfirmation(token: string, frictionAnswer: string): Promise<{ ok: true; confirmed: boolean } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/padrino/confirmar/${token}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frictionAnswer }), signal: AbortSignal.timeout(4000),
    });
    const j = await res.json() as { success: boolean; data?: { confirmed: boolean }; error?: { message: string } };
    if (j.success) return { ok: true, confirmed: j.data?.confirmed ?? false };
    return { ok: false, error: j.error?.message ?? 'Error al confirmar' };
  } catch { /* backend no disponible */ }

  // Fallback Supabase
  const { data, error } = await supabase.rpc('confirm_godparent_day', { p_token: token, p_friction_answer: frictionAnswer });
  if (error || !data) return { ok: false, error: 'Error al confirmar' };
  const d = data as { success: boolean; confirmed?: boolean; error?: string };
  if (!d.success) return { ok: false, error: d.error ?? 'Error al confirmar' };
  return { ok: true, confirmed: d.confirmed ?? false };
}

export default function ConfirmarPadrinoScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setErrorMsg('Token no encontrado'); setScreenState('error'); return; }
    loadTokenInfo(token).then(r => {
      if (r.ok) { setInfo(r.data); setScreenState('ready'); }
      else { setErrorMsg(r.error); setScreenState('error'); }
    }).catch(() => { setErrorMsg('Error de conexión'); setScreenState('error'); });
  }, [token]);

  async function handleConfirm() {
    if (!selected || !token) return;
    setScreenState('submitting');
    const r = await submitConfirmation(token, selected).catch(() => ({ ok: false as const, error: 'Error de conexión' }));
    if (!r.ok) { setErrorMsg(r.error); setScreenState('error'); return; }
    setScreenState(r.confirmed ? 'success' : 'uncertain');
    setTimeout(() => router.replace('/(tabs)'), 3000);
  }

  const plantEmoji = PLANT_EMOJI[info?.plantType ?? ''] ?? '🌿';

  if (screenState === 'loading') return (
    <View style={styles.center}><ActivityIndicator color={Colors.green500} size="large" /><Text style={styles.loadingText}>Verificando enlace…</Text></View>
  );
  if (screenState === 'error') return (
    <View style={styles.center}><Text style={styles.errorEmoji}>😕</Text><Text style={styles.errorTitle}>Ups</Text><Text style={styles.errorBody}>{errorMsg}</Text></View>
  );
  if (screenState === 'success') return (
    <View style={styles.successContainer}>
      <Text style={styles.successEmoji}>{plantEmoji}</Text>
      <Text style={styles.successTitle}>¡Confirmado!</Text>
      <Text style={styles.successBody}>La planta <Text style={{ fontWeight: '700' }}>{info?.plantName}</Text> de {info?.userName} creció hoy. 🌱</Text>
      <View style={styles.daysBadge}><Text style={styles.daysBadgeText}>Día {info?.daysCount} 🔥</Text></View>
      <Text style={styles.redirectNote}>Volviendo al inicio en 3 segundos…</Text>
      <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)')}><Text style={styles.backBtnText}>Volver al inicio →</Text></Pressable>
    </View>
  );
  if (screenState === 'uncertain') return (
    <View style={styles.successContainer}>
      <Text style={styles.successEmoji}>🤝</Text>
      <Text style={styles.successTitle}>Gracias por tu honestidad</Text>
      <Text style={styles.successBody}>{info?.userName} sabrá que hoy no pudiste confirmar.</Text>
      <Text style={styles.redirectNote}>Volviendo al inicio en 3 segundos…</Text>
      <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)')}><Text style={styles.backBtnText}>Volver al inicio →</Text></Pressable>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.logo}>🌿 Verdant</Text>
      <View style={styles.plantHeader}>
        <Text style={styles.plantEmoji}>{plantEmoji}</Text>
        <View><Text style={styles.title}>Confirma el día de {info?.userName}</Text><Text style={styles.subtitle}>Día {info?.daysCount} · {info?.plantName}</Text></View>
      </View>
      <Text style={styles.questionLabel}>¿Cómo fue hoy?</Text>
      {info?.frictionOptions.map(opt => (
        <Pressable key={opt} style={[styles.option, selected === opt && styles.optionSelected]} onPress={() => setSelected(opt)} accessibilityRole="radio" accessibilityState={{ checked: selected === opt }}>
          <View style={[styles.radio, selected === opt && styles.radioSelected]} />
          <Text style={[styles.optionText, selected === opt && styles.optionTextSelected]}>{opt}</Text>
        </Pressable>
      ))}
      <Pressable style={[styles.btnPrimary, (!selected || screenState === 'submitting') && styles.btnDisabled]} onPress={handleConfirm} disabled={!selected || screenState === 'submitting'} accessibilityLabel="Confirmar respuesta">
        {screenState === 'submitting' ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Confirmar</Text>}
      </Pressable>
      <Text style={styles.disclaimer}>Este enlace expira a medianoche de hoy. No necesitas crear una cuenta.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.lg },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
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
  option: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 2, borderColor: Colors.warm },
  optionSelected: { borderColor: Colors.green500, backgroundColor: Colors.green50 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.textSoft },
  radioSelected: { borderColor: Colors.green500, backgroundColor: Colors.green500 },
  optionText: { ...Typography.bodyMedium, color: Colors.textMid, flex: 1 },
  optionTextSelected: { color: Colors.textDark, fontWeight: '600' },
  btnPrimary: { backgroundColor: Colors.green800, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { ...Typography.labelLarge, color: Colors.white },
  disclaimer: { ...Typography.caption, color: Colors.textSoft, textAlign: 'center' },
  successContainer: { flex: 1, backgroundColor: Colors.green50, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  successEmoji: { fontSize: 72 },
  successTitle: { ...Typography.displayMedium, color: Colors.green800 },
  successBody: { ...Typography.bodyLarge, color: Colors.textMid, textAlign: 'center', lineHeight: 26 },
  daysBadge: { backgroundColor: Colors.green500, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  daysBadgeText: { ...Typography.labelLarge, color: Colors.white },
  redirectNote: { ...Typography.caption, color: Colors.textSoft, textAlign: 'center' },
  backBtn: { backgroundColor: Colors.green800, borderRadius: Radius.md, paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.xl, alignItems: 'center' },
  backBtnText: { ...Typography.labelLarge, color: Colors.white },
});
