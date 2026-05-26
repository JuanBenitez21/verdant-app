import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { usePlantaStore } from '@/store/planta.store';
import { useAuth } from '@/hooks/useAuth';
import { useRacha } from '@/hooks/useRacha';
import { useScore } from '@/hooks/useScore';
import { supabase } from '@/services/supabase';
import { calcularAhorro, formatCOP } from '@/utils/ahorro';
import { getFunFactForMilestone } from '@/constants/funfacts';
import { PlantaAnimada } from '@/components/planta/PlantaAnimada';
import { FunFactSheet } from '@/components/funfact/FunFactSheet';
import type { PlantType } from '@verdant/shared';

const T = ScreenTheme.dark;

interface UserProfile {
  full_name: string;
  plant_type: string;
  plant_name: string;
  cigarettes_per_day: number;
  price_per_pack: number;
}

export default function DashboardScreen() {
  const { currentStage, setPlant } = usePlantaStore();
  const { signOut } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [funFactVisible, setFunFactVisible] = useState(false);

  const previousDiasRef = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.id ?? null;
      setUserId(id);
      if (!id) return;

      supabase
        .from('users')
        .select('full_name, plant_type, plant_name, cigarettes_per_day, price_per_pack')
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setProfile(data as UserProfile);
            setPlant(data.plant_type as PlantType, data.plant_name);
          }
        });
    });
  }, []);

  const racha = useRacha(userId);
  const { score, scoreLevel, cargarScore } = useScore();

  // Carga racha y score al montar
  useEffect(() => {
    racha.cargarRacha();
    cargarScore();
  }, [userId]);

  async function handleReportarDia() {
    previousDiasRef.current = racha.diasTotales;

    const result = await racha.reportarDiaLimpio();

    if (result) {
      const milestone = getFunFactForMilestone(result.daysCount);
      if (milestone) {
        setFunFactVisible(true);
      } else {
        Alert.alert('¡Día reportado! 🌱', 'Tu padrino recibirá un email para confirmar tu día.');
      }
      cargarScore();
    } else if (racha.error) {
      Alert.alert('Error', racha.error);
    }
  }

  function handleSignOut() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'amigo';
  const ahorro = calcularAhorro({
    streakDays: racha.diasTotales,
    cigarettesPerDay: profile?.cigarettes_per_day ?? 10,
    pricePerPack: profile?.price_per_pack ?? 9000,
  });

  const streakLabel = racha.diasTotales === 0
    ? 'Día 1 — empieza hoy'
    : `🔥 ${racha.diasTotales} ${racha.diasTotales === 1 ? 'día' : 'días'}`;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Encabezado */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Salir</Text>
          </Pressable>
        </View>

        {/* Planta — hero principal */}
        <View style={styles.plantCard}>
          <PlantaAnimada
            diasTotales={racha.diasTotales}
            previousDias={previousDiasRef.current}
          />
          <Text style={styles.plantName}>{profile?.plant_name ?? 'Mi planta'}</Text>
          <Text style={styles.plantStage}>{currentStage.label}</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{streakLabel}</Text>
          </View>
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          <MetricCard label="Ahorrado" value={formatCOP(ahorro.ahorrosCOP)} sub="en total" />
          <MetricCard label="Cigarrillos" value={String(ahorro.cigarrillosEvitados)} sub="evitados" />
        </View>

        {/* Botón principal */}
        {racha.puedeReportarHoy ? (
          <Pressable
            style={[styles.reportBtn, racha.isReporting && styles.reportBtnDisabled]}
            onPress={handleReportarDia}
            disabled={racha.isReporting}
          >
            {racha.isReporting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.reportBtnText}>✅ Reportar Día Limpio</Text>
                <Text style={styles.reportBtnSub}>Tu padrino recibirá una confirmación</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.reportedBtn}>
            <Text style={styles.reportedBtnText}>Ya reportaste hoy ✓</Text>
            <Text style={styles.reportedBtnSub}>Tu padrino tiene hasta medianoche para confirmar</Text>
          </View>
        )}

        {/* Score Verdant */}
        <ScoreCard score={scoreLevel.total} label={scoreLevel.label} reward={scoreLevel.reward} />
      </ScrollView>

      <FunFactSheet
        diasTotales={racha.diasTotales}
        visible={funFactVisible}
        onClose={() => setFunFactVisible(false)}
      />
    </>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={metricStyles.card}>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={metricStyles.value}>{value}</Text>
      <Text style={metricStyles.sub}>{sub}</Text>
    </View>
  );
}

function ScoreCard({ score, label, reward }: { score: number; label: string; reward: string | null }) {
  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(score, { duration: 800 });
  }, [score]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%` as `${number}%`,
  }));

  return (
    <View style={scoreStyles.card}>
      <View style={scoreStyles.header}>
        <Text style={scoreStyles.label}>Score Verdant</Text>
        <Text style={scoreStyles.value}>{score} pts</Text>
      </View>
      <View style={scoreStyles.barTrack}>
        <Animated.View style={[scoreStyles.barFill, barStyle]} />
      </View>
      <View style={scoreStyles.footer}>
        <Text style={scoreStyles.levelLabel}>{label}</Text>
        {reward && <Text style={scoreStyles.reward}>🎁 {reward}</Text>}
      </View>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: { ...Typography.labelSmall, color: Colors.green200, textTransform: 'uppercase' },
  value: { ...Typography.displaySmall, color: Colors.white, marginTop: 4 },
  sub: { ...Typography.caption, color: Colors.green300 },
});

const scoreStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { ...Typography.labelSmall, color: Colors.green200, textTransform: 'uppercase' },
  value: { ...Typography.displaySmall, color: Colors.white },
  barTrack: {
    height: 8,
    backgroundColor: Colors.green700,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.green300,
    borderRadius: Radius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelLabel: { ...Typography.bodySmall, color: Colors.green300 },
  reward: { ...Typography.bodySmall, color: Colors.amber },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { ...Typography.displaySmall, color: Colors.white },
  date: { ...Typography.bodyMedium, color: Colors.green200, textTransform: 'capitalize' },
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  signOutText: { ...Typography.labelSmall, color: Colors.green200 },
  plantCard: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.green700,
  },
  plantName: { ...Typography.displayMedium, color: Colors.white },
  plantStage: { ...Typography.bodyMedium, color: Colors.green200 },
  streakBadge: {
    backgroundColor: Colors.green700,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  streakText: { ...Typography.labelSmall, color: Colors.green300 },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm },
  reportBtn: {
    backgroundColor: Colors.green400,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reportBtnDisabled: { opacity: 0.7 },
  reportBtnText: { ...Typography.labelLarge, color: Colors.white, fontSize: 17 },
  reportBtnSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  reportedBtn: {
    backgroundColor: Colors.green700,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    gap: Spacing.xs,
    opacity: 0.8,
  },
  reportedBtnText: { ...Typography.labelLarge, color: Colors.green200, fontSize: 17 },
  reportedBtnSub: { ...Typography.caption, color: Colors.green300 },
});
