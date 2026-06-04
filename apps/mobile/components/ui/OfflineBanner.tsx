import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors, Typography } from '@/constants';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const translateY = useSharedValue(-40);

  useEffect(() => {
    translateY.value = withTiming(isConnected ? -40 : 0, { duration: 300 });
  }, [isConnected]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={[styles.banner, animStyle]}>
      <Text style={styles.text}>Sin conexión — los cambios se sincronizarán cuando vuelvas</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 32, zIndex: 999,
    backgroundColor: Colors.amber, alignItems: 'center', justifyContent: 'center',
  },
  text: { ...Typography.caption, color: Colors.white, fontWeight: '600' },
});
