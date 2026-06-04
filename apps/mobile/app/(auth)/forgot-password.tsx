import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { supabase } from '@/services/supabase';
import { validators } from '@/utils/validators';

const T = ScreenTheme.dark;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSend() {
    const err = validators.email(email.trim());
    if (err) { setEmailError(err); return; }

    setLoading(true); setError('');
    try {
      const { error: authErr } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: 'verdant://reset-password' },
      );
      if (authErr) setError(authErr.message);
      else setSuccess(true);
    } catch { setError('Error de conexión. Intenta nuevamente.'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>verdant</Text>
        <Text style={styles.title}>Recupera tu cuenta</Text>
        <Text style={styles.subtitle}>Te enviaremos un link a tu correo institucional</Text>

        {success ? (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>📧</Text>
            <Text style={styles.successTitle}>Revisa tu correo</Text>
            <Text style={styles.successBody}>
              Enviamos un link para restablecer tu contraseña. Revisa también la carpeta de spam.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}
            <View>
              <Text style={styles.label}>Correo institucional</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="tu@universidad.edu.co"
                placeholderTextColor={Colors.green600}
                value={email}
                onChangeText={v => { setEmail(v); setEmailError(''); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSend}
                accessibilityLabel="Correo institucional"
                accessibilityHint="Ingresa tu correo de la universidad o empresa"
              />
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            </View>
            <Pressable
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSend} disabled={loading}
              accessibilityLabel="Enviar link de recuperación"
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Enviar link de recuperación</Text>}
            </Pressable>
          </View>
        )}

        <Pressable style={styles.backLink} onPress={() => router.back()} accessibilityLabel="Volver al login">
          <Text style={styles.backLinkText}>← Volver al login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl + Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.xl, justifyContent: 'center' },
  logo: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 32, color: Colors.green300, textAlign: 'center' },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: Colors.white, textAlign: 'center' },
  subtitle: { ...Typography.bodyMedium, color: Colors.green200, textAlign: 'center' },
  form: { gap: Spacing.md },
  errorBanner: { backgroundColor: 'rgba(196,68,106,0.15)', borderWidth: 1, borderColor: Colors.rose, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  errorText: { ...Typography.bodySmall, color: Colors.rose },
  label: { ...Typography.labelSmall, color: Colors.green200, textTransform: 'uppercase', marginBottom: Spacing.xs },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, color: Colors.white, ...Typography.bodyLarge },
  inputError: { borderColor: Colors.rose },
  fieldError: { ...Typography.caption, color: Colors.rose, marginTop: 4 },
  btn: { backgroundColor: Colors.green400, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xs },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...Typography.labelLarge, color: Colors.white },
  successCard: { backgroundColor: 'rgba(94,194,135,0.1)', borderWidth: 1, borderColor: Colors.green500, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  successEmoji: { fontSize: 48 },
  successTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: Colors.white },
  successBody: { ...Typography.bodyMedium, color: Colors.green200, textAlign: 'center', lineHeight: 24 },
  backLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  backLinkText: { ...Typography.bodyMedium, color: Colors.green300 },
});
