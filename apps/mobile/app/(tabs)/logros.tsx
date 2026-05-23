import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, ScreenTheme, Typography, Spacing } from '@/constants';

export default function LogrosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logros</Text>
      <Text style={styles.subtitle}>Próximamente — Sprint 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ScreenTheme.light.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  title: { ...Typography.displaySmall, color: Colors.textDark },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMid },
});
