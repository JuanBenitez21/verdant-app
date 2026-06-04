import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '@/constants';

const SLIDES = [
  {
    emoji: '🌱', animated: true,
    title: 'Tu planta crece contigo',
    body: 'Cada día sin fumar, tu planta da un paso más hacia la floración',
  },
  {
    emoji: '🤝', animated: false,
    title: 'Tu padrino te respalda',
    body: 'Una persona de confianza confirma tu progreso cada día. Sin trampa.',
  },
  {
    emoji: '🎁', animated: false,
    title: 'Gana recompensas reales',
    body: 'Tu institución premia tu esfuerzo con beneficios tangibles según tu Score Verdant',
  },
];

function FloatingEmoji({ emoji }: { emoji: string }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-12, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1, false);
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.Text style={[styles.emoji, s]}>{emoji}</Animated.Text>;
}

export function OnboardingSlides({ onComplete }: { onComplete: () => void }) {
  const [cur, setCur] = useState(0);
  const slide = SLIDES[cur]!;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {slide.animated ? <FloatingEmoji emoji={slide.emoji} /> : <Text style={styles.emoji}>{slide.emoji}</Text>}
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => <View key={i} style={[styles.dot, i === cur && styles.dotActive]} />)}
        </View>
        <Pressable
          style={styles.btn}
          onPress={() => cur < SLIDES.length - 1 ? setCur(c => c + 1) : onComplete()}
          accessibilityLabel={cur < 2 ? 'Siguiente slide' : 'Empezar a usar Verdant'}
        >
          <Text style={styles.btnText}>{cur < SLIDES.length - 1 ? 'Siguiente' : '¡Empezar!'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.green900,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl,
    justifyContent: 'space-between',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  emoji: { fontSize: 80 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: Colors.white, textAlign: 'center', lineHeight: 36 },
  body: { ...Typography.bodyLarge, color: Colors.green200, textAlign: 'center', lineHeight: 26 },
  footer: { gap: Spacing.lg, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green700 },
  dotActive: { backgroundColor: Colors.green300, width: 20 },
  btn: {
    backgroundColor: Colors.green400, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', width: '100%',
  },
  btnText: { ...Typography.labelLarge, color: Colors.white },
});
