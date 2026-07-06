import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ApplicationsDataPort } from '../../application/applications/applications-data.port';
import { JobCardComponent } from './job-card.component';
import type { MatchResult } from '../../domain/matching/models/match-result.model';

const job: MatchResult = {
  id: 'job-1',
  title: 'Backend Developer',
  company: 'Acme',
  location: 'CABA',
  remote: true,
  description: '',
  url: 'https://example.com/job',
  score: 80,
  reasons: [],
  gaps: [],
};

function createComponent(): JobCardComponent {
  TestBed.configureTestingModule({
    imports: [JobCardComponent],
    providers: [
      provideZonelessChangeDetection(),
      { provide: ApplicationsDataPort, useValue: { list: () => of([]) } },
    ],
  });
  const fixture = TestBed.createComponent(JobCardComponent);
  fixture.componentRef.setInput('job', job);
  return fixture.componentInstance;
}

describe('JobCardComponent — warningText()', () => {
  it('returns a plain string warning as-is', () => {
    const component = createComponent();

    expect(component.warningText('legacy warning text')).toBe('legacy warning text');
  });

  it('builds a message for a desirable language not in the allowed list', () => {
    const component = createComponent();

    const text = component.warningText({
      language: 'english',
      requestedLevel: 'C1',
      reason: 'desirable-language-not-allowed',
    });

    expect(text).toBe(
      'Inglés C1 aparece como requisito deseable, pero no está entre los idiomas permitidos.',
    );
  });

  it('builds a message for a desirable language level that exceeds the allowed level', () => {
    const component = createComponent();

    const text = component.warningText({
      language: 'portuguese',
      requestedLevel: 'C1',
      allowedLevel: 'B1',
      reason: 'desirable-language-level-exceeds-allowed',
    });

    expect(text).toBe('Portugués C1 supera el nivel permitido B1.');
  });
});
