import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '@/constants';
import { getFunFact } from '@/constants/funfacts';

interface FunFactSheetProps {
  diasTotales: number;
  visible: boolean;
  onClose: () => void;
}

export function FunFactSheet({ diasTotales, visible, onClose }: FunFactSheetProps) {
  const fact = getFunFact(diasTotales);
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(400, { duration: 250, easing: Easing.in(Easing.quad) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!fact) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Badge pill */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Fun fact — Día {diasTotales}</Text>
        </View>

        {/* Emoji */}
        <Text style={styles.factEmoji}>{fact.emoji}</Text>

        {/* Título */}
        <Text style={styles.titulo}>{fact.titulo}</Text>

        {/* Cuerpo */}
        <Text style={styles.cuerpo}>{fact.cuerpo}</Text>

        {/* Botón principal */}
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>¡Gracias, lo sabré! 🌱</Text>
        </Pressable>

        {/* Link historial */}
        <Pressable>
          <Text style={styles.historialLink}>Ver historial de fun facts →</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.green800,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.green600,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    ...Typography.labelSmall,
    color: Colors.green100,
  },
  factEmoji: {
    fontSize: 56,
    marginTop: Spacing.xs,
  },
  titulo: {
    ...Typography.displaySmall,
    color: Colors.white,
    textAlign: 'center',
  },
  cuerpo: {
    ...Typography.bodyMedium,
    color: Colors.green200,
    textAlign: 'center',
    lineHeight: 22,
  },
  closeBtn: {
    backgroundColor: Colors.green400,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  historialLink: {
    ...Typography.bodySmall,
    color: Colors.green300,
    textDecorationLine: 'underline',
  },
});
