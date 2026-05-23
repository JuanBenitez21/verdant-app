import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth.store';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';

const T = ScreenTheme.light;

export default function OnboardingHabitoScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [cigarettesPerDay, setCigarettesPerDay] = useState('10');
  const [yearsSmoking, setYearsSmoking] = useState('1');
  const [pricePerPack, setPricePerPack] = useState('9000');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!cigarettesPerDay || isNaN(Number(cigarettesPerDay)) || Number(cigarettesPerDay) < 1) {
      next['cigarettesPerDay'] = 'Ingresa un número válido mayor a 0';
    }
    if (!yearsSmoking || isNaN(Number(yearsSmoking)) || Number(yearsSmoking) < 0) {
      next['yearsSmoking'] = 'Ingresa un valor válido';
    }
    if (!pricePerPack || isNaN(Number(pricePerPack)) || Number(pricePerPack) < 1000) {
      next['pricePerPack'] = 'Ingresa un precio válido (mínimo $1.000)';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleContinue() {
    if (!validate() || !user?.id) return;
    setLoading(true);
    try {
      await supabase.from('users').update({
        cigarettes_per_day: Number(cigarettesPerDay),
        years_smoking: Number(yearsSmoking),
        price_per_pack: Number(pricePerPack),
      }).eq('id', user.id);

      router.push('/(auth)/onboarding/planta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.step}>Paso 2 de 4</Text>
          <Text style={styles.title}>Tu hábito actual</Text>
          <Text style={styles.subtitle}>
            Estos datos nos ayudan a calcular cuánto ahorras y cómo mejora tu salud.
          </Text>
        </View>

        <View style={styles.form}>
          <FieldInput
            label="Cigarrillos por día"
            value={cigarettesPerDay}
            onChangeText={(v) => { setCigarettesPerDay(v); setErrors(p => ({ ...p, cigarettesPerDay: '' })); }}
            error={errors['cigarettesPerDay']}
            keyboardType="numeric"
            suffix="cigarrillos"
          />
          <FieldInput
            label="Años fumando"
            value={yearsSmoking}
            onChangeText={(v) => { setYearsSmoking(v); setErrors(p => ({ ...p, yearsSmoking: '' })); }}
            error={errors['yearsSmoking']}
            keyboardType="numeric"
            suffix="años"
          />
          <FieldInput
            label="Precio por cajetilla"
            value={pricePerPack}
            onChangeText={(v) => { setPricePerPack(v); setErrors(p => ({ ...p, pricePerPack: '' })); }}
            error={errors['pricePerPack']}
            keyboardType="numeric"
            suffix="COP"
          />
        </View>

        <Pressable
          style={[styles.btnPrimary, loading && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.btnText}>Continuar →</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  error,
  keyboardType,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  keyboardType?: 'numeric' | 'default';
  suffix?: string;
}) {
  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        <TextInput
          style={[fieldStyles.input, error ? fieldStyles.inputError : null, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          placeholderTextColor={Colors.textSoft}
        />
        {suffix ? <Text style={fieldStyles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { ...Typography.labelSmall, color: Colors.textMid, textTransform: 'uppercase', marginBottom: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
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
  error: { ...Typography.bodySmall, color: Colors.rose, marginTop: Spacing.xs },
  suffix: { ...Typography.bodyMedium, color: Colors.textSoft, minWidth: 60 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.xl },
  header: { gap: Spacing.sm },
  step: { ...Typography.labelSmall, color: Colors.green500, textTransform: 'uppercase' },
  title: { ...Typography.displayMedium, color: Colors.textDark },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMid },
  form: { gap: Spacing.md },
  btnPrimary: { backgroundColor: Colors.green800, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...Typography.labelLarge, color: Colors.white },
});
