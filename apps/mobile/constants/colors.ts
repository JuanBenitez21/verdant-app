export const Colors = {
  green900: '#0d2618',
  green800: '#163d26',
  green700: '#1e5435',
  green600: '#276945',
  green500: '#2d7a4f',
  green400: '#3d9e67',
  green300: '#5ec287',
  green200: '#9eddb9',
  green100: '#cff0df',
  green50:  '#eaf7f1',

  cream:    '#f5f2eb',
  warm:     '#ede8de',

  textDark: '#0d1f15',
  textMid:  '#3a5245',
  textSoft: '#7a9a87',

  amber:      '#d4820a',
  amberLight: '#fdf0d5',
  rose:       '#c4446a',
  roseLight:  '#fce8ef',

  white: '#ffffff',
} as const;

export const ScreenTheme = {
  dark: {
    bg:            Colors.green900,
    bgSecondary:   Colors.green800,
    surface:       'rgba(255,255,255,0.05)',
    border:        'rgba(255,255,255,0.10)',
    textPrimary:   Colors.white,
    textSecondary: Colors.green200,
    textTertiary:  Colors.green100,
  },
  light: {
    bg:            Colors.cream,
    bgSecondary:   Colors.warm,
    surface:       Colors.white,
    border:        Colors.warm,
    textPrimary:   Colors.textDark,
    textSecondary: Colors.textMid,
    textTertiary:  Colors.textSoft,
  },
} as const;
