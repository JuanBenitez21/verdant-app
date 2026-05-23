import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';

const T = ScreenTheme.light;

export default function OnboardingPadrinoScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [padrinoEmail, setPadrinoEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  function validateEmail(v: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(v)) { setEmailError('Correo inválido'); return false; }
    setEmailError('');
    return true;
  }

  async function handleInvite() {
    if (!validateEmail(padrinoEmail) || !user?.id) return;
    setLoading(true);
    try {
      await supabase.from('users').update({ godparent_email: padrinoEmail.trim().toLowerCase() }).eq('id', user.id);
      Alert.alert(
        '¡Invitación enviada!',
        `Le avisamos a ${padrinoEmail} que será tu padrino. Cuando acepte, tu racha quedará protegida.`,
        [{ text: 'Ir al inicio', onPress: () => router.replace('/(tabs)') }],
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    router.replace('/(tabs)');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.step}>Paso 4 de 4</Text>
        <Text style={styles.title}>Invita a tu padrino</Text>
        <Text style={styles.subtitle}>
          Tu padrino confirma cada día limpio. Sin su confirmación, el día no cuenta.
          Es la clave del sistema anti-trampa.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoEmoji}>🤝</Text>
        <Text style={styles.infoText}>
          Elige a alguien de confianza — un amigo, familiar o compañero.
          Solo recibirá un correo cada vez que reportes un día limpio.
        </Text>
      </View>

      <View>
        <Text style={styles.label}>Correo del padrino</Text>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="amigo@correo.com"
          placeholderTextColor={Colors.textSoft}
          value={padrinoEmail}
          onChangeText={(v) => { setPadrinoEmail(v); setEmailError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <Pressable
        style={[styles.btnPrimary, loading && styles.btnDisabled]}
        onPress={handleInvite}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.btnText}>Enviar invitación</Text>
        }
      </Pressable>

      <Pressable onPress={handleSkip}>
        <Text style={styles.skipText}>Ahora no, invitar después</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.xl },
  header: { gap: Spacing.sm },
  step: { ...Typography.labelSmall, color: Colors.green500, textTransform: 'uppercase' },
  title: { ...Typography.displayMedium, color: Colors.textDark },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMid },
  infoCard: {
    backgroundColor: Colors.green50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoEmoji: { fontSize: 24 },
  infoText: { ...Typography.bodyMedium, color: Colors.textMid, flex: 1 },
  label: { ...Typography.labelSmall, color: Colors.textMid, textTransform: 'uppercase', marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    color: Colors.textDark,
    ...Typography.bodyLarge,
  },
  inputError: { borderColor: Colors.rose },
  errorText: { ...Typography.bodySmall, color: Colors.rose, marginTop: Spacing.xs },
  btnPrimary: { backgroundColor: Colors.green800, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...Typography.labelLarge, color: Colors.white },
  skipText: { ...Typography.bodyMedium, color: Colors.textSoft, textAlign: 'center' },
});
