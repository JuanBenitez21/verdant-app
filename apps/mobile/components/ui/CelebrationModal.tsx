import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '@/constants';
import { getPlantStage } from '@/constants/plants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CONFETTI = Array.from({ length: 20 }, (_, i) => ({
  key: String(i),
  left: Math.random() * (SCREEN_W - 20),
  delay: Math.floor(Math.random() * 800),
  duration: 1500 + Math.floor(Math.random() * 1000),
}));

const ACHIEVEMENT_LABELS: Record<string, string> = {
  day_1:   'Primer día limpio',
  day_3:   '3 días seguidos',
  day_7:   'Una semana completa',
  day_15:  'Dos semanas y más',
  day_30:  'Un mes sin fumar',
  day_60:  'Dos meses de fortaleza',
  day_100: '100 días de victoria',
};

interface CelebrationModalProps {
  visible: boolean;
  daysCount: number;
  newAchievement?: string | null;
  onClose: () => void;
}

function ConfettiPiece({ left, delay, duration }: { left: number; delay: number; duration: number }) {
  const y = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: SCREEN_H + 20, duration, useNativeDriver: true }),
        Animated.timing(y, { toValue: -20, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.Text style={[styles.confetti, { left, transform: [{ translateY: y }] }]}>
      🌿
    </Animated.Text>
  );
}

export function CelebrationModal({ visible, daysCount, newAchievement, onClose }: CelebrationModalProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 10, stiffness: 80 });
      opacity.value = withSpring(1, { damping: 15 });
      const t = setTimeout(onClose, 8000);
      return () => clearTimeout(t);
    } else {
      scale.value = 0.5;
      opacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const stage = getPlantStage(daysCount);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {CONFETTI.map(c => (
          <ConfettiPiece key={c.key} left={c.left} delay={c.delay} duration={c.duration} />
        ))}

        <Reanimated.View style={[styles.card, cardStyle]}>
          <Text style={styles.plantEmoji}>{stage.emoji}</Text>

          <Text style={styles.title}>¡Tu padrino confirmó!</Text>

          <Text style={styles.subtitle}>
            Llevas {daysCount} {daysCount === 1 ? 'día' : 'días'} sin fumar 🔥
          </Text>

          {newAchievement && (
            <View style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>🏆</Text>
              <Text style={styles.achievementText}>
                ¡Medalla desbloqueada!{'\n'}
                {ACHIEVEMENT_LABELS[newAchievement] ?? newAchievement}
              </Text>
            </View>
          )}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>¡Increíble! 🌱</Text>
          </Pressable>
        </Reanimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 38, 24, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    fontSize: 18,
    top: 0,
  },
  card: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '85%',
    borderWidth: 1,
    borderColor: Colors.green600,
  },
  plantEmoji: { fontSize: 80 },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    lineHeight: 38,
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: { ...Typography.bodyLarge, color: Colors.green200, textAlign: 'center' },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.green700,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.green500,
    width: '100%',
  },
  achievementEmoji: { fontSize: 28 },
  achievementText: { ...Typography.bodyMedium, color: Colors.green100, flex: 1 },
  closeBtn: {
    backgroundColor: Colors.green400,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  closeBtnText: { ...Typography.labelLarge, color: Colors.white, fontSize: 17 },
});
