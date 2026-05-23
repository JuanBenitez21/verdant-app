import { getScoreLevel, SCORE_LEVELS } from '@verdant/shared';

export { getScoreLevel, SCORE_LEVELS };

export function scoreToPercent(score: number): number {
  return Math.min(100, Math.max(0, score));
}
