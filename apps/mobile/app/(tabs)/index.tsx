import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { usePlantaStore } from '@/store/planta.store';
import { useAuthStore } from '@/store/auth.store';
import { calcularAhorro, formatCOP } from '@/utils/ahorro';

const T = ScreenTheme.dark;

export default function DashboardScreen() {
  const { currentStage, plantName, plantType, streakDays } = usePlantaStore();
  const { user } = useAuthStore();

  const ahorro = calcularAhorro({
    streakDays,
    cigarettesPerDay: user?.cigarettesPerDay ?? 10,
    pricePerPack: user?.pricePerPack ?? 9000,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.fullName?.split(' ')[0] ?? 'amigo'} 👋</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Planta — hero principal */}
      <View style={styles.plantCard}>
        <Text style={styles.plantEmoji}>{currentStage.emoji}</Text>
        <Text style={styles.plantName}>{plantName}</Text>
        <Text style={styles.plantStage}>{currentStage.label}</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{streakDays} días de racha</Text>
        </View>
      </View>

      {/* Métricas */}
      <View style={styles.metricsRow}>
        <MetricCard label="Ahorrado" value={formatCOP(ahorro.ahorrosCOP)} sub="en total" />
        <MetricCard label="Cigarrillos" value={String(ahorro.cigarrillosEvitados)} sub="evitados" />
      </View>

      {/* Acción principal — Reportar día limpio */}
      <Pressable style={styles.reportBtn}>
        <Text style={styles.reportBtnText}>✅ Reportar Día Limpio</Text>
        <Text style={styles.reportBtnSub}>Tu padrino recibirá una confirmación</Text>
      </Pressable>

      {/* Score Verdant */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Score Verdant</Text>
        <Text style={styles.scoreValue}>—</Text>
        <Text style={styles.scoreSubtext}>Completa tu primer día para ver tu score</Text>
      </View>
    </ScrollView>
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
  label: {
    ...Typography.labelSmall,
    color: Colors.green200,
    textTransform: 'uppercase',
  },
  value: {
    ...Typography.displaySmall,
    color: Colors.white,
    marginTop: 4,
  },
  sub: {
    ...Typography.caption,
    color: Colors.green300,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  greeting: {
    ...Typography.displaySmall,
    color: Colors.white,
  },
  date: {
    ...Typography.bodyMedium,
    color: Colors.green200,
    textTransform: 'capitalize',
  },
  plantCard: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.green700,
  },
  plantEmoji: {
    fontSize: 72,
  },
  plantName: {
    ...Typography.displayMedium,
    color: Colors.white,
  },
  plantStage: {
    ...Typography.bodyMedium,
    color: Colors.green200,
  },
  streakBadge: {
    backgroundColor: Colors.green700,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.xs,
  },
  streakText: {
    ...Typography.labelSmall,
    color: Colors.green300,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reportBtn: {
    backgroundColor: Colors.green400,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reportBtnText: {
    ...Typography.labelLarge,
    color: Colors.white,
    fontSize: 17,
  },
  reportBtnSub: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  scoreCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  scoreLabel: {
    ...Typography.labelSmall,
    color: Colors.green200,
    textTransform: 'uppercase',
  },
  scoreValue: {
    ...Typography.displayMedium,
    color: Colors.white,
  },
  scoreSubtext: {
    ...Typography.bodySmall,
    color: Colors.green300,
    textAlign: 'center',
  },
});
