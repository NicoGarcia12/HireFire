import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApplicationsFacade } from '../../../application/applications/applications.facade';

export interface ApplicationCreateDialogData {
  profileId: string;
}

@Component({
  selector: 'hf-application-create-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Cargar postulación manual</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="hf-dialog-form">
        @if (error()) {
          <div class="hf-dialog-error">{{ error() }}</div>
        }

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Puesto *</mat-label>
          <input matInput formControlName="title" />
          <mat-error>Este campo es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Empresa *</mat-label>
          <input matInput formControlName="company" />
          <mat-error>Este campo es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Ubicación</mat-label>
          <input matInput formControlName="location" />
        </mat-form-field>

        <mat-checkbox formControlName="remote">Remoto</mat-checkbox>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>URL de la oferta</mat-label>
          <input matInput formControlName="url" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="hf-field-full">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
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
    .hf-dialog-form { display: flex; flex-direction: column; gap: .25rem; min-width: 320px; }
    .hf-field-full { width: 100%; }
    .hf-dialog-error {
      background: #3a1c1c; border: 1px solid #6b2b2b; color: #ffb4b4;
      padding: .5rem .75rem; border-radius: 8px; margin-bottom: .5rem; font-size: .85rem;
    }
    mat-dialog-actions { padding-bottom: .5rem; gap: .5rem; }
  `]
})
export class ApplicationCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(ApplicationsFacade);
  private readonly data = inject<ApplicationCreateDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ApplicationCreateDialogComponent>);

  readonly saving = signal(false);
  readonly error = this.facade.error;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    company: ['', Validators.required],
    location: [''],
    remote: [false],
    url: [''],
    description: ['']
  });

  constructor() {
    effect(() => {
      if (this.error()) this.saving.set(false);
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    this.facade.create(
      {
        profileId: this.data.profileId,
        title: value.title,
        company: value.company,
        location: value.location || undefined,
        remote: value.remote,
        url: value.url || undefined,
        description: value.description,
        source: 'manual',
        status: 'postulado'
      },
      () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      }
    );
  }
}
