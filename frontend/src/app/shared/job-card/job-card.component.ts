import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ApplicationsFacade } from '../../application/applications/applications.facade';
import type { MatchResult } from '../../domain/matching/models/match-result.model';
import type { LanguageWarning } from '../../domain/matching/models/language-warning.model';
import type { AllowedLanguageCode } from '../../domain/matching/types/allowed-language-code.type';
import { ScoreRingComponent } from '../score-ring/score-ring.component';

@Component({
  selector: 'hf-job-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, ScoreRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-card.component.html',
  styleUrl: './job-card.component.scss',
})
export class JobCardComponent {
  private readonly applicationsFacade = inject(ApplicationsFacade);

  readonly job = input.required<MatchResult>();
  readonly profileId = input<string | null>(null);

  readonly submitting = signal(false);

  readonly alreadyApplied = computed(() =>
    this.applicationsFacade
      .applications()
      .some((application) => application.externalJobId === this.job().id),
  );

  constructor() {
    effect(() => {
      if (this.applicationsFacade.error()) this.submitting.set(false);
    });
  }

  apply(): void {
    const profileId = this.profileId();
    if (!profileId || this.alreadyApplied() || this.submitting()) return;

    this.submitting.set(true);
    const job = this.job();
    this.applicationsFacade.create(
      {
        profileId,
        title: job.title,
        company: job.company,
        location: job.location,
        remote: job.remote,
        url: job.url,
        description: job.description,
        source: 'hirefire',
        externalJobId: job.id,
      },
      () => this.submitting.set(false),
    );
  }

  readonly languageLabels: Record<AllowedLanguageCode, string> = {
    english: 'Inglés',
    portuguese: 'Portugués',
  };

  warningText(warning: LanguageWarning): string {
    if (typeof warning === 'string') return warning;

    const language = this.languageLabels[warning.language] ?? warning.language;

    if (warning.reason === 'desirable-language-not-allowed') {
      const level = warning.requestedLevel ? ` ${warning.requestedLevel}` : '';
      return `${language}${level} aparece como requisito deseable, pero no está entre los idiomas permitidos.`;
    }

    return `${language} ${warning.requestedLevel ?? 'sin nivel'} supera el nivel permitido ${warning.allowedLevel ?? 'configurado'}.`;
  }
}
