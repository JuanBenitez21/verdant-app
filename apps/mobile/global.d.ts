// Expo SDK 51 inyecta EXPO_PUBLIC_* via metro/babel en process.env
// TypeScript necesita conocer el tipo de estas variables
declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_API_URL?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  };
};
