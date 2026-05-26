import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '@/constants';

type Phase = 'idle' | 'inhala' | 'sostén' | 'exhala';

const PHASES: { name: Phase; duration: number; label: string; color: string }[] = [
  { name: 'inhala', duration: 4000, label: 'Inhala…', color: Colors.green400 },
  { name: 'sostén', duration: 7000, label: 'Sostén…', color: Colors.green700 },
  { name: 'exhala', duration: 8000, label: 'Exhala…', color: Colors.green200 },
];

export function Respiracion() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useSharedValue(1);

  const currentPhase = running ? PHASES[phaseIndex]! : { name: 'idle' as Phase, duration: 0, label: 'Respira…', color: Colors.green400 };

  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearTimeout(timerRef.current);
      scale.value = withTiming(1, { duration: 400 });
      return;
    }

    const phase = PHASES[phaseIndex]!;

    if (phase.name === 'inhala') {
      scale.value = withTiming(1.6, { duration: phase.duration, easing: Easing.inOut(Easing.ease) });
    } else if (phase.name === 'sostén') {
      // Sin cambio de escala
    } else {
      scale.value = withTiming(1, { duration: phase.duration, easing: Easing.inOut(Easing.ease) });
    }

    timerRef.current = setTimeout(() => {
      const next = (phaseIndex + 1) % PHASES.length;
      if (next === 0) setCycles(c => c + 1);
      setPhaseIndex(next);
    }, phase.duration);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [running, phaseIndex]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: currentPhase.color,
  }));

  function toggle() {
    if (running) {
      setRunning(false);
      setPhaseIndex(0);
      setCycles(0);
    } else {
      setPhaseIndex(0);
      setRunning(true);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Respiración 4-7-8</Text>
      <Text style={styles.subtitle}>Activa tu sistema nervioso parasimpático</Text>

      <View style={styles.circleWrapper}>
        <Animated.View style={[styles.circle, circleStyle]} />
        <View style={styles.circleLabel}>
          <Text style={styles.phaseLabel}>{currentPhase.label}</Text>
          {running && (
            <Text style={styles.phaseSecs}>
              {currentPhase.name === 'inhala' ? '4s' : currentPhase.name === 'sostén' ? '7s' : '8s'}
            </Text>
          )}
        </View>
      </View>

      {cycles > 0 && (
        <View style={styles.cyclesBadge}>
          <Text style={styles.cyclesText}>🔄 {cycles} {cycles === 1 ? 'ciclo' : 'ciclos'} completado{cycles > 1 ? 's' : ''}</Text>
        </View>
      )}

      <Pressable style={[styles.btn, running && styles.btnStop]} onPress={toggle}>
        <Text style={styles.btnText}>{running ? 'Detener' : 'Iniciar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xl },
  title: { ...Typography.displaySmall, color: Colors.textDark, textAlign: 'center' },
  subtitle: { ...Typography.bodySmall, color: Colors.textSoft, textAlign: 'center', marginTop: -Spacing.sm },
  circleWrapper: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.85,
  },
  circleLabel: { alignItems: 'center', zIndex: 1 },
  phaseLabel: { ...Typography.labelLarge, color: Colors.white, fontSize: 18 },
  phaseSecs: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  cyclesBadge: {
    backgroundColor: Colors.green50,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  cyclesText: { ...Typography.labelSmall, color: Colors.green600 },
  btn: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minWidth: 140,
    alignItems: 'center',
  },
  btnStop: { backgroundColor: Colors.textMid },
  btnText: { ...Typography.labelLarge, color: Colors.white },
});
