// Maneja URLs entrantes antes de que el router de Expo las procese
export function redirectSystemPath({ path }: { path: string }) {
  if (path.startsWith('/padrino/confirmar/')) return path;
  if (path === '/reset-password' || path.startsWith('/reset-password?')) return path;
  if (path === '/logros') return '/(tabs)/logros';
  return path;
}
