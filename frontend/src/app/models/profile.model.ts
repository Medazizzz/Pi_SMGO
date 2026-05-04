/**
 * User Profile Model
 * WHY: Defines the structure for user profiles and family accounts
 */

export type ProfileType = 'ADULT' | 'KIDS' | 'TEEN';

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  type: ProfileType;
  avatar: string;
  color?: string;
  isDefault?: boolean;
  ageRestriction?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProfileSelectionData {
  userId: string;
  profiles: UserProfile[];
  selectedProfileId?: string;
}

export interface CreateProfileRequest {
  name: string;
  type: ProfileType;
  avatar?: string;
}
