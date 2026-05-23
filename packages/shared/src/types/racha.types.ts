export interface Streak {
  id: string;
  userId: string;
  date: string;
  selfReported: boolean;
  godparentConfirmed: boolean;
  godparentConfirmedAt: string | null;
  relapse: boolean;
  scoreSnapshot: number | null;
}

export interface GodparentToken {
  id: string;
  streakId: string;
  token: string;
  expiresAt: string;
  used: boolean;
  frictionAnswer: string | null;
}

export interface DailyReportRequest {
  userId: string;
  date: string;
}

export interface GodparentConfirmRequest {
  frictionAnswer: string;
}
