import type { MatchResult } from '../../../domain/matching/models/match-result.model';

export interface SearchResponse {
  count: number;
  results: MatchResult[];
}
