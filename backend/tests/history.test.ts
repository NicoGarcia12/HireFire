import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveSearchHistoryInput } from '../src/types/history.types.js';
import type { MatchResult } from '../src/types/matching.types.js';

function job(id: string): MatchResult {
  return {
    id,
    title: `Job ${id}`,
    company: 'Acme',
    location: 'CABA',
    remote: true,
    description: '',
    url: `https://example.com/${id}`,
    score: 50,
    reasons: [],
    gaps: [],
  };
}

const mocks = vi.hoisted(() => ({
  create: vi.fn(async () => ({ id: 'history-1' })),
  findMany: vi.fn(async () => []),
  delete: vi.fn(async () => undefined),
}));

vi.mock('../src/config/db.js', () => ({
  prisma: { search: { create: mocks.create, findMany: mocks.findMany, delete: mocks.delete } },
}));

import {
  saveSearchHistory,
  listSearchHistoryByProfile,
  deleteSearchHistory,
} from '../src/helpers/history/search-history-helper.js';
import { listHistoryController } from '../src/controllers/history/list-history-controller.js';
import { deleteHistoryController } from '../src/controllers/history/delete-history-controller.js';

beforeEach(() => {
  mocks.create.mockClear();
  mocks.findMany.mockClear();
  mocks.delete.mockClear();
});

describe('saveSearchHistory()', () => {
  it('stores only the top 10 results but keeps the full result count', async () => {
    const results = Array.from({ length: 15 }, (_, i) => job(`job-${i}`));
    const input: SaveSearchHistoryInput = {
      profileId: 'profile-1',
      keywords: 'backend',
      remote: false,
      limit: 30,
      results,
    };

    await saveSearchHistory(input);

    const data = mocks.create.mock.calls[0]?.[0].data;
    expect(data.count).toBe(15);
    expect(data.topResults.length).toBe(10);
  });
});

describe('listSearchHistoryByProfile()', () => {
  it('lists at most the 30 most recent entries for a profile', async () => {
    await listSearchHistoryByProfile('profile-1');

    const args = mocks.findMany.mock.calls[0]?.[0];
    expect(args.where.profileId).toBe('profile-1');
    expect(args.take).toBe(30);
  });
});

describe('deleteSearchHistory()', () => {
  it('deletes the history entry by id', async () => {
    await deleteSearchHistory('history-1');

    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 'history-1' } });
  });
});

describe('history controllers', () => {
  it('listHistoryController() delegates to the helper', async () => {
    await listHistoryController('profile-1');

    expect(mocks.findMany).toHaveBeenCalledTimes(1);
  });

  it('deleteHistoryController() delegates to the helper', async () => {
    await deleteHistoryController('history-1');

    expect(mocks.delete).toHaveBeenCalledTimes(1);
  });
});
