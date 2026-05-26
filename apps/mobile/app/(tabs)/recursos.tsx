import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { ARTICLES } from '@/constants/articles';
import { FUN_FACTS } from '@/constants/funfacts';
import { Respiracion } from '@/components/juegos/Respiracion';
import { Burbujas } from '@/components/juegos/Burbujas';
import { Meditacion } from '@/components/juegos/Meditacion';
import { supabase } from '@/services/supabase';

const T = ScreenTheme.light;

type Tab = 'articulos' | 'juegos' | 'funfacts';

export default function RecursosScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('articulos');
  const [diasTotales, setDiasTotales] = useState(0);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id;
      if (!userId) return;
      supabase
        .from('streaks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('godparent_confirmed', true)
        .eq('relapse', false)
        .then(({ count }) => setDiasTotales(count ?? 0));
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Recursos 📚</Text>
          <Text style={styles.pageSubtitle}>Herramientas para tu proceso</Text>
        </View>

        {/* Tabs internas */}
        <View style={styles.tabRow}>
          {(['articulos', 'juegos', 'funfacts'] as Tab[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'articulos' ? 'Artículos' : tab === 'juegos' ? 'Juegos' : 'Fun Facts'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Contenido */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'articulos' && (
            <ArticulosTab onOpen={id => router.push(`/articulo/${id}`)} />
          )}
          {activeTab === 'juegos' && <JuegosTab />}
          {activeTab === 'funfacts' && <FunFactsTab diasTotales={diasTotales} />}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ArticulosTab({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <View style={{ gap: Spacing.md }}>
      {ARTICLES.map(article => (
        <Pressable key={article.id} style={articStyles.card} onPress={() => onOpen(article.id)}>
          <Text style={articStyles.emoji}>{article.emoji}</Text>
          <View style={articStyles.info}>
            <Text style={articStyles.titulo}>{article.titulo}</Text>
            <Text style={articStyles.subtitulo}>{article.subtitulo}</Text>
            <Text style={articStyles.time}>⏱ {article.tiempoLectura}</Text>
          </View>
          <Text style={articStyles.arrow}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

function JuegosTab() {
  const [activeGame, setActiveGame] = useState<'respiracion' | 'burbujas' | 'meditacion'>('respiracion');

  return (
    <View style={{ gap: Spacing.lg }}>
      <Text style={gamesStyles.sectionLabel}>Zona de calma</Text>
      <View style={gamesStyles.gameRow}>
        {(['respiracion', 'burbujas', 'meditacion'] as const).map(g => (
          <Pressable
            key={g}
            style={[gamesStyles.gameBtn, activeGame === g && gamesStyles.gameBtnActive]}
            onPress={() => setActiveGame(g)}
          >
            <Text style={gamesStyles.gameEmoji}>
              {g === 'respiracion' ? '🫁' : g === 'burbujas' ? '🫧' : '🧘'}
            </Text>
            <Text style={[gamesStyles.gameName, activeGame === g && gamesStyles.gameNameActive]}>
              {g === 'respiracion' ? 'Respiración' : g === 'burbujas' ? 'Burbujas' : 'Meditación'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={gamesStyles.gameArea}>
        {activeGame === 'respiracion' && <Respiracion />}
        {activeGame === 'burbujas' && <Burbujas />}
        {activeGame === 'meditacion' && <Meditacion />}
      </View>
    </View>
  );
}

function FunFactsTab({ diasTotales }: { diasTotales: number }) {
  return (
    <View style={{ gap: Spacing.md }}>
      {FUN_FACTS.map(fact => {
        const unlocked = diasTotales >= fact.dayTrigger;
        return (
          <View key={fact.dayTrigger} style={[ffStyles.card, !unlocked && ffStyles.cardLocked]}>
            <Text style={[ffStyles.emoji, !unlocked && ffStyles.locked]}>{unlocked ? fact.emoji : '🔒'}</Text>
            <View style={ffStyles.info}>
              <View style={ffStyles.titleRow}>
                <Text style={[ffStyles.titulo, !unlocked && ffStyles.locked]}>{fact.titulo}</Text>
                <View style={ffStyles.dayBadge}>
                  <Text style={ffStyles.dayBadgeText}>Día {fact.dayTrigger}</Text>
                </View>
              </View>
              <Text style={[ffStyles.cuerpo, !unlocked && ffStyles.locked]} numberOfLines={unlocked ? undefined : 2}>
                {unlocked ? fact.cuerpo : '···'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const articStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warm,
  },
  emoji: { fontSize: 36 },
  info: { flex: 1, gap: 2 },
  titulo: { ...Typography.labelLarge, color: Colors.textDark },
  subtitulo: { ...Typography.bodySmall, color: Colors.textSoft },
  time: { ...Typography.caption, color: Colors.textSoft, marginTop: 4 },
  arrow: { ...Typography.displaySmall, color: Colors.textSoft, fontSize: 24 },
});

const gamesStyles = StyleSheet.create({
  sectionLabel: { ...Typography.labelLarge, color: Colors.textDark },
  gameRow: { flexDirection: 'row', gap: Spacing.sm },
  gameBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.warm,
  },
  gameBtnActive: { borderColor: Colors.green500, backgroundColor: Colors.green50 },
  gameEmoji: { fontSize: 28 },
  gameName: { ...Typography.caption, color: Colors.textSoft, textAlign: 'center' },
  gameNameActive: { color: Colors.green600 },
  gameArea: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warm,
  },
});

const ffStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warm,
  },
  cardLocked: { opacity: 0.4 },
  emoji: { fontSize: 32, marginTop: 2 },
  info: { flex: 1, gap: Spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  titulo: { ...Typography.labelLarge, color: Colors.textDark, flex: 1 },
  cuerpo: { ...Typography.bodySmall, color: Colors.textMid, lineHeight: 20 },
  locked: { color: Colors.textSoft },
  dayBadge: {
    backgroundColor: Colors.green50,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  dayBadgeText: { ...Typography.caption, color: Colors.green600 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: 4,
  },
  pageTitle: { ...Typography.displaySmall, color: Colors.textDark },
  pageSubtitle: { ...Typography.bodySmall, color: Colors.textSoft },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.warm,
  },
  tabActive: { backgroundColor: Colors.green800 },
  tabText: { ...Typography.labelSmall, color: Colors.textMid },
  tabTextActive: { color: Colors.white },
  content: { flex: 1 },
  contentInner: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
});
