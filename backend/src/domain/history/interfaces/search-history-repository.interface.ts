import type { SaveSearchHistory, SearchHistoryEntry } from '../entities/search-history.entity.js';

/** Puerto para historial de búsquedas completas. */
export interface SearchHistoryRepository {
  save(input: SaveSearchHistory): Promise<SearchHistoryEntry>;
  listByProfile(profileId: string): Promise<SearchHistoryEntry[]>;
  delete(id: string): Promise<void>;
}
