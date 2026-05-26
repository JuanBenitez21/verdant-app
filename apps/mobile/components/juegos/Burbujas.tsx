import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '@/constants';

const { width: W, height: H_AREA } = Dimensions.get('window');
const BUBBLE_COLORS = [Colors.green200, Colors.green300, Colors.green100];

interface Bubble {
  id: number;
  x: number;
  size: number;
  color: string;
  speed: number;
}

function makeBubble(id: number): Bubble {
  return {
    id,
    x: Math.random() * (W - 80),
    size: 40 + Math.floor(Math.random() * 40),
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]!,
    speed: 6000 + Math.floor(Math.random() * 4000),
  };
}

function BubbleView({ bubble, onPop }: { bubble: Bubble; onPop: (id: number) => void }) {
  const y = useSharedValue(H_AREA + bubble.size);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    y.value = withRepeat(
      withTiming(-bubble.size, { duration: bubble.speed, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  function pop() {
    scale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withTiming(0, { duration: 150 }),
    );
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => onPop(bubble.id), 200);
  }

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: bubble.x,
    width: bubble.size,
    height: bubble.size,
    borderRadius: bubble.size / 2,
    backgroundColor: bubble.color,
    transform: [{ translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Pressable onPress={pop}><Animated.View style={style} /></Pressable>;
}

export function Burbujas() {
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: 8 }, (_, i) => makeBubble(i)),
  );
  const [popped, setPopped] = useState(0);
  const nextId = useRef(10);

  const handlePop = useCallback((id: number) => {
    setPopped(p => p + 1);
    setBubbles(prev => {
      const filtered = prev.filter(b => b.id !== id);
      return [...filtered, makeBubble(nextId.current++)];
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Burbujas 🫧</Text>
      <Text style={styles.subtitle}>Revienta y relájate</Text>

      <View style={styles.area} pointerEvents="box-none">
        {bubbles.map(b => (
          <BubbleView key={b.id} bubble={b} onPop={handlePop} />
        ))}
      </View>

      {popped > 0 && (
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>💥 {popped} {popped === 1 ? 'burbuja' : 'burbujas'} reventada{popped > 1 ? 's' : ''}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.md },
  title: { ...Typography.displaySmall, color: Colors.textDark },
  subtitle: { ...Typography.bodySmall, color: Colors.textSoft, marginTop: -Spacing.sm },
  area: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: 'rgba(61, 158, 103, 0.08)',
    borderWidth: 1,
    borderColor: Colors.green100,
    position: 'relative',
  },
  counterRow: {
    backgroundColor: Colors.green50,
    borderRadius: 999,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  counterText: { ...Typography.labelSmall, color: Colors.green600 },
});
