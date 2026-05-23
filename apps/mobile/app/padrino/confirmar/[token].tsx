import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';

const T = ScreenTheme.light;
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ConfirmarPadrinoScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleConfirm() {
    if (!answer.trim()) {
      Alert.alert('Respuesta requerida', 'Por favor responde la pregunta de confirmación');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/padrino/confirmar/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frictionAnswer: answer.trim() }),
      });

      const json = await res.json() as { success: boolean; error?: { message: string } };

      if (!json.success) {
        Alert.alert('Error', json.error?.message ?? 'No se pudo confirmar');
        return;
      }

      setConfirmed(true);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>🌿</Text>
        <Text style={styles.successTitle}>¡Confirmado!</Text>
        <Text style={styles.successBody}>
          Le dijiste que sí. Su planta creció hoy. Gracias por acompañarlo en este camino.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.logo}>🌿 Verdant</Text>
      <Text style={styles.title}>Confirmación de padrino</Text>
      <Text style={styles.body}>
        Tu amigo reportó un día sin fumar y necesita que lo confirmes. Por favor responde la pregunta:
      </Text>

      <View style={styles.questionCard}>
        <Text style={styles.question}>
          ¿Estás seguro de que tu amigo no fumó hoy?
        </Text>
      </View>

      <View>
        <Text style={styles.label}>Tu respuesta</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe Sí o No, y cualquier comentario..."
          placeholderTextColor={Colors.textSoft}
          value={answer}
          onChangeText={setAnswer}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <Pressable
        style={[styles.btnPrimary, loading && styles.btnDisabled]}
        onPress={handleConfirm}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.btnText}>Confirmar</Text>
        }
      </Pressable>

      <Text style={styles.disclaimer}>
        Este enlace expira a medianoche de hoy. No necesitas crear una cuenta.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  logo: {
    ...Typography.labelLarge,
    color: Colors.green500,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textDark,
  },
  body: {
    ...Typography.bodyLarge,
    color: Colors.textMid,
  },
  questionCard: {
    backgroundColor: Colors.green50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.green400,
  },
  question: {
    ...Typography.bodyLarge,
    color: Colors.textDark,
    fontWeight: '600',
  },
  label: {
    ...Typography.labelSmall,
    color: Colors.textMid,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    color: Colors.textDark,
    ...Typography.bodyLarge,
    minHeight: 90,
  },
  btnPrimary: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textSoft,
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  successEmoji: {
    fontSize: 72,
  },
  successTitle: {
    ...Typography.displayMedium,
    color: Colors.green800,
  },
  successBody: {
    ...Typography.bodyLarge,
    color: Colors.textMid,
    textAlign: 'center',
  },
});
