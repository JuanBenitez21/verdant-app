import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView,
  Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/services/supabase';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { getPlantStage } from '@/constants/plants';
import { getScoreLevel } from '@verdant/shared';
import { calcularAhorro, formatCOP } from '@/utils/ahorro';

const T = ScreenTheme.dark;
const ONBOARDING_KEY = 'onboarding_completed';

interface Profile {
  full_name: string; plant_name: string; plant_type: string;
  cigarettes_per_day: number; price_per_pack: number;
  role: string; institution_id: string | null; godparent_email: string | null; created_at: string;
}

export default function PerfilScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [institutionName, setInstitutionName] = useState('');
  const [email, setEmail] = useState('');
  const [diasTotales, setDiasTotales] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    setEmail(session.user.email ?? '');

    const { data: prof } = await supabase
      .from('users')
      .select('full_name, plant_name, plant_type, cigarettes_per_day, price_per_pack, role, institution_id, godparent_email, created_at')
      .eq('id', session.user.id).maybeSingle();

    if (prof) {
      setProfile(prof as Profile);
      if ((prof as Profile).institution_id) {
        const { data: inst } = await supabase.from('institutions').select('name').eq('id', (prof as Profile).institution_id!).maybeSingle();
        if (inst) setInstitutionName((inst as { name: string }).name);
      }
    }

    const [{ count: dias }, { count: logros }, { data: scoreRow }] = await Promise.all([
      supabase.from('streaks').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('godparent_confirmed', true).eq('relapse', false),
      supabase.from('achievements').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
      supabase.from('scores').select('total_score').eq('user_id', session.user.id).order('date', { ascending: false }).limit(1).maybeSingle(),
    ]);

    setDiasTotales(dias ?? 0);
    setAchievementsCount(logros ?? 0);
    setScore((scoreRow?.total_score as number | null) ?? 0);
    setLoading(false);
  }

  async function handleSignOut() {
    Alert.alert('¿Cerrar sesión?', 'Tu progreso está guardado en la nube', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
      }},
    ]);
  }

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={Colors.green400} /></SafeAreaView>;
  }

  const initials = profile?.full_name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';
  const stage = getPlantStage(diasTotales);
  const level = getScoreLevel(score);
  const diasEnPrograma = profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86_400_000) : 0;
  const ahorro = calcularAhorro({ streakDays: diasTotales, cigarettesPerDay: profile?.cigarettes_per_day ?? 10, pricePerPack: profile?.price_per_pack ?? 9000 });
  const nextMilestone = [1, 3, 7, 15, 30, 60].find(d => diasTotales < d) ?? 60;
  const progressPct = Math.min((diasTotales / nextMilestone) * 100, 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* SECCIÓN 1 — Header */}
        <View style={styles.headerSection} accessibilityRole="header">
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
          <Text style={styles.name}>{profile?.full_name ?? 'Usuario'}</Text>
          <Text style={styles.institutionText}>{institutionName || email}</Text>
          <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>🌸 {level.label}</Text></View>
        </View>

        {/* SECCIÓN 2 — Stats 2x2 */}
        <View style={styles.statsGrid}>
          <StatCell emoji="📅" label="En el programa" value={`${diasEnPrograma}d`} />
          <StatCell emoji="✅" label="Días limpios" value={String(diasTotales)} />
          <StatCell emoji="💰" label="Ahorrado" value={formatCOP(ahorro.ahorrosCOP)} />
          <StatCell emoji="🏆" label="Logros" value={String(achievementsCount)} />
        </View>

        {/* SECCIÓN 3 — Mi planta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mi planta</Text>
          <View style={styles.plantRow}>
            <Text style={styles.plantEmoji}>{stage.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.plantName}>{profile?.plant_name ?? 'Mi planta'}</Text>
              <Text style={styles.plantStage}>Etapa: {stage.label} · Día {diasTotales}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as `${number}%` }]} />
          </View>
          <Text style={styles.progressLabel}>Próxima etapa: día {nextMilestone}</Text>
        </View>

        {/* SECCIÓN 4 — Configuración */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configuración</Text>
          <ConfigRow label="Cambiar contraseña" onPress={() => router.push('/forgot-password' as never)} />
          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Notificaciones</Text>
            <Switch value={notifEnabled} onValueChange={setNotifEnabled} trackColor={{ false: Colors.green800, true: Colors.green400 }} thumbColor={Colors.white} accessibilityLabel="Activar o desactivar notificaciones" />
          </View>
          <ConfigRow label="Mi padrino" subtitle={profile?.godparent_email ?? 'Sin padrino asignado'} />
          <ConfigRow label="Institución" subtitle={institutionName || 'Sin institución'} disabled />
          <ConfigRow label="Política de privacidad" onPress={() => router.push('/privacidad' as never)} />
          <ConfigRow label="Términos de uso" onPress={() => router.push('/terminos' as never)} />
        </View>

        {profile?.role === 'admin' && (
          <Pressable style={styles.adminBtn} onPress={() => router.push('/admin')} accessibilityLabel="Panel de administrador">
            <Text style={styles.adminBtnText}>⚙️ Panel de administrador →</Text>
          </Pressable>
        )}

        {/* SECCIÓN 5 — Zona peligrosa */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut} accessibilityLabel="Cerrar sesión de Verdant" accessibilityRole="button">
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>

        {__DEV__ && (
          <Pressable style={styles.devBtn} onPress={async () => {
            await SecureStore.deleteItemAsync(ONBOARDING_KEY);
            Alert.alert('Onboarding reseteado', 'Reinicia la app para ver los slides');
          }}>
            <Text style={styles.devBtnText}>🧪 Reset onboarding</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={statStyles.cell}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function ConfigRow({ label, subtitle, onPress, disabled }: { label: string; subtitle?: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable style={styles.configRow} onPress={onPress} disabled={disabled} accessibilityLabel={label} accessibilityRole={onPress ? 'button' : 'text'}>
      <View style={{ flex: 1 }}>
        <Text style={styles.configLabel}>{label}</Text>
        {subtitle && <Text style={styles.configSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && !disabled && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const statStyles = StyleSheet.create({
  cell: { width: '48%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  emoji: { fontSize: 24 },
  value: { ...Typography.displaySmall, color: Colors.white, fontSize: 20 },
  label: { ...Typography.caption, color: Colors.green200, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.lg },
  headerSection: { alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.green700, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.green500 },
  initials: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 30, color: Colors.green100 },
  name: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: Colors.white },
  institutionText: { ...Typography.bodySmall, color: Colors.textSoft },
  levelBadge: { backgroundColor: 'rgba(94,194,135,0.15)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: Colors.green500 },
  levelBadgeText: { ...Typography.labelSmall, color: Colors.green300 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'space-between' },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { ...Typography.labelSmall, color: Colors.green200, textTransform: 'uppercase' },
  plantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  plantEmoji: { fontSize: 48 },
  plantName: { ...Typography.labelLarge, color: Colors.white },
  plantStage: { ...Typography.bodySmall, color: Colors.green200, marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: Colors.green800, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.green300, borderRadius: Radius.full },
  progressLabel: { ...Typography.caption, color: Colors.green300 },
  configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  configLabel: { ...Typography.bodyMedium, color: Colors.white },
  configSubtitle: { ...Typography.caption, color: Colors.textSoft, marginTop: 2 },
  chevron: { ...Typography.bodyLarge, color: Colors.green300, fontSize: 22 },
  adminBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  adminBtnText: { ...Typography.labelLarge, color: Colors.green200 },
  signOutBtn: { borderWidth: 1.5, borderColor: Colors.rose, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  signOutText: { ...Typography.labelLarge, color: Colors.rose },
  devBtn: { backgroundColor: 'rgba(212,130,10,0.1)', borderRadius: Radius.md, paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.amber },
  devBtnText: { ...Typography.labelSmall, color: Colors.amber },
});
