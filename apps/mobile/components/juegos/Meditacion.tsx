import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '@/constants';

const TOTAL_SECS = 180;

const GUIDES: { at: number; text: string }[] = [
  { at: 0,   text: 'Cierra los ojos. Respira profundo.' },
  { at: 30,  text: 'Siente cómo el aire llena tus pulmones.' },
  { at: 60,  text: 'Cada segundo sin fumar es una victoria.' },
  { at: 90,  text: 'Tu cuerpo te lo agradece.' },
  { at: 120, text: 'El antojo pasará. Siempre pasa.' },
  { at: 150, text: 'Eres más fuerte que cualquier antojo.' },
  { at: 180, text: '✨ Completaste 3 minutos de calma' },
];

function getGuide(elapsed: number): string {
  const sorted = [...GUIDES].reverse();
  return sorted.find(g => elapsed >= g.at)?.text ?? GUIDES[0]!.text;
}

export function Meditacion() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        progress.value = withTiming(next / TOTAL_SECS, { duration: 1000, easing: Easing.linear });
        if (next >= TOTAL_SECS) {
          clearInterval(intervalRef.current!);
          setRunning(false);
        }
        return next;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function toggle() {
    if (elapsed >= TOTAL_SECS) {
      setElapsed(0);
      progress.value = 0;
      setRunning(true);
    } else {
      setRunning(r => !r);
    }
  }

  const mins = Math.floor((TOTAL_SECS - elapsed) / 60).toString().padStart(2, '0');
  const secs = ((TOTAL_SECS - elapsed) % 60).toString().padStart(2, '0');
  const done = elapsed >= TOTAL_SECS;

  const arcStyle = useAnimatedStyle(() => ({
    // Simulamos el arco con un gradiente de borde girando
    borderRightColor: progress.value > 0.5 ? Colors.green400 : 'transparent',
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));

  const pct = Math.round((elapsed / TOTAL_SECS) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meditación guiada</Text>
      <Text style={styles.subtitle}>3 minutos de calma</Text>

      {/* Timer circular simulado con progreso lineal */}
      <View style={styles.timerWrapper}>
        <View style={styles.timerTrack}>
          <Animated.View style={[styles.timerFill, { width: `${pct}%` as `${number}%` }]} />
        </View>
        <Text style={styles.timerText}>{done ? '✨' : `${mins}:${secs}`}</Text>
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideText}>{getGuide(elapsed)}</Text>
      </View>

      <Pressable
        style={[styles.btn, done && styles.btnDone]}
        onPress={toggle}
      >
        <Text style={styles.btnText}>
          {done ? 'Repetir' : running ? 'Pausar' : elapsed === 0 ? 'Iniciar' : 'Continuar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xl },
  title: { ...Typography.displaySmall, color: Colors.textDark },
  subtitle: { ...Typography.bodySmall, color: Colors.textSoft, marginTop: -Spacing.sm },
  timerWrapper: { alignItems: 'center', gap: Spacing.sm, width: '100%' },
  timerTrack: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.warm,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: Colors.green400,
    borderRadius: Radius.full,
  },
  timerText: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 36,
    color: Colors.textDark,
  },
  guideCard: {
    backgroundColor: Colors.green50,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.green200,
    width: '100%',
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideText: { ...Typography.bodyLarge, color: Colors.textMid, textAlign: 'center', lineHeight: 26 },
  btn: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minWidth: 140,
    alignItems: 'center',
  },
  btnDone: { backgroundColor: Colors.green500 },
  btnText: { ...Typography.labelLarge, color: Colors.white },
});
