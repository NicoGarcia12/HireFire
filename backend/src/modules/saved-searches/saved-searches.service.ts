import { prisma } from '../../config/db.js';

export interface SavedSearchInput {
  profileId: string;
  name: string;
  keywords: string;
  location?: string;
  remote: boolean;
  limit: number;
}

export async function createSavedSearch(input: SavedSearchInput) {
  return prisma.savedSearch.create({ data: input });
}

export async function listSavedSearches(profileId: string) {
  return prisma.savedSearch.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteSavedSearch(id: string) {
  return prisma.savedSearch.delete({ where: { id } });
}
