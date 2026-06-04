import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants';

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🌿</Text>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.subtitle}>No te preocupes, tu progreso está guardado</Text>
        <Pressable
          style={styles.btn}
          onPress={() => this.setState({ hasError: false, error: null })}
          accessibilityLabel="Reintentar cargar la pantalla"
        >
          <Text style={styles.btnText}>Reintentar</Text>
        </Pressable>
        {__DEV__ && this.state.error && (
          <Text style={styles.devError}>{this.state.error.toString()}</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.cream,
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl, gap: Spacing.md,
  },
  emoji: { fontSize: 64 },
  title: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: Colors.textDark, textAlign: 'center' },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMid, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.green400, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  btnText: { ...Typography.labelLarge, color: Colors.white },
  devError: { ...Typography.caption, color: Colors.textSoft, marginTop: Spacing.md, textAlign: 'center' },
});
