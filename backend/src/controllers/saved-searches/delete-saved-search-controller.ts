import { deleteSavedSearch } from '../../helpers/saved-searches/saved-searches-helper.js';

export async function deleteSavedSearchController(id: string): Promise<void> {
  await deleteSavedSearch(id);
}
