export function reportError(error: Error, context?: object): void {
  if (__DEV__) {
    console.error('[Dev Error]', error.message, context ?? '');
    return;
  }
  console.error('[Error]', error.message);
}
