import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'empty';
}

export function ErrorMessage({ message, onRetry, type = 'error' }: ErrorMessageProps) {
  const config = {
    error:   { bg: Colors.roseLight,   icon: '⚠️', color: Colors.rose },
    warning: { bg: Colors.amberLight,  icon: '💛', color: Colors.amber },
    empty:   { bg: 'transparent',      icon: '🌱', color: Colors.textSoft },
  }[type];

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.btn} onPress={onRetry} accessibilityLabel="Intentar de nuevo">
          <Text style={[styles.btnText, { color: config.color }]}>Intentar de nuevo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs },
  icon: { fontSize: 24 },
  message: { ...Typography.bodySmall, textAlign: 'center' },
  btn: {
    marginTop: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  btnText: { ...Typography.labelSmall },
});
