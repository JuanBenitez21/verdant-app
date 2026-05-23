import type { PlantType, PlantStageKey } from '@verdant/shared';

export type { PlantType, PlantStageKey };

export interface PlantStageConfig {
  key: PlantStageKey;
  day: number;
  emoji: string;
  label: string;
  nextDays: number | null;
}

export const PLANT_STAGES: readonly PlantStageConfig[] = [
  { key: 'semilla',  day: 1,  emoji: '🌰', label: 'Semilla plantada', nextDays: 2  },
  { key: 'brote',    day: 3,  emoji: '🌱', label: 'Brote',            nextDays: 4  },
  { key: 'plantula', day: 7,  emoji: '🌿', label: 'Plántula',         nextDays: 8  },
  { key: 'joven',    day: 15, emoji: '🪴', label: 'Bonsai joven',     nextDays: 15 },
  { key: 'flor',     day: 30, emoji: '🌸', label: 'Primera flor',     nextDays: 30 },
  { key: 'plena',    day: 60, emoji: '🌺', label: 'Plena floración',  nextDays: null },
] as const;

export const PLANTS: Record<PlantType, { name: string; description: string; tag: string; tagColor: string; bloomDay: number }> = {
  sakura:   { name: 'Bonsai Sakura',  description: 'Delicado y poderoso. Florece al día 30.', tag: 'Favorito',   tagColor: '#fce8ef', bloomDay: 30 },
  clasico:  { name: 'Bonsai clásico', description: 'Sabiduría y paciencia. Crece fuerte.',    tag: 'Zen',        tagColor: '#eaf7f1', bloomDay: 45 },
  orquidea: { name: 'Orquídea',       description: 'Elegante y exótica. Florece en día 21.',  tag: 'Exótica',    tagColor: '#f0e8ff', bloomDay: 21 },
  cactus:   { name: 'Cactus',         description: 'Resiliente. Sobrevive todo con poco.',    tag: 'Resistente', tagColor: '#fdf0d5', bloomDay: 60 },
};

export function getPlantStage(streakDays: number): PlantStageConfig {
  const stages = [...PLANT_STAGES].reverse();
  return stages.find(s => streakDays >= s.day) ?? PLANT_STAGES[0];
}
