import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'hf-score-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hf-score-ring" [class]="scoreClass()" [attr.aria-label]="'Score: ' + score() + ' de 100'">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle class="hf-score-ring__track" cx="18" cy="18" r="15.9"/>
        <circle class="hf-score-ring__fill" cx="18" cy="18" r="15.9"
          [style.stroke-dashoffset]="100 - score()"/>
      </svg>
      <span class="hf-score-ring__value">{{ score() }}</span>
    </div>
  `,
  styles: [`
    .hf-score-ring {
      flex-shrink: 0;
      position: relative;
      width: 52px; height: 52px;
      display: grid; place-items: center;

      svg {
        position: absolute;
        inset: 0;
        width: 100%; height: 100%;
        transform: rotate(-90deg);
      }

      &__track {
        fill: none;
        stroke: #2a2e3a;
        stroke-width: 3;
      }

      &__fill {
        fill: none;
        stroke-width: 3;
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        stroke-linecap: round;
        transition: stroke-dashoffset .4s ease, stroke .25s;
      }

      &__value {
        position: relative;
        font-weight: 700;
        font-size: .85rem;
        z-index: 1;
      }

      &.score--high {
        .hf-score-ring__fill  { stroke: #7ee0a1; }
        .hf-score-ring__value { color: #7ee0a1; }
      }
      &.score--mid {
        .hf-score-ring__fill  { stroke: #e0d27e; }
        .hf-score-ring__value { color: #e0d27e; }
      }
      &.score--low {
        .hf-score-ring__fill  { stroke: #e09a9a; }
        .hf-score-ring__value { color: #e09a9a; }
      }
    }
  `]
})
export class ScoreRingComponent {
  readonly score = input.required<number>();

  readonly scoreClass = computed(() => {
    const s = this.score();
    return s >= 75 ? 'score--high' : s >= 50 ? 'score--mid' : 'score--low';
  });
}
