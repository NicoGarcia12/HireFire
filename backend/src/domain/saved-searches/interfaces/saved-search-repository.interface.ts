import type { CreateSavedSearch, SavedSearch } from '../entities/saved-search.entity.js';

/** Puerto para búsquedas guardadas reutilizables por el usuario. */
export interface SavedSearchRepository {
  create(input: CreateSavedSearch): Promise<SavedSearch>;
  listByProfile(profileId: string): Promise<SavedSearch[]>;
  delete(id: string): Promise<void>;
}
