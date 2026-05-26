import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { supabase } from '@/services/supabase';

const T = ScreenTheme.light;

const ROADMAP_MILESTONES = [1, 7, 30, 60, 100] as const;

const MEDALS: ReadonlyArray<{
  key: string;
  days: number;
  emoji: string;
  label: string;
}> = [
  { key: 'day_1',   days: 1,   emoji: '🥇', label: 'Primer día' },
  { key: 'day_3',   days: 3,   emoji: '🌱', label: 'Tres días' },
  { key: 'day_7',   days: 7,   emoji: '💪', label: 'Primera semana' },
  { key: 'day_15',  days: 15,  emoji: '🌿', label: 'Dos semanas' },
  { key: 'day_30',  days: 30,  emoji: '🌸', label: 'Un mes' },
  { key: 'day_60',  days: 60,  emoji: '🌺', label: 'Dos meses' },
  { key: 'day_100', days: 100, emoji: '👑', label: '100 días' },
];

export default function LogrosScreen() {
  const [earnedKeys, setEarnedKeys] = useState<Set<string>>(new Set());
  const [diasTotales, setDiasTotales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) { setIsLoading(false); return; }

      const [{ data: achievements }, { count }] = await Promise.all([
        supabase.from('achievements').select('achievement_key').eq('user_id', userId),
        supabase
          .from('streaks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('godparent_confirmed', true)
          .eq('relapse', false),
      ]);

      setEarnedKeys(new Set((achievements ?? []).map(a => a.achievement_key as string)));
      setDiasTotales(count ?? 0);
      setIsLoading(false);
    }

    cargar();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={Colors.green500} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tus logros</Text>
      <Text style={styles.subtitle}>{diasTotales} {diasTotales === 1 ? 'día' : 'días'} sin fumar</Text>

      {/* Roadmap */}
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
                    <Text style={styles.milestoneIcon}>
                      {earned ? '✓' : isCurrent ? String(diasTotales) : '🔒'}
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

      {/* Grid de medallas */}
      <Text style={styles.sectionTitle}>Medallas</Text>
      <View style={styles.medalGrid}>
        {MEDALS.map(medal => {
          const earned = earnedKeys.has(medal.key);
          return (
            <View key={medal.key} style={[styles.medalCard, earned && styles.medalCardEarned]}>
              <Text style={[styles.medalEmoji, !earned && styles.medalEmojiLocked]}>
                {medal.emoji}
              </Text>
              <Text style={[styles.medalLabel, !earned && styles.medalLabelLocked]}>
                {medal.label}
              </Text>
              <Text style={styles.medalDays}>Día {medal.days}</Text>
              {!earned && <Text style={styles.medalLock}>🔒</Text>}
            </View>
          );
        })}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg },
  title: { ...Typography.displayMedium, color: Colors.textDark },
  subtitle: { ...Typography.bodyLarge, color: Colors.textMid, marginTop: -Spacing.sm },

  roadmapCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warm,
    gap: Spacing.md,
  },
  sectionTitle: { ...Typography.labelSmall, color: Colors.textSoft, textTransform: 'uppercase' },
  roadmap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestoneItem: { alignItems: 'center', gap: Spacing.xs },
  milestoneCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.warm,
  },
  milestoneEarned: {
    backgroundColor: Colors.green500,
    borderColor: Colors.green500,
  },
  milestoneCurrent: {
    backgroundColor: Colors.white,
    borderColor: Colors.green500,
  },
  milestoneIcon: { fontSize: 16, color: Colors.white },
  milestoneLabel: { ...Typography.caption, color: Colors.textSoft },
  milestoneLabelEarned: { color: Colors.green500 },
  roadmapLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.warm,
    marginBottom: Spacing.lg,
  },
  roadmapLineEarned: { backgroundColor: Colors.green400 },

  medalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  medalCard: {
    width: '30%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.warm,
    opacity: 0.5,
  },
  medalCardEarned: {
    opacity: 1,
    borderColor: Colors.green300,
    backgroundColor: Colors.green50,
  },
  medalEmoji: { fontSize: 28 },
  medalEmojiLocked: { opacity: 0.4 },
  medalLabel: { ...Typography.caption, color: Colors.textDark, textAlign: 'center', fontWeight: '600' },
  medalLabelLocked: { color: Colors.textSoft },
  medalDays: { ...Typography.caption, color: Colors.textSoft },
  medalLock: { fontSize: 10, position: 'absolute', top: 6, right: 6 },
});
