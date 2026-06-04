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

export default function TerminosScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Términos de uso</Text>
        <Text style={styles.updated}>Última actualización: junio 2026</Text>

        <Section title="1. Uso permitido">
          <Body>
            Verdant es una plataforma de acompañamiento para el programa de cesación de nicotina
            ofrecido por tu institución. Su uso está habilitado exclusivamente para participantes
            activos del programa con correo institucional válido.
          </Body>
        </Section>

        <Section title="2. Conductas prohibidas">
          <Item>Crear cuentas falsas o suplantar identidades</Item>
          <Item>Abusar del sistema de recompensas reportando días que no son reales</Item>
          <Item>Compartir credenciales con terceros</Item>
          <Item>Usar la plataforma fuera del programa institucional autorizado</Item>
          <Item>Intentar acceder a datos de otros usuarios</Item>
        </Section>

        <Section title="3. Limitación de responsabilidad">
          <Body>
            Verdant es una herramienta de apoyo y gamificación. No reemplaza atención médica,
            tratamiento psicológico ni asesoría de salud profesional. Para apoyo clínico en cesación
            de nicotina, consulta a tu médico o los servicios de salud de tu institución.
          </Body>
        </Section>

        <Section title="4. Recompensas institucionales">
          <Body>
            Las recompensas desbloqueadas mediante el Score Verdant son otorgadas por tu institución,
            no por Verdant App. La disponibilidad, tipo y valor de las recompensas pueden cambiar
            según las políticas de cada institución.
          </Body>
        </Section>

        <Section title="5. Modificaciones">
          <Body>
            Nos reservamos el derecho de modificar estos términos con previo aviso en la app.
            El uso continuado de Verdant constituye aceptación de los términos vigentes.
          </Body>
        </Section>

        <Section title="6. Ley aplicable">
          <Body>
            Estos términos se rigen por las leyes de la República de Colombia.
            Cualquier controversia se resolverá ante los jueces competentes de Bogotá D.C.
          </Body>
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
