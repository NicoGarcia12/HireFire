import type { SavedSearchRepository } from '../../../domain/saved-searches/interfaces/saved-search-repository.interface.js';

export async function deleteSavedSearchUseCase(repository: SavedSearchRepository, id: string): Promise<void> {
  await repository.delete(id);
}
