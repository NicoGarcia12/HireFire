import {
  provideZonelessChangeDetection,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApplicationsFacade,
  type ApplicationsByStatus,
} from '../../../application/applications/applications.facade';
import { HomeFacade } from '../../../application/home/home.facade';
import { APPLICATION_STATUSES } from '../../../domain/applications/enums/application-status.enum';
import type { Application } from '../../../domain/applications/models/application.model';
import { Applications } from './applications';

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-1',
    profileId: 'profile-1',
    title: 'Backend Developer',
    company: 'Acme',
    location: 'CABA',
    remote: true,
    url: 'https://example.com/job',
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
    ...overrides,
  };
}

function makeByStatus(applications: Application[]): ApplicationsByStatus {
  const groups = APPLICATION_STATUSES.reduce((accumulator, status) => {
    accumulator[status] = [];
    return accumulator;
  }, {} as ApplicationsByStatus);

  for (const application of applications) {
    groups[application.status].push(application);
  }

  return groups;
}

type ApplicationsFacadeMock = Pick<ApplicationsFacade, 'load' | 'delete' | 'updateStatus'> & {
  loading: Signal<boolean>;
  error: Signal<string | null>;
  byStatus: Signal<ApplicationsByStatus>;
};

type HomeFacadeMock = {
  profileId: WritableSignal<string | null>;
};

describe('Applications — delete application from dashboard', () => {
  let fixture: ComponentFixture<Applications>;
  let applicationsFacadeMock: ApplicationsFacadeMock;
  let homeFacadeMock: HomeFacadeMock;

  beforeEach(async () => {
    applicationsFacadeMock = {
      load: vi.fn(),
      delete: vi.fn(),
      updateStatus: vi.fn(),
      loading: signal(false),
      error: signal(null),
      byStatus: signal(
        makeByStatus([
          makeApplication(),
          makeApplication({
            id: 'app-2',
            status: 'entrevista',
            title: 'Frontend Developer',
            company: 'Globant',
          }),
        ]),
      ),
    };

    homeFacadeMock = {
      profileId: signal('profile-1'),
    };

    await TestBed.configureTestingModule({
      imports: [Applications],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ApplicationsFacade, useValue: applicationsFacadeMock },
        { provide: HomeFacade, useValue: homeFacadeMock },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Applications);
  });

  function firstApplicationCard(): HTMLElement {
    const card = fixture.nativeElement.querySelector('.hf-app-card') as HTMLElement | null;
    if (!card) throw new Error('application card not found');
    return card;
  }

  function deleteButtonFrom(card: HTMLElement): HTMLButtonElement | null {
    return Array.from(card.querySelectorAll('button')).find((button) =>
      button.textContent?.trim().includes('Borrar'),
    ) as HTMLButtonElement | null;
  }

  it('renders a delete action inside each application card', () => {
    fixture.detectChanges();

    const deleteButton = deleteButtonFrom(firstApplicationCard());

    expect(deleteButton).toBeTruthy();
  });

  it('calls facade.delete with the application id when the delete action is clicked', () => {
    fixture.detectChanges();

    const deleteButton = deleteButtonFrom(firstApplicationCard());
    if (!deleteButton) throw new Error('delete button not found');

    deleteButton.click();

    expect(applicationsFacadeMock.delete).toHaveBeenCalledWith('app-1');
  });
});
