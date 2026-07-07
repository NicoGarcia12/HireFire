import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from '../src/types/job.types.js';
import type { Profile } from '../src/types/profile.types.js';

const profile: Profile = {
  id: 'profile-1',
  headline: 'Backend Developer',
  summary: 'Experienced dev',
  skills: ['Node.js'],
  experience: [{ title: 'Dev', company: 'Acme', description: 'Built things' }],
  preferences: { locations: ['CABA'], remote: true, seniority: 'senior' },
};

function job(id: string): Job {
  return {
    id,
    title: `Job ${id}`,
    company: 'Acme',
    location: 'CABA',
    remote: true,
    description: '',
    url: `https://example.com/${id}`,
  };
}

const mocks = vi.hoisted(() => {
  const state = { nextResponseText: '' };
  return {
    state,
    chatCreate: vi.fn(async () => ({
      choices: [{ message: { content: state.nextResponseText } }],
    })),
  };
});

vi.mock('../src/config/env.js', () => ({
  env: {
    port: 3000,
    databaseUrl: 'postgres://fake',
    apify: { token: 'fake-token', jobsActor: 'fake-actor' },
    groq: { apiKey: 'fake-key', baseUrl: 'https://fake', model: 'fake-model' },
  },
}));

vi.mock('../src/utils/groq-client.js', () => ({
  groq: { chat: { completions: { create: mocks.chatCreate } } },
}));

import { rankJobsController } from '../src/controllers/matching/rank-jobs-controller.js';
import { analyzeProfileWithGroq } from '../src/controllers/matching/groq-analysis-controller.js';

beforeEach(() => {
  mocks.chatCreate.mockClear();
  mocks.state.nextResponseText = '';
});

describe('rankJobsController()', () => {
  it('scores jobs from the model response and sorts descending by score', async () => {
    mocks.state.nextResponseText = JSON.stringify({
      results: [
        { id: 'a', score: 40, reasons: ['ok'], gaps: [] },
        { id: 'b', score: 90, reasons: ['great fit'], gaps: [] },
      ],
    });

    const results = await rankJobsController(profile, [job('a'), job('b')]);

    expect(results.map((r) => r.id)).toEqual(['b', 'a']);
    expect(results[0]?.score).toBe(90);
  });

  it('defaults score/reasons/gaps to safe values when the model omits a job', async () => {
    mocks.state.nextResponseText = JSON.stringify({
      results: [{ id: 'a', score: 70, reasons: [], gaps: [] }],
    });

    const results = await rankJobsController(profile, [job('a'), job('b')]);
    const missing = results.find((r) => r.id === 'b');

    expect(missing).toEqual({ ...job('b'), score: 0, reasons: [], gaps: [] });
  });

  it('batches jobs in groups of 8, issuing one model call per batch', async () => {
    mocks.state.nextResponseText = JSON.stringify({ results: [] });
    const jobs = Array.from({ length: 9 }, (_, i) => job(`job-${i}`));

    await rankJobsController(profile, jobs);

    expect(mocks.chatCreate).toHaveBeenCalledTimes(2);
  });

  it('tolerates unparsable model output by scoring everything as 0', async () => {
    mocks.state.nextResponseText = 'not json at all';

    const results = await rankJobsController(profile, [job('a')]);

    expect(results[0]?.score).toBe(0);
  });
});

describe('analyzeProfileWithGroq()', () => {
  it('returns the parsed analysis when the model responds with valid JSON', async () => {
    mocks.state.nextResponseText = JSON.stringify({
      score: 85,
      strengths: ['strong skills'],
      suggestions: [],
    });

    const analysis = await analyzeProfileWithGroq(profile);

    expect(analysis.score).toBe(85);
    expect(analysis.strengths).toEqual(['strong skills']);
  });

  it('returns a safe empty analysis when the model response has no JSON braces', async () => {
    mocks.state.nextResponseText = 'sorry, I cannot help with that';

    const analysis = await analyzeProfileWithGroq(profile);

    expect(analysis).toEqual({ score: 0, strengths: [], suggestions: [] });
  });

  it('returns a safe empty analysis when the JSON is malformed', async () => {
    mocks.state.nextResponseText = '{ "score": 10, invalid }';

    const analysis = await analyzeProfileWithGroq(profile);

    expect(analysis).toEqual({ score: 0, strengths: [], suggestions: [] });
  });
});
