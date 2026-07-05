import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { SaveSearchHistoryInput } from '../src/types/history.types.js';
import type { MatchResult } from '../src/types/matching.types.js';

const calls = { create: [] as unknown[], findMany: [] as unknown[], delete: [] as unknown[] };

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

mock.module('../src/config/db.js', {
  namedExports: {
    prisma: {
      search: {
        create: async (args: unknown) => {
          calls.create.push(args);
          return { id: 'history-1' };
        },
        findMany: async (args: unknown) => {
          calls.findMany.push(args);
          return [];
        },
        delete: async (args: unknown) => {
          calls.delete.push(args);
        },
      },
    },
  },
});

const { saveSearchHistory, listSearchHistoryByProfile, deleteSearchHistory } =
  await import('../src/helpers/history/search-history-helper.js');
const { listHistoryController } =
  await import('../src/controllers/history/list-history-controller.js');
const { deleteHistoryController } =
  await import('../src/controllers/history/delete-history-controller.js');

beforeEach(() => {
  calls.create = [];
  calls.findMany = [];
  calls.delete = [];
});

afterEach(() => mock.reset());

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

    const data = (calls.create[0] as { data: { count: number; topResults: unknown[] } }).data;
    assert.equal(data.count, 15);
    assert.equal(data.topResults.length, 10);
  });
});

describe('listSearchHistoryByProfile()', () => {
  it('lists at most the 30 most recent entries for a profile', async () => {
    await listSearchHistoryByProfile('profile-1');

    const args = calls.findMany[0] as { where: { profileId: string }; take: number };
    assert.equal(args.where.profileId, 'profile-1');
    assert.equal(args.take, 30);
  });
});

describe('deleteSearchHistory()', () => {
  it('deletes the history entry by id', async () => {
    await deleteSearchHistory('history-1');

    assert.deepEqual(calls.delete[0], { where: { id: 'history-1' } });
  });
});

describe('history controllers', () => {
  it('listHistoryController() delegates to the helper', async () => {
    await listHistoryController('profile-1');

    assert.equal(calls.findMany.length, 1);
  });

  it('deleteHistoryController() delegates to the helper', async () => {
    await deleteHistoryController('history-1');

    assert.equal(calls.delete.length, 1);
  });
});
