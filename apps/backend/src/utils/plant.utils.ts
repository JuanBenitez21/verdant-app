interface PlantStage {
  key: string;
  day: number;
  emoji: string;
  label: string;
}

const PLANT_STAGES: readonly PlantStage[] = [
  { key: 'semilla',  day: 1,  emoji: '🌰', label: 'Semilla plantada' },
  { key: 'brote',    day: 3,  emoji: '🌱', label: 'Brote' },
  { key: 'plantula', day: 7,  emoji: '🌿', label: 'Plántula' },
  { key: 'joven',    day: 15, emoji: '🪴', label: 'Bonsai joven' },
  { key: 'flor',     day: 30, emoji: '🌸', label: 'Primera flor' },
  { key: 'plena',    day: 60, emoji: '🌺', label: 'Plena floración' },
];

export function getPlantStage(streakDays: number): PlantStage {
  const sorted = [...PLANT_STAGES].reverse();
  return sorted.find(s => streakDays >= s.day) ?? PLANT_STAGES[0]!;
}
