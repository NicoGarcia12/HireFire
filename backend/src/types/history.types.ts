import type { MatchResult } from './matching.types.js';

export interface SaveSearchHistoryInput {
  profileId: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
  results: MatchResult[];
}

export interface SearchHistoryEntry {
  id: string;
  keywords: string;
  location: string | null;
  remote: boolean;
  limit: number;
  count: number;
  topResults: unknown;
  createdAt: Date;
}
