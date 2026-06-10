import type { CreateSavedSearch, SavedSearch } from '../../../domain/saved-searches/entities/saved-search.entity.js';
import type { SavedSearchRepository } from '../../../domain/saved-searches/interfaces/saved-search-repository.interface.js';
import { prisma } from '../prisma.service.js';

export class PrismaSavedSearchRepository implements SavedSearchRepository {
  public async create(input: CreateSavedSearch): Promise<SavedSearch> {
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

  public async listByProfile(profileId: string): Promise<SavedSearch[]> {
    return prisma.savedSearch.findMany({ where: { profileId }, orderBy: { createdAt: 'desc' } });
  }

  public async delete(id: string): Promise<void> {
    await prisma.savedSearch.delete({ where: { id } });
  }
}

export const savedSearchRepository = new PrismaSavedSearchRepository();
