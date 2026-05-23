import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, ScreenTheme, Typography, Spacing } from '@/constants';

export default function JuegosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Juegos</Text>
      <Text style={styles.subtitle}>Próximamente — Sprint 3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ScreenTheme.dark.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  title: { ...Typography.displaySmall, color: Colors.white },
  subtitle: { ...Typography.bodyMedium, color: Colors.green200 },
});
