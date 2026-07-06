import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Application } from '../src/types/application.types.js';

function baseApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    profileId: 'profile-1',
    title: 'Backend Developer',
    company: 'Acme',
    location: null,
    remote: false,
    url: null,
    description: '',
    source: 'manual',
    externalJobId: null,
    status: 'postulado',
    appliedAt: new Date('2026-01-01T00:00:00.000Z'),
    salaryAmount: null,
    salaryCurrency: null,
    contractType: null,
    notes: '',
    contactName: null,
    contactEmail: null,
    nextStepAt: null,
    priority: null,
    rejectionReason: null,
    tags: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

const calls = {
  create: [] as { data: Record<string, unknown> }[],
  findMany: [] as { where: Record<string, unknown>; orderBy: Record<string, unknown> }[],
  update: [] as { where: Record<string, unknown>; data: Record<string, unknown> }[],
  delete: [] as { where: Record<string, unknown> }[],
};
let findManyResult: Application[] = [];

// Mockea el import que usa applications-helper.ts para no tocar Prisma/DB real.
// Debe registrarse antes de cualquier import de la cadena helper/controller.
mock.module('../src/config/db.js', {
  namedExports: {
    prisma: {
      application: {
        create: async (args: { data: Record<string, unknown> }) => {
          calls.create.push(args);
          return baseApplication({ id: 'app-1' });
        },
        findMany: async (args: { where: Record<string, unknown>; orderBy: Record<string, unknown> }) => {
          calls.findMany.push(args);
          return findManyResult;
        },
        update: async (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          calls.update.push(args);
          return baseApplication();
        },
        delete: async (args: { where: Record<string, unknown> }) => {
          calls.delete.push(args);
          return undefined;
        },
      },
    },
  },
});

const { createApplication, listApplicationsByProfile, updateApplication, updateApplicationStatus, deleteApplication } =
  await import('../src/helpers/applications/applications-helper.js');
const { createApplicationController } = await import('../src/controllers/applications/create-application-controller.js');
const { listApplicationsController } = await import('../src/controllers/applications/list-applications-controller.js');
const { updateApplicationStatusController } = await import(
  '../src/controllers/applications/update-application-status-controller.js'
);
const { deleteApplicationController } = await import('../src/controllers/applications/delete-application-controller.js');

beforeEach(() => {
  calls.create = [];
  calls.findMany = [];
  calls.update = [];
  calls.delete = [];
  findManyResult = [baseApplication()];
});

describe('applications-helper — createApplication', () => {
  it('applies defaults when optional fields are omitted', async () => {
    await createApplication({ profileId: 'profile-1', title: 'Backend Developer', company: 'Acme' });

    const [{ data }] = calls.create;
    assert.equal(data['remote'], false);
    assert.equal(data['description'], '');
    assert.equal(data['source'], 'manual');
    assert.equal(data['status'], 'postulado');
    assert.deepEqual(data['tags'], []);
    assert.equal(data['location'], null);
  });

  it('passes through provided optional fields', async () => {
    await createApplication({
      profileId: 'profile-1',
      title: 'Backend Developer',
      company: 'Acme',
      source: 'hirefire',
      externalJobId: 'job-42',
      status: 'entrevista',
    });

    const [{ data }] = calls.create;
    assert.equal(data['source'], 'hirefire');
    assert.equal(data['externalJobId'], 'job-42');
    assert.equal(data['status'], 'entrevista');
  });
});

describe('applications-controller — createApplicationController', () => {
  it('delegates to the helper and returns its result', async () => {
    const result = await createApplicationController({
      profileId: 'profile-1',
      title: 'Backend Developer',
      company: 'Acme',
    });

    assert.equal(calls.create.length, 1);
    assert.equal(result.id, 'app-1');
  });
});

describe('applications-helper — listApplicationsByProfile', () => {
  it('filters by profileId only when no status is given', async () => {
    await listApplicationsByProfile('profile-1');

    const [args] = calls.findMany;
    assert.deepEqual(args.where, { profileId: 'profile-1' });
    assert.deepEqual(args.orderBy, { appliedAt: 'desc' });
  });

  it('filters by profileId and status when status is given', async () => {
    await listApplicationsByProfile('profile-1', 'entrevista');

    const [args] = calls.findMany;
    assert.deepEqual(args.where, { profileId: 'profile-1', status: 'entrevista' });
  });
});

describe('applications-controller — listApplicationsController', () => {
  it('delegates profileId and status to the helper', async () => {
    const result = await listApplicationsController('profile-1', 'oferta');

    const [args] = calls.findMany;
    assert.deepEqual(args.where, { profileId: 'profile-1', status: 'oferta' });
    assert.equal(result.length, 1);
  });
});

describe('applications-helper — updateApplicationStatus', () => {
  it('updates only the status field for the given id', async () => {
    await updateApplicationStatus('app-1', 'oferta');

    const [args] = calls.update;
    assert.deepEqual(args.where, { id: 'app-1' });
    assert.deepEqual(args.data, { status: 'oferta' });
  });
});

describe('applications-controller — updateApplicationStatusController', () => {
  it('delegates id and status to the helper', async () => {
    await updateApplicationStatusController('app-1', 'rechazado');

    const [args] = calls.update;
    assert.deepEqual(args.where, { id: 'app-1' });
    assert.deepEqual(args.data, { status: 'rechazado' });
  });
});

describe('applications-helper — updateApplication', () => {
  it('converts appliedAt and nextStepAt strings to Date and passes the rest through', async () => {
    await updateApplication('app-1', {
      notes: 'Segunda entrevista agendada',
      appliedAt: '2026-02-01T00:00:00.000Z',
      nextStepAt: '2026-02-10T00:00:00.000Z',
    });

    const [args] = calls.update;
    assert.equal(args.data['notes'], 'Segunda entrevista agendada');
    assert.ok(args.data['appliedAt'] instanceof Date);
    assert.ok(args.data['nextStepAt'] instanceof Date);
  });

  it('sets nextStepAt to null when explicitly cleared', async () => {
    await updateApplication('app-1', { nextStepAt: null });

    const [args] = calls.update;
    assert.equal(args.data['nextStepAt'], null);
  });
});

describe('applications-helper — deleteApplication', () => {
  it('deletes by id', async () => {
    await deleteApplication('app-1');

    const [args] = calls.delete;
    assert.deepEqual(args.where, { id: 'app-1' });
  });
});

describe('applications-controller — deleteApplicationController', () => {
  it('delegates to the helper', async () => {
    await deleteApplicationController('app-1');

    assert.equal(calls.delete.length, 1);
  });
});
