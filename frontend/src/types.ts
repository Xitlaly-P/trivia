export interface Question {
  id: number;
  question: string;
  options?: string[];
  image_required?: boolean;
  points?: number;
}

export type LeaderboardEntry = [string, number];
