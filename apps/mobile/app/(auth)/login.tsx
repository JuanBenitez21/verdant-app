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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { supabase } from '@/services/supabase';

const T = ScreenTheme.dark;

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');

    if (!email.trim()) { setError('Ingresa tu correo institucional'); return; }
    if (!password) { setError('Ingresa tu contraseña'); return; }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : authError.message);
      }
      // Si hay éxito, RootNavigator redirige automáticamente a (tabs)
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('Google OAuth próximamente disponible');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Marca */}
        <View style={styles.hero}>
          <Text style={styles.logo}>verdant</Text>
          <Text style={styles.tagline}>Tu proceso, tu ritmo</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Text style={styles.title}>Bienvenido de vuelta</Text>

          {/* Error inline */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View>
            <Text style={styles.label}>Correo institucional</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@universidad.edu.co"
              placeholderTextColor={Colors.green600}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Contraseña</Text>
              <Pressable onPress={() => setError('Recuperación de contraseña próximamente')}>
                <Text style={styles.forgotLink}>¿Olvidé contraseña?</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.green600}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnPrimaryText}>Ingresar</Text>
            }
          </Pressable>

          {/* Separador */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <Pressable style={styles.btnGoogle} onPress={handleGoogle}>
            <Text style={styles.btnGoogleText}>Continuar con Google</Text>
          </Pressable>
        </View>

        {/* Registro */}
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerText}>
            ¿Aún no tienes cuenta?{' '}
            <Text style={styles.registerLink}>Regístrate</Text>
          </Text>
        </Pressable>
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
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logo: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 36,
    color: Colors.green300,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: Colors.green200,
    letterSpacing: 0.3,
  },
  form: {
    gap: Spacing.md,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    lineHeight: 36,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  errorBanner: {
    backgroundColor: 'rgba(196,68,106,0.15)',
    borderWidth: 1,
    borderColor: Colors.rose,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.rose,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.labelSmall,
    color: Colors.green200,
    textTransform: 'uppercase',
  },
  forgotLink: {
    ...Typography.bodySmall,
    color: Colors.green300,
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
  btnPrimary: {
    backgroundColor: Colors.green400,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.green600,
  },
  btnGoogle: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnGoogleText: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  registerText: {
    ...Typography.bodyMedium,
    color: Colors.green200,
    textAlign: 'center',
  },
  registerLink: {
    color: Colors.green300,
    fontWeight: '600',
  },
});
