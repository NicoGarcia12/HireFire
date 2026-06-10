import type { MatchResult } from '../../matching/models/match-result.model';

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
