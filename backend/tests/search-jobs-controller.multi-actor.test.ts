import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const ACTOR_A = 'actor-a';
  const ACTOR_B = 'actor-b';
  const state: { actorCalls: string[]; failActorId: string | null } = {
    actorCalls: [],
    failActorId: null,
  };

  return {
    ACTOR_A,
    ACTOR_B,
    state,
    actor: (actorId: string) => ({
      call: async () => {
        state.actorCalls.push(actorId);
        if (actorId === state.failActorId) throw new Error('actor bloqueado por LinkedIn');
        return { defaultDatasetId: `dataset-${actorId}` };
      },
    }),
    dataset: (datasetId: string) => ({
      listItems: async () => {
        if (datasetId === `dataset-${ACTOR_A}`) {
          return { items: [{ id: 'shared', title: 'Backend Dev A', jobUrl: 'https://x/shared' }] };
        }
        if (datasetId === `dataset-${ACTOR_B}`) {
          return {
            items: [
              { id: 'shared', title: 'Backend Dev B (dup)', jobUrl: 'https://x/shared' },
              { id: 'only-b', title: 'Frontend Dev', jobUrl: 'https://x/only-b' },
            ],
          };
        }
        return { items: [] };
      },
    }),
  };
});

vi.mock('../src/config/env.js', () => ({
  env: {
    port: 3000,
    databaseUrl: 'postgres://fake',
    apify: { token: 'fake-token', jobsActors: [mocks.ACTOR_A, mocks.ACTOR_B] },
    groq: { apiKey: 'fake-key', baseUrl: 'https://fake', model: 'fake-model' },
  },
}));

vi.mock('../src/utils/apify-client.js', () => ({
  apify: { actor: mocks.actor, dataset: mocks.dataset },
}));

vi.mock('../src/utils/http-client.js', () => ({
  fetchJson: vi.fn().mockRejectedValue(new Error('red deshabilitada en este test')),
}));

import { searchJobsController } from '../src/controllers/jobs/search-jobs-controller.js';

beforeEach(() => {
  mocks.state.actorCalls = [];
  mocks.state.failActorId = null;
});

describe('searchJobsController() — múltiples actores Apify (APIFY_JOBS_ACTORS)', () => {
  it('combina y dedupea por URL los resultados de todos los actores configurados', async () => {
    const jobs = await searchJobsController({ keywords: 'multi-actor-1', limit: 10 });

    expect(mocks.state.actorCalls).toEqual([mocks.ACTOR_A, mocks.ACTOR_B]);
    expect(jobs).toHaveLength(2);
    expect(jobs.map((job) => job.id).sort()).toEqual(['only-b', 'shared']);
  });

  it('si un actor falla, sigue con el siguiente en vez de cortar la búsqueda', async () => {
    mocks.state.failActorId = mocks.ACTOR_A;

    const jobs = await searchJobsController({ keywords: 'multi-actor-2', limit: 10 });

    expect(mocks.state.actorCalls).toEqual([mocks.ACTOR_A, mocks.ACTOR_B]);
    expect(jobs.map((job) => job.id).sort()).toEqual(['only-b', 'shared']);
  });
});
