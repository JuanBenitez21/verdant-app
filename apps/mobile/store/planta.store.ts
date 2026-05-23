import { create } from 'zustand';
import type { PlantType } from '@verdant/shared';
import { getPlantStage, type PlantStageConfig } from '@/constants/plants';

interface PlantaState {
  plantType: PlantType;
  plantName: string;
  streakDays: number;
  currentStage: PlantStageConfig;
  setPlant: (type: PlantType, name: string) => void;
  setStreakDays: (days: number) => void;
}

export const usePlantaStore = create<PlantaState>((set) => ({
  plantType: 'sakura',
  plantName: 'Mi planta',
  streakDays: 0,
  currentStage: getPlantStage(0),

  setPlant: (plantType, plantName) => set({ plantType, plantName }),
  setStreakDays: (days) => set({ streakDays: days, currentStage: getPlantStage(days) }),
}));
