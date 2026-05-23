export type PlantType = 'sakura' | 'clasico' | 'orquidea' | 'cactus';

export type PlantStageKey = 'semilla' | 'brote' | 'plantula' | 'joven' | 'flor' | 'plena';

export interface PlantStage {
  key: PlantStageKey;
  day: number;
  emoji: string;
  label: string;
  nextDays: number | null;
}

export interface Achievement {
  id: string;
  userId: string;
  achievementKey: AchievementKey;
  unlockedAt: string;
  rewardClaimed: boolean;
  rewardClaimedAt: string | null;
}

export type AchievementKey =
  | 'day_1'
  | 'day_3'
  | 'day_7'
  | 'day_15'
  | 'day_30'
  | 'day_60'
  | 'day_100';
