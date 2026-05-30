import { prisma } from '../../config/db.js';
import type { MatchResult } from '../../types/domain.js';

export interface SaveSearchInput {
  profileId: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
  results: MatchResult[];
}

export async function saveSearch(input: SaveSearchInput) {
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
  });
}

export async function listSearches(profileId: string) {
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

export async function deleteSearch(id: string) {
  return prisma.search.delete({ where: { id } });
}
