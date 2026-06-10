import type { SearchHistoryEntry } from '../../../domain/history/entities/search-history.entity.js';
import type { SearchHistoryRepository } from '../../../domain/history/interfaces/search-history-repository.interface.js';
import type { SaveSearchHistoryDto } from '../dto/search-history.dto.js';

/** Persiste una ejecución de búsqueda para historial; no debe bloquear otros flujos críticos. */
export async function saveSearchHistoryUseCase(
  repository: SearchHistoryRepository,
  input: SaveSearchHistoryDto,
): Promise<SearchHistoryEntry> {
  return repository.save(input);
}
