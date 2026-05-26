import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getPlantStage } from '@/constants/plants';

interface PlantaAnimadaProps {
  diasTotales: number;
  previousDias: number;
}

const STAGE_THRESHOLDS = [3, 7, 15, 30, 60];

export function PlantaAnimada({ diasTotales, previousDias }: PlantaAnimadaProps) {
  const stage = getPlantStage(diasTotales);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const initialized = useRef(false);

  // Animación idle: float suave arriba y abajo, loop infinito
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  // Animación de crecimiento cuando se cruza un umbral de etapa
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const crossedThreshold = STAGE_THRESHOLDS.some(
      t => previousDias < t && diasTotales >= t,
    );

    if (!crossedThreshold) return;

    // Escala: crece de 0.8 → 1.2 → 1.0 con spring
    scale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withSpring(1.2, { damping: 4, stiffness: 200 }),
      withSpring(1.0, { damping: 8, stiffness: 150 }),
    );

    // Brillo: pulsa opacidad 0.6 → 1.0
    opacity.value = withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(1.0, { duration: 400 }),
      withTiming(0.7, { duration: 150 }),
      withTiming(1.0, { duration: 150 }),
    );
  }, [diasTotales]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.emoji}>{stage.emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 72,
  },
});
