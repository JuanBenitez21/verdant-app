import type { PlantType } from './plants';

export interface TestUser {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly cigarettesPerDay: number;
  readonly yearsSmoking: number;
  readonly pricePerPack: number;
  readonly plantType: PlantType;
  readonly plantName: string;
  readonly godparentEmail: string;
}

export const TEST_USERS: readonly TestUser[] = [
  {
    email: 'laura@test.com',
    password: 'Verdant2026',
    name: 'Laura García',
    cigarettesPerDay: 10,
    yearsSmoking: 2,
    pricePerPack: 9000,
    plantType: 'sakura',
    plantName: 'Hanami',
    godparentEmail: 'carlos@test.com',
  },
  {
    email: 'carlos@test.com',
    password: 'Verdant2026',
    name: 'Carlos Martínez',
    cigarettesPerDay: 5,
    yearsSmoking: 1,
    pricePerPack: 9000,
    plantType: 'cactus',
    plantName: 'Rocky',
    godparentEmail: 'laura@test.com',
  },
] as const;
