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
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './application-create-dialog.component.html',
  styleUrl: './application-create-dialog.component.scss',
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
    description: [''],
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
        status: 'postulado',
      },
      () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
    );
  }
}
