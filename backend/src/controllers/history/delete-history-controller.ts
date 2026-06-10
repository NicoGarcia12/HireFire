import { deleteSearchHistory } from '../../helpers/history/search-history-helper.js';

export async function deleteHistoryController(id: string): Promise<void> {
  await deleteSearchHistory(id);
}
