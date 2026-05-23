export interface FunFact {
  dayTrigger: number;
  title: string;
  body: string;
  emoji: string;
}

export const FUN_FACTS: readonly FunFact[] = [
  {
    dayTrigger: 1,
    emoji: '💨',
    title: '¡Tu cuerpo ya reacciona!',
    body: 'A las 20 horas sin fumar, el monóxido de carbono en tu sangre baja a niveles normales.',
  },
  {
    dayTrigger: 3,
    emoji: '👃',
    title: 'Hueles mejor',
    body: 'A los 3 días tus terminaciones nerviosas del olfato y gusto empiezan a regenerarse.',
  },
  {
    dayTrigger: 7,
    emoji: '🫁',
    title: 'Tus pulmones limpian',
    body: 'Los cilios de tus vías respiratorias ya recuperaron su función de filtrado.',
  },
  {
    dayTrigger: 15,
    emoji: '❤️',
    title: 'Tu corazón te lo agradece',
    body: 'El riesgo de infarto ya disminuyó significativamente. ¡Vas a la mitad del camino hacia el día 30!',
  },
  {
    dayTrigger: 30,
    emoji: '🌸',
    title: '¡Un mes limpio!',
    body: 'Tu circulación mejoró, tienes más energía y tu piel se ve diferente. Tu planta floreció.',
  },
  {
    dayTrigger: 60,
    emoji: '🌺',
    title: '¡Dos meses de libertad!',
    body: 'La función pulmonar mejoró hasta un 30%. Correr o subir escaleras ya no es lo mismo.',
  },
  {
    dayTrigger: 100,
    emoji: '🏆',
    title: '100 días. Eres imparable.',
    body: 'Estadísticamente, pasaste el punto más difícil. La probabilidad de recaída disminuye cada día.',
  },
];

export function getFunFact(streakDays: number): FunFact | null {
  return FUN_FACTS.find(f => f.dayTrigger === streakDays) ?? null;
}
