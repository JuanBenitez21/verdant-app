import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { getPlantStage } from '@/constants/plants';
import { getScoreLevel } from '@verdant/shared';

const T = ScreenTheme.dark;

interface Profile {
  full_name: string;
  plant_name: string;
  plant_type: string;
  cigarettes_per_day: number;
  role: string;
  institution_id: string | null;
}

export default function PerfilScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [diasTotales, setDiasTotales] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    setEmail(session.user.email ?? '');

    const { data: prof } = await supabase
      .from('users')
      .select('full_name, plant_name, plant_type, cigarettes_per_day, role, institution_id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (prof) setProfile(prof as Profile);

    const { count } = await supabase
      .from('streaks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('godparent_confirmed', true)
      .eq('relapse', false);

    setDiasTotales(count ?? 0);

    const { data: scoreRow } = await supabase
      .from('scores')
      .select('total_score')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    setScore((scoreRow?.total_score as number | null) ?? 0);
    setLoading(false);
  }

  async function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.green400} />
      </SafeAreaView>
    );
  }

  const initials = profile?.full_name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';
  const stage = getPlantStage(diasTotales);
  const level = getScoreLevel(score);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name ?? 'Usuario'}</Text>
          <Text style={styles.email}>{email}</Text>
          {__DEV__ && (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>🧪 Modo dev</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Días sin fumar" value={String(diasTotales)} emoji="🌿" />
          <StatCard label="Score" value={`${score} pts`} emoji="📊" />
          <StatCard label="Nivel" value={level.label.replace('Nivel ', '')} emoji="⭐" />
        </View>

        {/* Planta */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu planta</Text>
          <View style={styles.plantRow}>
            <Text style={styles.plantEmoji}>{stage.emoji}</Text>
            <View>
              <Text style={styles.plantName}>{profile?.plant_name ?? 'Mi planta'}</Text>
              <Text style={styles.plantStage}>{stage.label}</Text>
            </View>
          </View>
        </View>

        {/* Score Verdant */}
        {level.reward && (
          <View style={styles.rewardCard}>
            <Text style={styles.rewardEmoji}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardTitle}>Recompensa desbloqueada</Text>
              <Text style={styles.rewardValue}>{level.reward}</Text>
            </View>
          </View>
        )}

        {/* Admin link */}
        {profile?.role === 'admin' && (
          <Pressable style={styles.adminBtn} onPress={() => router.push('/admin')}>
            <Text style={styles.adminBtnText}>⚙️ Panel de administrador →</Text>
          </Pressable>
        )}

        {/* Cerrar sesión */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: { fontSize: 24 },
  value: { ...Typography.labelLarge, color: Colors.white, fontSize: 16 },
  label: { ...Typography.caption, color: Colors.green200, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  avatarSection: { alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.green700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.green500,
  },
  initials: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, color: Colors.white },
  name: { ...Typography.displaySmall, color: Colors.white },
  email: { ...Typography.bodySmall, color: Colors.green200 },
  devBadge: {
    backgroundColor: Colors.amber,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  devBadgeText: { ...Typography.caption, color: Colors.white },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { ...Typography.labelSmall, color: Colors.green200, textTransform: 'uppercase' },
  plantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  plantEmoji: { fontSize: 40 },
  plantName: { ...Typography.labelLarge, color: Colors.white },
  plantStage: { ...Typography.bodySmall, color: Colors.green200 },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(212, 130, 10, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.amber,
  },
  rewardEmoji: { fontSize: 32 },
  rewardTitle: { ...Typography.labelSmall, color: Colors.amber, textTransform: 'uppercase' },
  rewardValue: { ...Typography.bodyMedium, color: Colors.white, marginTop: 2 },
  adminBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  adminBtnText: { ...Typography.labelLarge, color: Colors.green200 },
  signOutBtn: {
    backgroundColor: Colors.rose,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  signOutText: { ...Typography.labelLarge, color: Colors.white },
});
