import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const mocks = vi.hoisted(() => {
  let findManyResult: Application[] = [];
  return {
    setFindManyResult: (value: Application[]) => {
      findManyResult = value;
    },
    create: vi.fn(async (_args: { data: Record<string, unknown> }) =>
      baseApplication({ id: 'app-1' }),
    ),
    findMany: vi.fn(
      async (_args: { where: Record<string, unknown>; orderBy: Record<string, unknown> }) =>
        findManyResult,
    ),
    update: vi.fn(
      async (_args: { where: Record<string, unknown>; data: Record<string, unknown> }) =>
        baseApplication(),
    ),
    delete: vi.fn(async (_args: { where: Record<string, unknown> }) => undefined),
  };
});

vi.mock('../src/config/db.js', () => ({
  prisma: {
    application: {
      create: mocks.create,
      findMany: mocks.findMany,
      update: mocks.update,
      delete: mocks.delete,
    },
  },
}));

import {
  createApplication,
  listApplicationsByProfile,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} from '../src/helpers/applications/applications-helper.js';
import { createApplicationController } from '../src/controllers/applications/create-application-controller.js';
import { listApplicationsController } from '../src/controllers/applications/list-applications-controller.js';
import { updateApplicationStatusController } from '../src/controllers/applications/update-application-status-controller.js';
import { deleteApplicationController } from '../src/controllers/applications/delete-application-controller.js';

beforeEach(() => {
  mocks.create.mockClear();
  mocks.findMany.mockClear();
  mocks.update.mockClear();
  mocks.delete.mockClear();
  mocks.setFindManyResult([baseApplication()]);
});

describe('applications-helper — createApplication', () => {
  it('applies defaults when optional fields are omitted', async () => {
    await createApplication({
      profileId: 'profile-1',
      title: 'Backend Developer',
      company: 'Acme',
    });

    const data = mocks.create.mock.calls[0]?.[0].data ?? {};
    expect(data['remote']).toBe(false);
    expect(data['description']).toBe('');
    expect(data['source']).toBe('manual');
    expect(data['status']).toBe('postulado');
    expect(data['tags']).toEqual([]);
    expect(data['location']).toBe(null);
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

    const data = mocks.create.mock.calls[0]?.[0].data ?? {};
    expect(data['source']).toBe('hirefire');
    expect(data['externalJobId']).toBe('job-42');
    expect(data['status']).toBe('entrevista');
  });
});

describe('applications-controller — createApplicationController', () => {
  it('delegates to the helper and returns its result', async () => {
    const result = await createApplicationController({
      profileId: 'profile-1',
      title: 'Backend Developer',
      company: 'Acme',
    });

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('app-1');
  });
});

describe('applications-helper — listApplicationsByProfile', () => {
  it('filters by profileId only when no status is given', async () => {
    await listApplicationsByProfile('profile-1');

    const args = mocks.findMany.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ profileId: 'profile-1' });
    expect(args?.orderBy).toEqual({ appliedAt: 'desc' });
  });

  it('filters by profileId and status when status is given', async () => {
    await listApplicationsByProfile('profile-1', 'entrevista');

    const args = mocks.findMany.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ profileId: 'profile-1', status: 'entrevista' });
  });
});

describe('applications-controller — listApplicationsController', () => {
  it('delegates profileId and status to the helper', async () => {
    const result = await listApplicationsController('profile-1', 'oferta');

    const args = mocks.findMany.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ profileId: 'profile-1', status: 'oferta' });
    expect(result.length).toBe(1);
  });
});

describe('applications-helper — updateApplicationStatus', () => {
  it('updates only the status field for the given id', async () => {
    await updateApplicationStatus('app-1', 'oferta');

    const args = mocks.update.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ id: 'app-1' });
    expect(args?.data).toEqual({ status: 'oferta' });
  });
});

describe('applications-controller — updateApplicationStatusController', () => {
  it('delegates id and status to the helper', async () => {
    await updateApplicationStatusController('app-1', 'rechazado');

    const args = mocks.update.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ id: 'app-1' });
    expect(args?.data).toEqual({ status: 'rechazado' });
  });
});

describe('applications-helper — updateApplication', () => {
  it('converts appliedAt and nextStepAt strings to Date and passes the rest through', async () => {
    await updateApplication('app-1', {
      notes: 'Segunda entrevista agendada',
      appliedAt: '2026-02-01T00:00:00.000Z',
      nextStepAt: '2026-02-10T00:00:00.000Z',
    });

    const data = mocks.update.mock.calls[0]?.[0].data ?? {};
    expect(data['notes']).toBe('Segunda entrevista agendada');
    expect(data['appliedAt']).toBeInstanceOf(Date);
    expect(data['nextStepAt']).toBeInstanceOf(Date);
  });

  it('sets nextStepAt to null when explicitly cleared', async () => {
    await updateApplication('app-1', { nextStepAt: null });

    const data = mocks.update.mock.calls[0]?.[0].data ?? {};
    expect(data['nextStepAt']).toBe(null);
  });
});

describe('applications-helper — deleteApplication', () => {
  it('deletes by id', async () => {
    await deleteApplication('app-1');

    const args = mocks.delete.mock.calls[0]?.[0];
    expect(args?.where).toEqual({ id: 'app-1' });
  });
});

describe('applications-controller — deleteApplicationController', () => {
  it('delegates to the helper', async () => {
    await deleteApplicationController('app-1');

    expect(mocks.delete).toHaveBeenCalledTimes(1);
  });
});
