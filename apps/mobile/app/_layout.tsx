import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { OnboardingSlides } from '@/components/onboarding/OnboardingSlides';

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'onboarding_completed';
const queryClient = new QueryClient();

function RootNavigator() {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then(val => {
        if (val !== 'true' && !accessToken) setShowOnboarding(true);
        setOnboardingChecked(true);
      })
      .catch(() => setOnboardingChecked(true));
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingChecked || showOnboarding) return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[1] === 'onboarding';
    if (!accessToken && !inAuth) router.replace('/(auth)/login');
    else if (accessToken && inAuth && !inOnboarding) router.replace('/(tabs)');
  }, [accessToken, isLoading, onboardingChecked, showOnboarding]);

  if (showOnboarding) {
    return (
      <OnboardingSlides onComplete={async () => {
        await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
        setShowOnboarding(false);
      }} />
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <OfflineBanner />
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
