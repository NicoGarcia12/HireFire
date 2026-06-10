import { listSearchHistoryByProfile } from '../../helpers/history/search-history-helper.js';
import type { SearchHistoryEntry } from '../../types/history.types.js';

export async function listHistoryController(profileId: string): Promise<SearchHistoryEntry[]> {
  return listSearchHistoryByProfile(profileId);
}
