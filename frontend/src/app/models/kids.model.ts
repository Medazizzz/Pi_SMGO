/**
 * Kids Content Model
 * WHY: Defines the structure for kid-friendly content
 */

export type AgeGroup = '2-5' | '6-9' | '10-13' | 'FAMILY';
export type KidsContentType = 'MOVIE' | 'SERIES' | 'EDUCATIONAL' | 'ANIMATION';

export interface KidsContent {
  id: string;
  title: string;
  description: string;
  ageGroup: AgeGroup;
  contentType: KidsContentType;
  rating: number;
  duration: string;
  image: string;
  thumbnail?: string;
  genre: string;
  characters?: string[]; // e.g., ['Elmo', 'SpongeBob']
  isEducational: boolean;
  releasedYear?: number;
  featured?: boolean;
  isFavorite?: boolean;
}

export interface KidsCategory {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
}

export interface KidsRecommendation {
  id: string;
  contentId: string;
  title: string;
  reason: string;
  image: string;
  ageGroup: AgeGroup;
}
