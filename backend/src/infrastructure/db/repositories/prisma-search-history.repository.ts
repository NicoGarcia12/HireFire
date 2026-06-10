import type { SearchHistoryEntry, SaveSearchHistory } from '../../../domain/history/entities/search-history.entity.js';
import type { SearchHistoryRepository } from '../../../domain/history/interfaces/search-history-repository.interface.js';
import { prisma } from '../prisma.service.js';

export class PrismaSearchHistoryRepository implements SearchHistoryRepository {
  /** Guarda solo el top 10 para mantener liviano el historial y preservar el contrato actual. */
  public async save(input: SaveSearchHistory): Promise<SearchHistoryEntry> {
    const row = await prisma.search.create({
      data: {
        profileId: input.profileId,
        keywords: input.keywords,
        location: input.location ?? null,
        remote: input.remote,
        limit: input.limit,
        count: input.results.length,
        topResults: input.results.slice(0, 10) as object[],
      },
      select: {
        id: true,
        keywords: true,
        location: true,
        remote: true,
        limit: true,
        count: true,
        topResults: true,
        createdAt: true,
      },
    });
    return row;
  }

  public async listByProfile(profileId: string): Promise<SearchHistoryEntry[]> {
    return prisma.search.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        keywords: true,
        location: true,
        remote: true,
        limit: true,
        count: true,
        topResults: true,
        createdAt: true,
      },
    });
  }

  public async delete(id: string): Promise<void> {
    await prisma.search.delete({ where: { id } });
  }
}

export const searchHistoryRepository = new PrismaSearchHistoryRepository();
