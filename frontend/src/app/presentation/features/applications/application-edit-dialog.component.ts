import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ApplicationsFacade } from '../../../application/applications/applications.facade';
import {
  APPLICATION_PRIORITIES,
  type ApplicationPriority,
} from '../../../domain/applications/types/application-priority.type';
import type { Application } from '../../../domain/applications/models/application.model';

export interface ApplicationEditDialogData {
  application: Application;
}

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

@Component({
  selector: 'hf-application-edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './application-edit-dialog.component.html',
  styleUrl: './application-edit-dialog.component.scss',
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
    contactEmail: this.fb.nonNullable.control(
      this.data.application.contactEmail ?? '',
      Validators.email,
    ),
    nextStepAt: this.fb.nonNullable.control(toDateInputValue(this.data.application.nextStepAt)),
    priority: this.fb.control<ApplicationPriority | null>(this.data.application.priority),
    rejectionReason: this.fb.nonNullable.control(this.data.application.rejectionReason ?? ''),
    tagsInput: this.fb.nonNullable.control(this.data.application.tags.join(', ')),
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
          .filter(Boolean),
      },
      () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
    );
  }
}
