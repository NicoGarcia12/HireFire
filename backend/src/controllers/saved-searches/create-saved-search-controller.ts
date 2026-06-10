import { createSavedSearch } from '../../helpers/saved-searches/saved-searches-helper.js';
import type { CreateSavedSearchInput, SavedSearch } from '../../types/saved-search.types.js';

export async function createSavedSearchController(input: CreateSavedSearchInput): Promise<SavedSearch> {
  return createSavedSearch(input);
}
