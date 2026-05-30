/** Contratos compartidos con el backend (backend/src/types/domain.ts). */

export interface ProfileExperience {
  title: string;
  company: string;
  description: string;
}

export interface ProfilePreferences {
  locations: string[];
  remote: boolean;
  seniority?: string;
}

export interface Profile {
  id: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  preferences: ProfilePreferences;
}

export interface MatchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  postedAt?: string;
  score: number;
  reasons: string[];
  gaps: string[];
}

export interface SearchResponse {
  count: number;
  results: MatchResult[];
}
