import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationsDataPort } from './applications-data.port';
import { ApplicationsFacade } from './applications.facade';
import type { Application } from '../../domain/applications/models/application.model';

function makeApplication(overrides: Partial<Application> = {}): Application {
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
    appliedAt: '2026-01-01T00:00:00.000Z',
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

function makeDataPortMock(): ApplicationsDataPort {
  return {
    list: vi.fn().mockReturnValue(of([])),
    create: vi.fn().mockReturnValue(of(makeApplication())),
    update: vi.fn().mockReturnValue(of(makeApplication())),
    updateStatus: vi.fn().mockReturnValue(of(makeApplication())),
    delete: vi.fn().mockReturnValue(of(undefined))
  } as unknown as ApplicationsDataPort;
}

function setup(): { facade: ApplicationsFacade; dataPort: ApplicationsDataPort } {
  const dataPort = makeDataPortMock();

  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), ApplicationsFacade, { provide: ApplicationsDataPort, useValue: dataPort }]
  });

  return { facade: TestBed.inject(ApplicationsFacade), dataPort };
}

describe('ApplicationsFacade — initial state', () => {
  it('starts with empty signals', () => {
    const { facade } = setup();
    expect(facade.applications()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('byStatus groups every status into an empty array when there are no applications', () => {
    const { facade } = setup();
    const groups = facade.byStatus();
    expect(groups['postulado']).toEqual([]);
    expect(groups['en_proceso']).toEqual([]);
    expect(groups['entrevista']).toEqual([]);
    expect(groups['oferta']).toEqual([]);
    expect(groups['rechazado']).toEqual([]);
    expect(groups['descartado']).toEqual([]);
  });
});

describe('ApplicationsFacade — load()', () => {
  it('sets loading=true during the request, then false on completion', () => {
    const { facade, dataPort } = setup();
    const subject = new Subject<Application[]>();
    vi.mocked(dataPort.list).mockReturnValue(subject.asObservable());

    facade.load('profile-1');
    expect(facade.loading()).toBe(true);

    subject.next([makeApplication()]);
    subject.complete();
    expect(facade.loading()).toBe(false);
  });

  it('populates applications after a successful load', () => {
    const { facade, dataPort } = setup();
    vi.mocked(dataPort.list).mockReturnValue(of([makeApplication(), makeApplication({ id: 'app-2' })]));

    facade.load('profile-1');
    expect(facade.applications()).toHaveLength(2);
  });

  it('passes profileId and status to the data port', () => {
    const { facade, dataPort } = setup();
    facade.load('profile-1', 'entrevista');
    expect(dataPort.list).toHaveBeenCalledWith('profile-1', 'entrevista');
  });

  it('groups applications by status via byStatus', () => {
    const { facade, dataPort } = setup();
    vi.mocked(dataPort.list).mockReturnValue(
      of([makeApplication({ id: 'a1', status: 'postulado' }), makeApplication({ id: 'a2', status: 'oferta' })])
    );

    facade.load('profile-1');

    const groups = facade.byStatus();
    expect(groups['postulado'].map((a) => a.id)).toEqual(['a1']);
    expect(groups['oferta'].map((a) => a.id)).toEqual(['a2']);
    expect(groups['entrevista']).toEqual([]);
  });

  it('sets error on failure', () => {
    const { facade, dataPort } = setup();
    const subject = new Subject<Application[]>();
    vi.mocked(dataPort.list).mockReturnValue(subject.asObservable());

    facade.load('profile-1');
    subject.error(new Error('Network error'));

    expect(facade.error()).toContain('Network error');
    expect(facade.loading()).toBe(false);
  });
});

describe('ApplicationsFacade — create()', () => {
  it('prepends the created application and calls onCreated', () => {
    const { facade, dataPort } = setup();
    const created = makeApplication({ id: 'new-app' });
    vi.mocked(dataPort.create).mockReturnValue(of(created));
    const onCreated = vi.fn();

    facade.create({ profileId: 'profile-1', title: 'Dev', company: 'Acme' }, onCreated);

    expect(facade.applications()[0].id).toBe('new-app');
    expect(onCreated).toHaveBeenCalledWith(created);
  });

  it('sets error on failure', () => {
    const { facade, dataPort } = setup();
    const subject = new Subject<Application>();
    vi.mocked(dataPort.create).mockReturnValue(subject.asObservable());

    facade.create({ profileId: 'profile-1', title: 'Dev', company: 'Acme' });
    subject.error(new Error('Create failed'));

    expect(facade.error()).toContain('Create failed');
  });
});

describe('ApplicationsFacade — update()', () => {
  it('replaces the matching application in the list', () => {
    const { facade, dataPort } = setup();
    vi.mocked(dataPort.list).mockReturnValue(of([makeApplication({ id: 'app-1', notes: 'old' })]));
    facade.load('profile-1');

    const updated = makeApplication({ id: 'app-1', notes: 'new' });
    vi.mocked(dataPort.update).mockReturnValue(of(updated));
    const onUpdated = vi.fn();

    facade.update('app-1', { notes: 'new' }, onUpdated);

    expect(facade.applications()[0].notes).toBe('new');
    expect(onUpdated).toHaveBeenCalledWith(updated);
  });
});

describe('ApplicationsFacade — updateStatus()', () => {
  it('updates the status optimistically before the server responds', () => {
    const { facade, dataPort } = setup();
    vi.mocked(dataPort.list).mockReturnValue(of([makeApplication({ id: 'app-1', status: 'postulado' })]));
    facade.load('profile-1');

    const subject = new Subject<Application>();
    vi.mocked(dataPort.updateStatus).mockReturnValue(subject.asObservable());

    facade.updateStatus('app-1', 'entrevista');

    expect(facade.applications()[0].status).toBe('entrevista');
  });

  it('rolls back to the previous value when the server call fails', () => {
    const { facade, dataPort } = setup();
    vi.mocked(dataPort.list).mockReturnValue(of([makeApplication({ id: 'app-1', status: 'postulado' })]));
    facade.load('profile-1');

    const subject = new Subject<Application>();
    vi.mocked(dataPort.updateStatus).mockReturnValue(subject.asObservable());

    facade.updateStatus('app-1', 'entrevista');
    subject.error(new Error('Network error'));

    expect(facade.applications()[0].status).toBe('postulado');
    expect(facade.error()).toContain('Network error');
  });
});

describe('ApplicationsFacade — delete()', () => {
  it('removes the application from the list', () => {
    const { facade, dataPort } = setup();
    vi.mocked(dataPort.list).mockReturnValue(of([makeApplication({ id: 'app-1' }), makeApplication({ id: 'app-2' })]));
    facade.load('profile-1');

    facade.delete('app-1');

    expect(facade.applications().map((a) => a.id)).toEqual(['app-2']);
  });
});
