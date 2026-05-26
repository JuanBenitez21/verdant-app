import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { getScoreLevel } from '@verdant/shared';

const T = ScreenTheme.light;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Metrics {
  activeUsers: number;
  avgScore: number;
  totalDaysClean: number;
  estimatedRoiCop: number;
}

interface UserRow {
  id: string;
  fullName: string;
  plantName: string;
  diasRacha: number;
  diasTotales: number;
  score: number;
  scoreLabel: string;
}

interface Alert {
  userId: string;
  userName: string;
  date: string;
  totalScore: number;
  wearableTotal: number;
  socialTotal: number;
  diff: number;
  severity: 'alta' | 'media';
}

export default function AdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertDetail, setAlertDetail] = useState<Alert | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { router.replace('/(auth)/login'); return; }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [mRes, uRes, aRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/metrics`, { headers }),
        fetch(`${API_URL}/api/admin/users`, { headers }),
        fetch(`${API_URL}/api/admin/alerts`, { headers }),
      ]);

      const [mJson, uJson, aJson] = await Promise.all([mRes.json(), uRes.json(), aRes.json()]) as [
        { success: boolean; data?: Metrics },
        { success: boolean; data?: UserRow[] },
        { success: boolean; data?: Alert[] },
      ];

      if (mJson.success && mJson.data) setMetrics(mJson.data);
      if (uJson.success && uJson.data) setUsers(uJson.data);
      if (aJson.success && aJson.data) setAlerts(aJson.data);
    } catch (e) {
      console.error('[admin]', e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.green500} />
        <Text style={styles.loadingText}>Cargando panel…</Text>
      </SafeAreaView>
    );
  }

  const TRM = 4200;
  const roiUsd = metrics ? Math.round(metrics.estimatedRoiCop / TRM) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Panel Admin</Text>
            <Text style={styles.pageSubtitle}>Vista institucional</Text>
          </View>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </Pressable>
        </View>

        {/* SECCIÓN 1 — Métricas grid 2×2 */}
        <Text style={styles.sectionTitle}>Métricas del mes</Text>
        <View style={styles.metricsGrid}>
          <MetricTile label="Usuarios activos" value={String(metrics?.activeUsers ?? 0)} emoji="👥" />
          <MetricTile label="Score promedio" value={`${metrics?.avgScore ?? 0} pts`} emoji="📊" />
          <MetricTile label="Días sin fumar" value={String(metrics?.totalDaysClean ?? 0)} emoji="🌿" />
          <MetricTile label="ROI estimado" value={formatCOP(metrics?.estimatedRoiCop ?? 0)} emoji="💰" />
        </View>

        {/* SECCIÓN 4 — ROI detallado */}
        <View style={styles.roiCard}>
          <Text style={styles.roiAmount}>{formatCOP(metrics?.estimatedRoiCop ?? 0)}</Text>
          <Text style={styles.roiBase}>
            Basado en ${roiUsd.toLocaleString()} USD/empleado/año · {metrics?.activeUsers ?? 0} usuarios activos · TRM $4.200
          </Text>
          <View style={styles.roiBreakdown}>
            <RoiLine label="Ausentismo reducido" pct={45} />
            <RoiLine label="Productividad" pct={35} />
            <RoiLine label="Costos de salud" pct={20} />
          </View>
        </View>

        {/* SECCIÓN 2 — Tabla de usuarios */}
        <Text style={styles.sectionTitle}>Usuarios ({users.length})</Text>
        {users.length === 0 ? (
          <EmptyState emoji="👤" message="No hay usuarios registrados aún" />
        ) : (
          users.map(u => <UserRow key={u.id} user={u} />)
        )}

        {/* SECCIÓN 3 — Alertas de incoherencia */}
        <Text style={styles.sectionTitle}>
          Alertas de incoherencia {alerts.length > 0 && <Text style={styles.alertBadge}>  {alerts.length}</Text>}
        </Text>
        {alerts.length === 0 ? (
          <EmptyState emoji="✅" message="Sin alertas este mes" />
        ) : (
          alerts.map((alert, i) => (
            <Pressable key={i} style={styles.alertRow} onPress={() => setAlertDetail(alertDetail?.userId === alert.userId ? null : alert)}>
              <View style={[styles.alertDot, { backgroundColor: alert.severity === 'alta' ? Colors.rose : Colors.amber }]} />
              <View style={styles.alertInfo}>
                <Text style={styles.alertName}>{alert.userName}</Text>
                <Text style={styles.alertDesc}>
                  Diferencia de {alert.diff} pts entre wearable ({alert.wearableTotal}) y social ({alert.socialTotal})
                </Text>
                <Text style={styles.alertDate}>{alert.date}</Text>
              </View>
              <Pressable style={styles.reviewBtn} onPress={() => setAlertDetail(alertDetail?.userId === alert.userId ? null : alert)}>
                <Text style={styles.reviewBtnText}>Revisar</Text>
              </Pressable>
            </Pressable>
          ))
        )}

        {alertDetail && (
          <View style={styles.alertDetail}>
            <Text style={styles.alertDetailTitle}>Detalle — {alertDetail.userName}</Text>
            <Text style={styles.alertDetailRow}>Fecha: {alertDetail.date}</Text>
            <Text style={styles.alertDetailRow}>Score total: {alertDetail.totalScore} pts</Text>
            <Text style={styles.alertDetailRow}>Wearable: {alertDetail.wearableTotal} pts</Text>
            <Text style={styles.alertDetailRow}>Social (padrino + auto): {alertDetail.socialTotal} pts</Text>
            <Text style={[styles.alertDetailRow, { color: alertDetail.severity === 'alta' ? Colors.rose : Colors.amber }]}>
              Severidad: {alertDetail.severity.toUpperCase()} (Δ {alertDetail.diff} pts)
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View style={tileStyles.card}>
      <Text style={tileStyles.emoji}>{emoji}</Text>
      <Text style={tileStyles.value}>{value}</Text>
      <Text style={tileStyles.label}>{label}</Text>
    </View>
  );
}

function UserRow({ user }: { user: UserRow }) {
  const initials = user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const scoreWidth = `${user.score}%` as const;

  return (
    <View style={userRowStyles.row}>
      <View style={userRowStyles.avatar}>
        <Text style={userRowStyles.initials}>{initials}</Text>
      </View>
      <View style={userRowStyles.info}>
        <Text style={userRowStyles.name}>{user.fullName.split(' ')[0]} {user.fullName.split(' ')[1]?.[0] ?? ''}.</Text>
        <View style={userRowStyles.barTrack}>
          <View style={[userRowStyles.barFill, { width: scoreWidth }]} />
        </View>
        <Text style={userRowStyles.sub}>{user.scoreLabel} · Racha: {user.diasRacha}d</Text>
      </View>
      <View style={[userRowStyles.badge, { backgroundColor: getBadgeColor(user.scoreLabel) }]}>
        <Text style={userRowStyles.badgeText}>{getBadgeLabel(user.scoreLabel)}</Text>
      </View>
    </View>
  );
}

function RoiLine({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={styles.roiLine}>
      <Text style={styles.roiLineLabel}>{label}</Text>
      <Text style={styles.roiLinePct}>{pct}%</Text>
    </View>
  );
}

function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function getBadgeColor(label: string): string {
  if (label.includes('premium')) return Colors.green500;
  if (label.includes('intermedio')) return Colors.green300;
  if (label.includes('básico') || label.includes('basico')) return Colors.green100;
  return Colors.warm;
}
function getBadgeLabel(label: string): string {
  if (label.includes('premium')) return 'Premium';
  if (label.includes('intermedio')) return 'Intermedio';
  if (label.includes('básico') || label.includes('basico')) return 'Básico';
  return 'Sin nivel';
}
function formatCOP(n: number): string {
  return `$${Math.round(n).toLocaleString('es-CO')}`;
}

const tileStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.warm,
  },
  emoji: { fontSize: 28 },
  value: { ...Typography.displaySmall, color: Colors.textDark },
  label: { ...Typography.bodySmall, color: Colors.textSoft, textAlign: 'center' },
});

const userRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warm,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...Typography.labelSmall, color: Colors.green800 },
  info: { flex: 1, gap: 2 },
  name: { ...Typography.labelLarge, color: Colors.textDark },
  barTrack: { height: 4, backgroundColor: Colors.warm, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.green400, borderRadius: Radius.full },
  sub: { ...Typography.caption, color: Colors.textSoft },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...Typography.caption, color: Colors.textDark, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  loadingText: { ...Typography.bodyMedium, color: Colors.textSoft },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { ...Typography.displaySmall, color: Colors.textDark },
  pageSubtitle: { ...Typography.bodySmall, color: Colors.textSoft },
  backBtn: {
    backgroundColor: Colors.warm,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  backBtnText: { ...Typography.labelSmall, color: Colors.textMid },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textDark, marginBottom: -Spacing.xs },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  roiCard: {
    backgroundColor: Colors.green50,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.green200,
  },
  roiAmount: { ...Typography.displayMedium, color: Colors.green500, textAlign: 'center' },
  roiBase: { ...Typography.bodySmall, color: Colors.textSoft, textAlign: 'center' },
  roiBreakdown: { gap: Spacing.xs, marginTop: Spacing.xs },
  roiLine: { flexDirection: 'row', justifyContent: 'space-between' },
  roiLineLabel: { ...Typography.bodySmall, color: Colors.textMid },
  roiLinePct: { ...Typography.labelSmall, color: Colors.green500 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warm,
    marginBottom: Spacing.sm,
  },
  alertDot: { width: 10, height: 10, borderRadius: 5 },
  alertInfo: { flex: 1, gap: 2 },
  alertName: { ...Typography.labelLarge, color: Colors.textDark },
  alertDesc: { ...Typography.bodySmall, color: Colors.textMid },
  alertDate: { ...Typography.caption, color: Colors.textSoft },
  alertBadge: { ...Typography.labelSmall, color: Colors.rose },
  reviewBtn: {
    backgroundColor: Colors.warm,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  reviewBtnText: { ...Typography.caption, color: Colors.textMid },
  alertDetail: {
    backgroundColor: Colors.amberLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.amber,
    marginTop: -Spacing.sm,
  },
  alertDetailTitle: { ...Typography.labelLarge, color: Colors.textDark, marginBottom: Spacing.xs },
  alertDetailRow: { ...Typography.bodySmall, color: Colors.textMid },
  emptyState: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 36 },
  emptyText: { ...Typography.bodyMedium, color: Colors.textSoft, textAlign: 'center' },
});
