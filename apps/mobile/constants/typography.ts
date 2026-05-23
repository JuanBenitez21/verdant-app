export const Typography = {
  displayLarge: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 36,
    lineHeight: 40,
  },
  displayMedium: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
  },
  displaySmall: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    lineHeight: 28,
  },
  bodyLarge: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  labelLarge: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
} as const;
