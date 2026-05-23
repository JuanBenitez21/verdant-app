import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding/habito" />
      <Stack.Screen name="onboarding/planta" />
      <Stack.Screen name="onboarding/padrino" />
    </Stack>
  );
}
