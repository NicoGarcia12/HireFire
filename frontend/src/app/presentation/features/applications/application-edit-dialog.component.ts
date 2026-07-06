import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ApplicationsFacade } from '../../../application/applications/applications.facade';
import { APPLICATION_PRIORITIES, type ApplicationPriority } from '../../../domain/applications/types/application-priority.type';
import type { Application } from '../../../domain/applications/models/application.model';

export interface ApplicationEditDialogData {
  application: Application;
}

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

@Component({
  selector: 'hf-application-edit-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Editar {{ data.application.title }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="hf-dialog-form">
        @if (error()) {
          <div class="hf-dialog-error">{{ error() }}</div>
        }

        <div class="hf-dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Sueldo</mat-label>
            <input matInput type="number" formControlName="salaryAmount" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Moneda</mat-label>
            <input matInput formControlName="salaryCurrency" placeholder="ARS, USD…" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Tipo de contrato</mat-label>
          <input matInput formControlName="contractType" placeholder="Full-time, freelance…" />
        </mat-form-field>

        <div class="hf-dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Contacto</mat-label>
            <input matInput formControlName="contactName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email de contacto</mat-label>
            <input matInput type="email" formControlName="contactEmail" />
          </mat-form-field>
        </div>

        <div class="hf-dialog-row">
          <mat-form-field appearance="outline">
            <mat-label>Próximo paso</mat-label>
            <input matInput type="date" formControlName="nextStepAt" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Prioridad</mat-label>
            <mat-select formControlName="priority">
              <mat-option [value]="null">Sin prioridad</mat-option>
              @for (priority of priorities; track priority) {
                <mat-option [value]="priority">{{ priorityLabel(priority) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Motivo de rechazo</mat-label>
          <input matInput formControlName="rejectionReason" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Tags (separados por coma)</mat-label>
          <input matInput formControlName="tagsInput" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Notas</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close [disabled]="saving()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="saving()" (click)="submit()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] { font-size: 1.1rem; }
    .hf-dialog-form { display: flex; flex-direction: column; gap: .25rem; min-width: 360px; }
    .hf-dialog-row { display: flex; gap: .75rem; }
    .hf-dialog-row mat-form-field { flex: 1; }
    .hf-field-full { width: 100%; }
    .hf-dialog-error {
      background: #3a1c1c; border: 1px solid #6b2b2b; color: #ffb4b4;
      padding: .5rem .75rem; border-radius: 8px; margin-bottom: .5rem; font-size: .85rem;
    }
    mat-dialog-actions { padding-bottom: .5rem; gap: .5rem; }
  `]
})
export class ApplicationEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(ApplicationsFacade);
  readonly data = inject<ApplicationEditDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ApplicationEditDialogComponent>);

  readonly saving = signal(false);
  readonly error = this.facade.error;
  readonly priorities = APPLICATION_PRIORITIES;

  readonly form = this.fb.group({
    salaryAmount: this.fb.control<number | null>(this.data.application.salaryAmount),
    salaryCurrency: this.fb.nonNullable.control(this.data.application.salaryCurrency ?? ''),
    contractType: this.fb.nonNullable.control(this.data.application.contractType ?? ''),
    notes: this.fb.nonNullable.control(this.data.application.notes),
    contactName: this.fb.nonNullable.control(this.data.application.contactName ?? ''),
    contactEmail: this.fb.nonNullable.control(this.data.application.contactEmail ?? '', Validators.email),
    nextStepAt: this.fb.nonNullable.control(toDateInputValue(this.data.application.nextStepAt)),
    priority: this.fb.control<ApplicationPriority | null>(this.data.application.priority),
    rejectionReason: this.fb.nonNullable.control(this.data.application.rejectionReason ?? ''),
    tagsInput: this.fb.nonNullable.control(this.data.application.tags.join(', '))
  });

  constructor() {
    effect(() => {
      if (this.error()) this.saving.set(false);
    });
  }

  priorityLabel(priority: string): string {
    return priority === 'alta' ? 'Alta' : priority === 'media' ? 'Media' : 'Baja';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    this.facade.update(
      this.data.application.id,
      {
        salaryAmount: value.salaryAmount ?? undefined,
        salaryCurrency: value.salaryCurrency || undefined,
        contractType: value.contractType || undefined,
        notes: value.notes,
        contactName: value.contactName || undefined,
        contactEmail: value.contactEmail || undefined,
        nextStepAt: value.nextStepAt ? new Date(value.nextStepAt).toISOString() : undefined,
        priority: value.priority ?? undefined,
        rejectionReason: value.rejectionReason || undefined,
        tags: value.tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      },
      () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      }
    );
  }
}
