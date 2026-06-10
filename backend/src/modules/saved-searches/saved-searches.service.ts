import type { CreateSavedSearch, SavedSearch } from '../../domain/saved-searches/entities/saved-search.entity.js';
import { createSavedSearchUseCase } from '../../application/saved-searches/use-cases/create-saved-search.use-case.js';
import { deleteSavedSearchUseCase } from '../../application/saved-searches/use-cases/delete-saved-search.use-case.js';
import { listSavedSearchesUseCase } from '../../application/saved-searches/use-cases/list-saved-searches.use-case.js';
import { savedSearchRepository } from '../../infrastructure/db/repositories/prisma-saved-search.repository.js';

export type SavedSearchInput = CreateSavedSearch;

/** Bridge legacy para conservar contratos de módulos antiguos mientras se migran callers. */
export async function createSavedSearch(input: SavedSearchInput): Promise<SavedSearch> {
  return createSavedSearchUseCase(savedSearchRepository, input);
}

export async function listSavedSearches(profileId: string): Promise<SavedSearch[]> {
  return listSavedSearchesUseCase(savedSearchRepository, profileId);
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await deleteSavedSearchUseCase(savedSearchRepository, id);
}
