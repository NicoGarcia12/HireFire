import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Job } from '../src/types/job.types.js';
import type { Profile } from '../src/types/profile.types.js';

const calls: { chatCreate: unknown[] } = { chatCreate: [] };
let nextResponseText = '';

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

mock.module('../src/config/env.js', {
  namedExports: {
    env: {
      port: 3000,
      databaseUrl: 'postgres://fake',
      apify: { token: 'fake-token', jobsActor: 'fake-actor' },
      groq: { apiKey: 'fake-key', baseUrl: 'https://fake', model: 'fake-model' },
    },
  },
});

mock.module('../src/utils/groq-client.js', {
  namedExports: {
    groq: {
      chat: {
        completions: {
          create: async (args: unknown) => {
            calls.chatCreate.push(args);
            return { choices: [{ message: { content: nextResponseText } }] };
          },
        },
      },
    },
  },
});

const { rankJobsController } = await import('../src/controllers/matching/rank-jobs-controller.js');
const { analyzeProfileWithGroq } =
  await import('../src/controllers/matching/groq-analysis-controller.js');

beforeEach(() => {
  calls.chatCreate = [];
  nextResponseText = '';
});

afterEach(() => mock.reset());

describe('rankJobsController()', () => {
  it('scores jobs from the model response and sorts descending by score', async () => {
    nextResponseText = JSON.stringify({
      results: [
        { id: 'a', score: 40, reasons: ['ok'], gaps: [] },
        { id: 'b', score: 90, reasons: ['great fit'], gaps: [] },
      ],
    });

    const results = await rankJobsController(profile, [job('a'), job('b')]);

    assert.deepEqual(
      results.map((r) => r.id),
      ['b', 'a'],
    );
    assert.equal(results[0]?.score, 90);
  });

  it('defaults score/reasons/gaps to safe values when the model omits a job', async () => {
    nextResponseText = JSON.stringify({ results: [{ id: 'a', score: 70, reasons: [], gaps: [] }] });

    const results = await rankJobsController(profile, [job('a'), job('b')]);
    const missing = results.find((r) => r.id === 'b');

    assert.deepEqual(missing, { ...job('b'), score: 0, reasons: [], gaps: [] });
  });

  it('batches jobs in groups of 8, issuing one model call per batch', async () => {
    nextResponseText = JSON.stringify({ results: [] });
    const jobs = Array.from({ length: 9 }, (_, i) => job(`job-${i}`));

    await rankJobsController(profile, jobs);

    assert.equal(calls.chatCreate.length, 2);
  });

  it('tolerates unparsable model output by scoring everything as 0', async () => {
    nextResponseText = 'not json at all';

    const results = await rankJobsController(profile, [job('a')]);

    assert.equal(results[0]?.score, 0);
  });
});

describe('analyzeProfileWithGroq()', () => {
  it('returns the parsed analysis when the model responds with valid JSON', async () => {
    nextResponseText = JSON.stringify({ score: 85, strengths: ['strong skills'], suggestions: [] });

    const analysis = await analyzeProfileWithGroq(profile);

    assert.equal(analysis.score, 85);
    assert.deepEqual(analysis.strengths, ['strong skills']);
  });

  it('returns a safe empty analysis when the model response has no JSON braces', async () => {
    nextResponseText = 'sorry, I cannot help with that';

    const analysis = await analyzeProfileWithGroq(profile);

    assert.deepEqual(analysis, { score: 0, strengths: [], suggestions: [] });
  });

  it('returns a safe empty analysis when the JSON is malformed', async () => {
    nextResponseText = '{ "score": 10, invalid }';

    const analysis = await analyzeProfileWithGroq(profile);

    assert.deepEqual(analysis, { score: 0, strengths: [], suggestions: [] });
  });
});
