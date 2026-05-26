import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { usePlantaStore } from '@/store/planta.store';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';
import { PLANTS } from '@/constants/plants';
import type { PlantType } from '@verdant/shared';

const T = ScreenTheme.light;
const PLANT_OPTIONS: PlantType[] = ['sakura', 'clasico', 'orquidea', 'cactus'];

export default function OnboardingPlantaScreen() {
  const router = useRouter();
  const { setPlant } = usePlantaStore();

  const [selectedType, setSelectedType] = useState<PlantType>('sakura');
  const [plantName, setPlantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  async function handleContinue() {
    const name = plantName.trim() || PLANTS[selectedType].name;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert('Error', 'Sesión no encontrada. Vuelve a iniciar sesión.');
        return;
      }

      const { error } = await supabase.from('users').update({
        plant_type: selectedType,
        plant_name: name,
      }).eq('id', session.user.id);

      if (error) throw error;
      setPlant(selectedType, name);
      router.push('/(auth)/onboarding/padrino');
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.header}>
        <View style={dotStyles.row}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={[dotStyles.dot, n === 3 && dotStyles.dotActive]} />
          ))}
        </View>
        <Text style={styles.step}>Paso 3 de 4</Text>
        <Text style={styles.title}>Elige tu planta</Text>
        <Text style={styles.subtitle}>Crecerá con tu racha. Cuídala.</Text>
      </View>

      <View style={styles.grid}>
        {PLANT_OPTIONS.map((type) => {
          const plant = PLANTS[type];
          const isSelected = selectedType === type;
          return (
            <Pressable
              key={type}
              style={[styles.plantCard, isSelected && styles.plantCardSelected]}
              onPress={() => setSelectedType(type)}
            >
              <View style={[styles.tag, { backgroundColor: plant.tagColor }]}>
                <Text style={styles.tagText}>{plant.tag}</Text>
              </View>
              <Text style={styles.plantEmoji}>
                {type === 'sakura' ? '🌸' : type === 'clasico' ? '🪴' : type === 'orquidea' ? '🌺' : '🌵'}
              </Text>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.plantDesc}>{plant.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <View>
        <Text style={styles.label}>Dale un nombre (opcional)</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : null]}
          placeholder={`Ej: ${PLANTS[selectedType].name}`}
          placeholderTextColor={Colors.textSoft}
          value={plantName}
          onChangeText={(v) => { setPlantName(v); setNameError(''); }}
          maxLength={30}
        />
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
      </View>

      <Pressable
        style={[styles.btnPrimary, loading && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.btnText}>Plantar semilla →</Text>
        }
      </Pressable>
    </ScrollView>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: Radius.full, backgroundColor: Colors.warm },
  dotActive: { backgroundColor: Colors.green500, width: 24 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, gap: Spacing.xl },
  header: { gap: Spacing.sm },
  step: { ...Typography.labelSmall, color: Colors.green500, textTransform: 'uppercase' },
  title: { ...Typography.displayMedium, color: Colors.textDark },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMid },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  plantCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.warm,
  },
  plantCardSelected: { borderColor: Colors.green500 },
  tag: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  tagText: { ...Typography.caption, color: Colors.textDark, fontWeight: '600' },
  plantEmoji: { fontSize: 36 },
  plantName: { ...Typography.labelLarge, color: Colors.textDark },
  plantDesc: { ...Typography.bodySmall, color: Colors.textMid },
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
});
