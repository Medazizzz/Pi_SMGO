export interface RecommendationResult {
  userId:          string;
  recommande:      string;   // BASIC | PREMIUM | ELITE
  matchBasic:      number;   // ex: 78
  matchPremium:    number;   // ex: 15
  matchElite:      number;   // ex: 7
  scoreNormalise:  number;
  churnRisk:       number;
  totalDepense:    number;
  frequence:       number;
  tendanceGamme:   number;
  ancienneteJours: number;
  actifRecemment:  boolean;
  typeDominant:    string;
  nbReservations:  number;
  raisons:         string[];
  calculatedAt:    string;
}