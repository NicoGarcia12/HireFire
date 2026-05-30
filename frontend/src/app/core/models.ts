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

export interface SearchRecord {
  id: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
  count: number;
  topResults: MatchResult[];
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  profileId: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
  createdAt: string;
}

export interface ProfileSuggestion {
  section: 'headline' | 'summary' | 'skills' | 'experience' | 'general';
  priority: 'alta' | 'media' | 'baja';
  issue: string;
  suggestion: string;
}

export interface ProfileAnalysis {
  score: number;
  strengths: string[];
  suggestions: ProfileSuggestion[];
}

export interface LinkedInImport {
  headline: string;
  summary: string;
  skills: string[];
  experience: ProfileExperience[];
  filesFound: string[];
}
