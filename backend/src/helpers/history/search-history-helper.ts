import { prisma } from '../../config/db.js';
import type { SaveSearchHistoryInput, SearchHistoryEntry } from '../../types/history.types.js';

const historySelect = {
  id: true,
  keywords: true,
  location: true,
  remote: true,
  limit: true,
  count: true,
  topResults: true,
  createdAt: true,
} as const;

/** Persiste una búsqueda en el historial. Guarda solo el top 10 de resultados. */
export async function saveSearchHistory(input: SaveSearchHistoryInput): Promise<SearchHistoryEntry> {
  return prisma.search.create({
    data: {
      profileId: input.profileId,
      keywords: input.keywords,
      location: input.location ?? null,
      remote: input.remote,
      limit: input.limit,
      count: input.results.length,
      topResults: input.results.slice(0, 10) as object[],
    },
    select: historySelect,
  });
}

export async function listSearchHistoryByProfile(profileId: string): Promise<SearchHistoryEntry[]> {
  return prisma.search.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: historySelect,
  });
}

export async function deleteSearchHistory(id: string): Promise<void> {
  await prisma.search.delete({ where: { id } });
}
