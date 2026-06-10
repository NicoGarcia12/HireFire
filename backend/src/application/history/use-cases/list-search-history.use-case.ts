import type { SearchHistoryEntry } from '../../../domain/history/entities/search-history.entity.js';
import type { SearchHistoryRepository } from '../../../domain/history/interfaces/search-history-repository.interface.js';

export async function listSearchHistoryUseCase(
  repository: SearchHistoryRepository,
  profileId: string,
): Promise<SearchHistoryEntry[]> {
  return repository.listByProfile(profileId);
}
