import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ARTICLES } from '@/constants/articles';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';

const T = ScreenTheme.light;

export default function ArticuloScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const article = ARTICLES.find(a => a.id === id);

  if (!article) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFound}>Artículo no encontrado</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Recursos</Text>
        </Pressable>

        <Text style={styles.emoji}>{article.emoji}</Text>
        <Text style={styles.titulo}>{article.titulo}</Text>
        <Text style={styles.subtitulo}>{article.subtitulo}</Text>

        <View style={styles.readTimeBadge}>
          <Text style={styles.readTimeText}>⏱ {article.tiempoLectura} de lectura</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.contenido}>{article.contenido}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  notFound: { ...Typography.bodyMedium, color: Colors.textSoft },
  backLink: { ...Typography.labelLarge, color: Colors.green500 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  backBtnText: { ...Typography.labelSmall, color: Colors.green500 },
  emoji: { fontSize: 56, textAlign: 'center' },
  titulo: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, lineHeight: 34, color: Colors.textDark },
  subtitulo: { ...Typography.bodyLarge, color: Colors.textSoft, marginTop: -Spacing.xs },
  readTimeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.warm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  readTimeText: { ...Typography.caption, color: Colors.textMid },
  divider: { height: 1, backgroundColor: Colors.warm },
  contenido: { ...Typography.bodyLarge, color: Colors.textMid, lineHeight: 28 },
});
