import type { SearchHistoryEntry, SaveSearchHistory } from '../../domain/history/entities/search-history.entity.js';
import { deleteSearchHistoryUseCase } from '../../application/history/use-cases/delete-search-history.use-case.js';
import { listSearchHistoryUseCase } from '../../application/history/use-cases/list-search-history.use-case.js';
import { saveSearchHistoryUseCase } from '../../application/history/use-cases/save-search-history.use-case.js';
import { searchHistoryRepository } from '../../infrastructure/db/repositories/prisma-search-history.repository.js';

export type SaveSearchInput = SaveSearchHistory;

/** Bridge legacy para callers existentes de historial. */
export async function saveSearch(input: SaveSearchInput): Promise<SearchHistoryEntry> {
  return saveSearchHistoryUseCase(searchHistoryRepository, input);
}

export async function listSearches(profileId: string): Promise<SearchHistoryEntry[]> {
  return listSearchHistoryUseCase(searchHistoryRepository, profileId);
}

export async function deleteSearch(id: string): Promise<void> {
  await deleteSearchHistoryUseCase(searchHistoryRepository, id);
}
