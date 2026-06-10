import type { SavedSearch } from '../../../domain/saved-searches/entities/saved-search.entity.js';
import type { SavedSearchRepository } from '../../../domain/saved-searches/interfaces/saved-search-repository.interface.js';
import type { CreateSavedSearchDto } from '../dto/saved-search.dto.js';

export async function createSavedSearchUseCase(
  repository: SavedSearchRepository,
  input: CreateSavedSearchDto,
): Promise<SavedSearch> {
  return repository.create(input);
}
