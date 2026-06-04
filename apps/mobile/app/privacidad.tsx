import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';

const T = ScreenTheme.light;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Item({ children }: { children: string }) {
  return <Text style={styles.item}>• {children}</Text>;
}

export default function PrivacidadScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Política de privacidad</Text>
        <Text style={styles.updated}>Última actualización: junio 2026</Text>

        <Section title="1. Responsable del tratamiento">
          <Body>Verdant App, Colombia.</Body>
          <Body>Contacto: privacidad@verdant.app</Body>
        </Section>

        <Section title="2. Datos que recopilamos">
          <Item>Identificación: nombre completo, correo institucional</Item>
          <Item>Hábito: cigarrillos por día, años fumando, precio del paquete</Item>
          <Item>Progreso: días sin fumar auto-reportados, logros desbloqueados</Item>
          <Item>
            Biometría estimada: FC, pasos y sueño generados algorítmicamente basados en tu progreso.
            NO recopilamos datos de tu dispositivo wearable.
          </Item>
          <Item>Uso: interacciones con la app, rachas, score</Item>
          <Item>Notificaciones: token de push (para recordatorios)</Item>
        </Section>

        <Section title="3. Finalidad">
          <Item>Prestar el servicio de acompañamiento para dejar de fumar</Item>
          <Item>Calcular el Score Verdant para gestión de recompensas</Item>
          <Item>Enviar recordatorios y notificaciones de confirmación</Item>
          <Item>Generar reportes agregados y anónimos para tu institución</Item>
        </Section>

        <Section title="4. Lo que NO compartimos">
          <Item>No vendemos datos a terceros</Item>
          <Item>Tu institución solo ve: Score Verdant agregado y estado de hitos</Item>
          <Item>Tu padrino solo ve: tu nombre, planta y días de racha</Item>
          <Item>Datos biométricos individuales: nunca se comparten</Item>
        </Section>

        <Section title="5. Retención">
          <Body>
            Datos activos mientras tengas cuenta. Solicita eliminación escribiendo a privacidad@verdant.app.
          </Body>
        </Section>

        <Section title="6. Tus derechos (Ley 1581 de 2012)">
          <Item>Conocer, actualizar y rectificar tus datos</Item>
          <Item>Solicitar supresión de datos</Item>
          <Item>Revocar autorización</Item>
          <Item>Quejas ante la Superintendencia de Industria y Comercio</Item>
        </Section>

        <Section title="7. Seguridad">
          <Item>Cifrado HTTPS/TLS en tránsito</Item>
          <Item>Contraseñas con hash (Supabase Auth)</Item>
          <Item>Acceso restringido por roles</Item>
        </Section>

        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Entendido</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: { ...Typography.displayMedium, color: Colors.textDark },
  updated: { ...Typography.bodySmall, color: Colors.textSoft },
  section: { gap: Spacing.xs },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textDark, marginBottom: 4 },
  body: { ...Typography.bodyMedium, color: Colors.textMid, lineHeight: 22 },
  item: { ...Typography.bodyMedium, color: Colors.textMid, lineHeight: 22, paddingLeft: Spacing.xs },
  btn: {
    backgroundColor: Colors.green800,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  btnText: { ...Typography.labelLarge, color: Colors.white },
});
