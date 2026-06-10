import type { SearchHistoryRepository } from '../../../domain/history/interfaces/search-history-repository.interface.js';

export async function deleteSearchHistoryUseCase(repository: SearchHistoryRepository, id: string): Promise<void> {
  await repository.delete(id);
}
