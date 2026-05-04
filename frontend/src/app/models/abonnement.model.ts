export type AbonnementType = 'BASIC' | 'PREMIUM';

export interface Abonnement {
  id: string;
  type: AbonnementType;
  prix: number;
  description: string;
}

export interface AbonnementRequest {
  type: AbonnementType;
  prix: number;
  description: string;
}
