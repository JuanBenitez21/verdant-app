export interface FunFact {
  dayTrigger: number;
  emoji: string;
  titulo: string;
  cuerpo: string;
}

export const FUN_FACTS: readonly FunFact[] = [
  {
    dayTrigger: 1,
    emoji: '🫁',
    titulo: 'Tus pulmones ya empezaron',
    cuerpo: 'A las 8 horas sin fumar, los niveles de monóxido de carbono en tu sangre se normalizan. Tu sangre ya transporta más oxígeno.',
  },
  {
    dayTrigger: 3,
    emoji: '👃',
    titulo: 'El olfato despierta',
    cuerpo: 'Tras 72 horas, las terminaciones nerviosas del olfato y el gusto comienzan a regenerarse. Los sabores son más intensos.',
  },
  {
    dayTrigger: 7,
    emoji: '💪',
    titulo: 'Una semana de poder',
    cuerpo: 'Tu riesgo de ataque cardíaco ya comenzó a reducirse. La nicotina ya no está en tu sistema.',
  },
  {
    dayTrigger: 15,
    emoji: '🌬️',
    titulo: 'Respiras diferente',
    cuerpo: 'Tu capacidad pulmonar aumentó hasta un 30%. Actividades físicas que antes te agotaban ahora son más fáciles.',
  },
  {
    dayTrigger: 30,
    emoji: '🫀',
    titulo: 'Tus pulmones te agradecen',
    cuerpo: 'Los cilios de tus bronquios se regeneraron. Filtran bacterias y facilitan la respiración. Tu capacidad pulmonar mejora entre un 10–15% este mes.',
  },
  {
    dayTrigger: 60,
    emoji: '❤️',
    titulo: 'Tu corazón late mejor',
    cuerpo: 'Tu riesgo de infarto coronario se redujo considerablemente. La presión arterial y la frecuencia cardíaca ya son similares a las de un no fumador.',
  },
  {
    dayTrigger: 100,
    emoji: '👑',
    titulo: '100 días. Eres diferente.',
    cuerpo: 'Tu riesgo de cáncer de pulmón disminuyó a la mitad comparado con un fumador activo. Tu cuerpo lleva 100 días eligiéndote.',
  },
];

// Retorna el fun fact exacto del día, o el más cercano anterior
export function getFunFact(streakDays: number): FunFact | null {
  const sorted = [...FUN_FACTS].reverse();
  return sorted.find(f => streakDays >= f.dayTrigger) ?? null;
}

// Retorna el fun fact si el día coincide exactamente con un hito
export function getFunFactForMilestone(streakDays: number): FunFact | null {
  return FUN_FACTS.find(f => f.dayTrigger === streakDays) ?? null;
}
