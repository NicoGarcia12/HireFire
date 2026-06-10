import { prisma } from '../../config/db.js';
import type { CreateSavedSearchInput, SavedSearch } from '../../types/saved-search.types.js';

export async function createSavedSearch(input: CreateSavedSearchInput): Promise<SavedSearch> {
  return prisma.savedSearch.create({
    data: {
      profileId: input.profileId,
      name: input.name,
      keywords: input.keywords,
      location: input.location ?? null,
      remote: input.remote,
      limit: input.limit,
    },
  });
}

export async function listSavedSearchesByProfile(profileId: string): Promise<SavedSearch[]> {
  return prisma.savedSearch.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await prisma.savedSearch.delete({ where: { id } });
}
