export interface ScoreComponents {
  wearableHrPts: number;
  wearableStepsPts: number;
  wearableSleepPts: number;
  godparentPts: number;
  selfReportPts: number;
  coherencePts: number;
  totalScore: number;
  incoherenceFlag: boolean;
}

export type ScoreLevel = 'none' | 'basic' | 'intermediate' | 'premium';

export interface ScoreResult {
  level: ScoreLevel;
  label: string;
  reward: string | null;
  total: number;
}

export interface ScoreLevelInfo {
  min: number;
  max: number;
  level: ScoreLevel;
  label: string;
  reward: string | null;
}
