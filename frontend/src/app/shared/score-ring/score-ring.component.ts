import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'hf-score-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './score-ring.component.html',
  styleUrl: './score-ring.component.scss',
})
export class ScoreRingComponent {
  readonly score = input.required<number>();

  readonly scoreClass = computed(() => {
    const s = this.score();
    return s >= 75 ? 'score--high' : s >= 50 ? 'score--mid' : 'score--low';
  });
}
