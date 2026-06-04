import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  RefreshControl, useWindowDimensions,
} from 'react-native';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { supabase } from '@/services/supabase';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { FadeInView } from '@/components/ui/FadeInView';

const T = ScreenTheme.light;

const ROADMAP_MILESTONES = [1, 7, 30, 60, 100] as const;

const MEDALS = [
  { key: 'day_1',   days: 1,   emoji: '🥇', label: 'Primer día' },
  { key: 'day_3',   days: 3,   emoji: '🌱', label: 'Tres días' },
  { key: 'day_7',   days: 7,   emoji: '💪', label: 'Una semana' },
  { key: 'day_15',  days: 15,  emoji: '🌿', label: 'Dos semanas' },
  { key: 'day_30',  days: 30,  emoji: '🌸', label: 'Un mes' },
  { key: 'day_60',  days: 60,  emoji: '🌺', label: 'Dos meses' },
  { key: 'day_100', days: 100, emoji: '👑', label: '100 días' },
] as const;

export default function LogrosScreen() {
  const { width } = useWindowDimensions();
  const [earnedKeys, setEarnedKeys] = useState<Set<string>>(new Set());
  const [diasTotales, setDiasTotales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ancho de tarjeta = (pantalla - padding*2 - gaps) / 3 columnas
  const PADDING = Spacing.lg * 2;
  const GAP = Spacing.sm;
  const cardWidth = Math.floor((width - PADDING - GAP * 2) / 3);

  const cargar = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const [{ data: achievements, error: achErr }, { count, error: stErr }] = await Promise.all([
        supabase.from('achievements').select('achievement_key').eq('user_id', userId),
        supabase
          .from('streaks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('godparent_confirmed', true)
          .eq('relapse', false),
      ]);

      if (achErr) console.warn('[logros] achievements:', achErr.message);
      if (stErr)  console.warn('[logros] streaks:', stErr.message);

      setEarnedKeys(new Set((achievements ?? []).map(a => a.achievement_key as string)));
      setDiasTotales(count ?? 0);
    } catch (e) {
      console.warn('[logros] Error cargando logros:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleRefresh() {
    setRefreshing(true);
    await cargar();
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <SkeletonLoader width={200} height={32} />
          <SkeletonLoader width={130} height={20} />
          <SkeletonLoader width="100%" height={110} borderRadius={18} />
          <View style={styles.medalGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonLoader key={i} width={cardWidth} height={100} borderRadius={Radius.md} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.green500} />
        }
      >
        <Text style={styles.title}>Tus logros</Text>
        <Text style={styles.subtitle}>
          {diasTotales === 0 ? 'Reporta tu primer día limpio' : `${diasTotales} ${diasTotales === 1 ? 'día' : 'días'} sin fumar`}
        </Text>

        {/* Roadmap de hitos */}
        <View style={styles.roadmapCard}>
          <Text style={styles.sectionTitle}>Hitos</Text>
          <View style={styles.roadmap}>
            {ROADMAP_MILESTONES.map((milestone, i) => {
              const earned = earnedKeys.has(`day_${milestone}`);
              const isCurrent = !earned && diasTotales < milestone &&
                (i === 0 || diasTotales >= ROADMAP_MILESTONES[i - 1]!);

              return (
                <React.Fragment key={milestone}>
                  <View style={styles.milestoneItem}>
                    <View style={[
                      styles.milestoneCircle,
                      earned && styles.milestoneEarned,
                      isCurrent && styles.milestoneCurrent,
                    ]}>
                      <Text style={[
                        styles.milestoneIcon,
                        isCurrent && styles.milestoneIconCurrent,
                      ]}>
                        {earned ? '✓' : isCurrent ? (diasTotales > 0 ? String(diasTotales) : '→') : '🔒'}
                      </Text>
                    </View>
                    <Text style={[styles.milestoneLabel, earned && styles.milestoneLabelEarned]}>
                      Día {milestone}
                    </Text>
                  </View>
                  {i < ROADMAP_MILESTONES.length - 1 && (
                    <View style={[styles.roadmapLine, earned && styles.roadmapLineEarned]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Grid de medallas — ancho en píxeles para evitar desbordamiento con gap */}
        <Text style={styles.sectionTitle}>Medallas</Text>
        <View style={styles.medalGrid}>
          {MEDALS.map((medal, i) => {
            const earned = earnedKeys.has(medal.key);
            return (
              <FadeInView key={medal.key} delay={i * 50} style={{ width: cardWidth }}>
                <View style={[styles.medalCard, earned ? styles.medalCardEarned : styles.medalCardLocked]}>
                  <Text style={[styles.medalEmoji, !earned && styles.medalEmojiLocked]}>
                    {medal.emoji}
                  </Text>
                  <Text style={[styles.medalLabel, !earned && styles.medalLabelLocked]}>
                    {medal.label}
                  </Text>
                  <Text style={styles.medalDays}>Día {medal.days}</Text>
                  {earned && <View style={styles.medalEarnedDot} />}
                </View>
              </FadeInView>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  title: { ...Typography.displayMedium, color: Colors.textDark },
  subtitle: { ...Typography.bodyLarge, color: Colors.textMid, marginTop: -Spacing.sm },

  // Roadmap
  roadmapCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warm,
    gap: Spacing.md,
  },
  sectionTitle: { ...Typography.labelSmall, color: Colors.textSoft, textTransform: 'uppercase' },
  roadmap: { flexDirection: 'row', alignItems: 'center' },
  milestoneItem: { alignItems: 'center', gap: Spacing.xs },
  milestoneCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.warm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.warm,
  },
  milestoneEarned: { backgroundColor: Colors.green500, borderColor: Colors.green500 },
  milestoneCurrent: { backgroundColor: Colors.white, borderColor: Colors.green500 },
  milestoneIcon: { fontSize: 14, color: Colors.white },
  // BUG FIX: círculo actual tiene fondo blanco → texto debe ser verde, no blanco
  milestoneIconCurrent: { color: Colors.green500, fontWeight: '700', fontSize: 13 },
  milestoneLabel: { ...Typography.caption, color: Colors.textSoft, textAlign: 'center' },
  milestoneLabelEarned: { color: Colors.green500 },
  roadmapLine: { flex: 1, height: 2, backgroundColor: Colors.warm, marginBottom: Spacing.lg },
  roadmapLineEarned: { backgroundColor: Colors.green400 },

  // Grid de medallas
  medalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  medalCard: {
    width: '100%',      // ocupa todo el ancho del FadeInView padre
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    minHeight: 100,
  },
  medalCardLocked: {
    backgroundColor: Colors.white,
    borderColor: Colors.warm,
    opacity: 0.5,
  },
  medalCardEarned: {
    backgroundColor: Colors.green50,
    borderColor: Colors.green300,
    opacity: 1,
  },
  medalEmoji: { fontSize: 28 },
  medalEmojiLocked: { opacity: 0.4 },
  medalLabel: { ...Typography.caption, color: Colors.textDark, textAlign: 'center', fontWeight: '600' },
  medalLabelLocked: { color: Colors.textSoft },
  medalDays: { ...Typography.caption, color: Colors.textSoft },
  medalEarnedDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.green400,
    marginTop: 2,
  },
});
