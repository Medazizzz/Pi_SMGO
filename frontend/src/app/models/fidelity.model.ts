export type FidelityLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Fidelity {
  id: string;
  points: number;
  level: FidelityLevel;
  description: string;
}

export interface FidelityRequest {
  points: number;
  level: FidelityLevel;
  description: string;
}
