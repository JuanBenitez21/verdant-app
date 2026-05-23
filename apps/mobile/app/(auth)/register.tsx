import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

const T = ScreenTheme.dark;

// Dominios institucionales válidos — en producción se consulta al backend
const VALID_DOMAINS = ['unisabana.edu.co', 'verdant.app', 'uniandes.edu.co'];

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!fullName.trim()) next['fullName'] = 'El nombre es requerido';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      next['email'] = 'Correo inválido';
    } else {
      const domain = email.split('@')[1] ?? '';
      if (!VALID_DOMAINS.includes(domain)) {
        next['email'] = 'Tu institución aún no está en Verdant. Solicita la integración.';
      }
    }

    if (password.length < 8) next['password'] = 'Mínimo 8 caracteres';
    if (password !== confirmPassword) next['confirmPassword'] = 'Las contraseñas no coinciden';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim());
      Alert.alert(
        '¡Registro exitoso!',
        'Revisa tu correo para confirmar tu cuenta y luego completa tu perfil.',
        [{ text: 'Entendido', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Paso 1 de 4 — Tus datos</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={[styles.input, errors['fullName'] ? styles.inputError : null]}
              placeholder="Juan Pérez"
              placeholderTextColor={Colors.green600}
              value={fullName}
              onChangeText={(v) => { setFullName(v); setErrors(p => ({ ...p, fullName: '' })); }}
              autoCapitalize="words"
            />
            {errors['fullName'] ? <Text style={styles.errorText}>{errors['fullName']}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>Correo institucional</Text>
            <TextInput
              style={[styles.input, errors['email'] ? styles.inputError : null]}
              placeholder="tu@universidad.edu.co"
              placeholderTextColor={Colors.green600}
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors['email'] ? <Text style={styles.errorText}>{errors['email']}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, errors['password'] ? styles.inputError : null]}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={Colors.green600}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
              secureTextEntry
            />
            {errors['password'] ? <Text style={styles.errorText}>{errors['password']}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={[styles.input, errors['confirmPassword'] ? styles.inputError : null]}
              placeholder="Repite tu contraseña"
              placeholderTextColor={Colors.green600}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors(p => ({ ...p, confirmPassword: '' })); }}
              secureTextEntry
            />
            {errors['confirmPassword'] ? <Text style={styles.errorText}>{errors['confirmPassword']}</Text> : null}
          </View>

          <Pressable
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnPrimaryText}>Continuar →</Text>
            }
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    ...Typography.bodyMedium,
    color: Colors.green300,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.white,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.green200,
  },
  form: {
    gap: Spacing.md,
  },
  label: {
    ...Typography.labelSmall,
    color: Colors.green200,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    color: Colors.white,
    ...Typography.bodyLarge,
  },
  inputError: {
    borderColor: Colors.rose,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.rose,
    marginTop: Spacing.xs,
  },
  btnPrimary: {
    backgroundColor: Colors.green400,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  linkText: {
    ...Typography.bodyMedium,
    color: Colors.green200,
    textAlign: 'center',
  },
  linkAccent: {
    color: Colors.green300,
    fontWeight: '600',
  },
});
