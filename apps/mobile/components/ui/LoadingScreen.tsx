import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '@/constants';

export function LoadingScreen({ subtitle }: { subtitle?: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.3, { duration: 900 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.logo, animStyle]}>verdant</Animated.Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.green900, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  logo: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 40, color: Colors.green300, letterSpacing: 1 },
  subtitle: { ...Typography.bodyMedium, color: Colors.green200 },
});
