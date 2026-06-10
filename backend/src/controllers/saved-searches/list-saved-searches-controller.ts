import { listSavedSearchesByProfile } from '../../helpers/saved-searches/saved-searches-helper.js';
import type { SavedSearch } from '../../types/saved-search.types.js';

export async function listSavedSearchesController(profileId: string): Promise<SavedSearch[]> {
  return listSavedSearchesByProfile(profileId);
}
