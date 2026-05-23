import type { ScoreLevelInfo, ScoreResult } from '../types/score.types';

export const SCORE_WEIGHTS = {
  wearable: {
    heartRate: 20,
    steps:     15,
    sleep:     15,
  },
  godparent:  25,
  selfReport: 15,
  coherence:  10,
} as const;

export const SCORE_LEVELS: readonly ScoreLevelInfo[] = [
  { min: 0,  max: 39,  level: 'none',         label: 'Sin nivel',        reward: null },
  { min: 40, max: 64,  level: 'basic',        label: 'Nivel básico',     reward: 'Café gratuito' },
  { min: 65, max: 84,  level: 'intermediate', label: 'Nivel intermedio', reward: 'Almuerzo' },
  { min: 85, max: 100, level: 'premium',      label: 'Nivel premium',    reward: 'Día libre / Bono' },
] as const;

export const INCOHERENCE_THRESHOLD = 35;

export function getScoreLevel(score: number): ScoreResult {
  const info = SCORE_LEVELS.find(l => score >= l.min && score <= l.max) ?? SCORE_LEVELS[0];
  return { level: info.level, label: info.label, reward: info.reward, total: score };
}
