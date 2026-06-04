import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { supabase } from '@/services/supabase';

const T = ScreenTheme.dark;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!password) e.password = 'La contraseña es requerida';
    else if (password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!confirm) e.confirm = 'Confirma tu contraseña';
    else if (password !== confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleUpdate() {
    if (!validate()) return;
    setLoading(true); setGlobalError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setGlobalError(error.message);
      else router.replace('/(tabs)/' as never);
    } catch { setGlobalError('Error de conexión. Intenta nuevamente.'); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>verdant</Text>
        <Text style={styles.title}>Nueva contraseña</Text>
        <Text style={styles.subtitle}>Elige una contraseña de al menos 8 caracteres</Text>

        {globalError ? <View style={styles.errorBanner}><Text style={styles.errorText}>{globalError}</Text></View> : null}

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="••••••••" placeholderTextColor={Colors.green600}
              value={password}
              onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
              secureTextEntry returnKeyType="next"
              accessibilityLabel="Nueva contraseña"
            />
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>
          <View>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={[styles.input, errors.confirm && styles.inputError]}
              placeholder="••••••••" placeholderTextColor={Colors.green600}
              value={confirm}
              onChangeText={v => { setConfirm(v); setErrors(e => ({ ...e, confirm: undefined })); }}
              secureTextEntry returnKeyType="done" onSubmitEditing={handleUpdate}
              accessibilityLabel="Confirmar contraseña"
            />
            {errors.confirm && <Text style={styles.fieldError}>{errors.confirm}</Text>}
          </View>
          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleUpdate} disabled={loading}
            accessibilityLabel="Guardar nueva contraseña"
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Guardar contraseña</Text>}
          </Pressable>
        </View>
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
  errorBanner: { backgroundColor: 'rgba(196,68,106,0.15)', borderWidth: 1, borderColor: Colors.rose, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  errorText: { ...Typography.bodySmall, color: Colors.rose },
  form: { gap: Spacing.md },
  label: { ...Typography.labelSmall, color: Colors.green200, textTransform: 'uppercase', marginBottom: Spacing.xs },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, color: Colors.white, ...Typography.bodyLarge },
  inputError: { borderColor: Colors.rose },
  fieldError: { ...Typography.caption, color: Colors.rose, marginTop: 4 },
  btn: { backgroundColor: Colors.green400, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.xs },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...Typography.labelLarge, color: Colors.white },
});
