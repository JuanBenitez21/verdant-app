import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants';
import type { PendingConfirmation } from '@/hooks/usePadrino';

interface PadrinoCardProps {
  pendientes: PendingConfirmation[];
  onConfirmado: () => void;
}

export function PadrinoCard({ pendientes, onConfirmado }: PadrinoCardProps) {
  const router = useRouter();

  if (pendientes.length === 0) return null;

  function abrirConfirmacion(token: string) {
    router.push(`/padrino/confirmar/${token}`);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🤝</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>Tu rol como padrino</Text>
          <Text style={styles.subtitle}>
            {pendientes.length === 1
              ? '1 persona espera tu confirmación de hoy'
              : `${pendientes.length} personas esperan tu confirmación`}
          </Text>
        </View>
      </View>

      {/* Lista de apadrinados con confirmación pendiente */}
      {pendientes.map((item) => (
        <View key={item.token} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemEmoji}>{item.plantEmoji}</Text>
            <View>
              <Text style={styles.itemName}>{item.userName}</Text>
              <Text style={styles.itemSub}>
                {item.plantName} · Día {item.daysCount}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.confirmBtn}
            onPress={() => abrirConfirmacion(item.token)}
          >
            <Text style={styles.confirmBtnText}>Confirmar</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.green600,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.green200,
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  itemEmoji: {
    fontSize: 28,
  },
  itemName: {
    ...Typography.labelLarge,
    color: Colors.white,
  },
  itemSub: {
    ...Typography.bodySmall,
    color: Colors.green200,
  },
  confirmBtn: {
    backgroundColor: Colors.green400,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  confirmBtnText: {
    ...Typography.labelSmall,
    color: Colors.white,
  },
});
