import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import type { MatchResult } from '../../domain/matching/models/match-result.model';
import type { LanguageWarning } from '../../domain/matching/models/language-warning.model';
import type { AllowedLanguageCode } from '../../domain/matching/types/allowed-language-code.type';
import { ScoreRingComponent } from '../score-ring/score-ring.component';

@Component({
  selector: 'hf-job-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, ScoreRingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="hf-job-card">
      <div class="hf-job__head">
        <div class="hf-job__info">
          <h3>{{ job().title }}</h3>
          <p class="hf-job__meta">
            {{ job().company }}
            @if (job().location) {
              · {{ job().location }}
            }
            @if (job().remote) {
              <span class="hf-tag">Remoto</span>
            }
          </p>
        </div>
        <hf-score-ring [score]="job().score" />
      </div>

      <mat-card-content>
        @if (job().reasons.length) {
          <div class="hf-block">
            <strong>Por qué encajás</strong>
            <ul>
              @for (r of job().reasons; track r) {
                <li>{{ r }}</li>
              }
            </ul>
          </div>
        }
        @if (job().gaps.length) {
          <div class="hf-block hf-block--gaps">
            <strong>Qué te falta</strong>
            <ul>
              @for (g of job().gaps; track g) {
                <li>{{ g }}</li>
              }
            </ul>
          </div>
        }
        @if (job().languageWarnings?.length) {
          <div class="hf-block hf-block--warnings">
            <strong>Advertencias de idioma</strong>
            <ul>
              @for (w of job().languageWarnings!; track $index) {
                <li>{{ warningText(w) }}</li>
              }
            </ul>
          </div>
        }
        @if (job().url) {
          <a mat-button color="primary" [href]="job().url" target="_blank" rel="noopener">
            Ver oferta ↗
          </a>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      mat-card.hf-job-card {
        border: 1px solid #2a2e3a;
        border-radius: 12px;
        margin-bottom: 1rem;
        padding: 0;

        mat-card-content {
          padding: 0.25rem 1.25rem 1.25rem;
          margin: 0;
        }
      }

      .hf-job__head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        padding: 1.25rem 1.25rem 0.5rem;
      }

      .hf-job__info {
        flex: 1;
        min-width: 0;
      }
      h3 {
        margin: 0;
        font-size: 1.05rem;
        line-height: 1.3;
      }
      .hf-job__meta {
        color: #9aa0ad;
        margin: 0.25rem 0 0;
        font-size: 0.88rem;
      }

      .hf-tag {
        font-size: 0.7rem;
        background: #1c2a3a;
        color: #7ec8e0;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        margin-left: 0.4rem;
      }

      .hf-block {
        margin-top: 0.8rem;
        font-size: 0.9rem;

        strong {
          display: block;
          margin-bottom: 0.3rem;
          color: #e6e8ee;
        }
        ul {
          margin: 0;
          padding-left: 1.1rem;
          color: #9aa0ad;
        }
        &--gaps strong {
          color: #ffa53d;
        }
        &--warnings strong {
          color: #ff9a9a;
        }
      }
    `,
  ],
})
export class JobCardComponent {
  readonly job = input.required<MatchResult>();

  readonly languageLabels: Record<AllowedLanguageCode, string> = {
    english: 'Inglés',
    portuguese: 'Portugués',
    spanish: 'Español',
    french: 'Francés',
    german: 'Alemán',
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
