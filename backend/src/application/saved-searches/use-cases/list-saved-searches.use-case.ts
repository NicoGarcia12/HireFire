import type { SavedSearch } from '../../../domain/saved-searches/entities/saved-search.entity.js';
import type { SavedSearchRepository } from '../../../domain/saved-searches/interfaces/saved-search-repository.interface.js';

export async function listSavedSearchesUseCase(
  repository: SavedSearchRepository,
  profileId: string,
): Promise<SavedSearch[]> {
  return repository.listByProfile(profileId);
}
