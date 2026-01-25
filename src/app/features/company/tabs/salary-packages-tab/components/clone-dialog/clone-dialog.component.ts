import { Component, inject, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

// Services
import { SalaryPackageService } from '@app/core/services/salary-package.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';

// Models
import { SalaryPackageTemplate } from '@app/core/models/salary-package.model';

@Component({
  selector: 'app-clone-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DialogModule,
    ButtonModule,
    InputTextModule
  ],
  template: `
    <p-dialog
      [header]="'salary_packages.copy_modal.title' | translate"
      [visible]="visible"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '450px' }"
      [contentStyle]="{ overflow: 'visible' }"
    >
      <div class="space-y-4">
        <p class="text-(--text-color-secondary)">
          {{ 'salary_packages.copy_modal.description' | translate }}
        </p>

        @if (sourceTemplate) {
          <div class="bg-(--surface-ground) p-3 rounded-(--rads-md)">
            <p class="text-sm text-(--text-color-secondary)">Source:</p>
            <p class="font-medium">{{ sourceTemplate.name }}</p>
          </div>
        }

        <form [formGroup]="form">
          <div class="flex flex-col gap-2">
            <label for="newName" class="font-medium">
              {{ 'salary_packages.copy_modal.new_name' | translate }}
            </label>
            <input
              id="newName"
              type="text"
              pInputText
              formControlName="newName"
              [placeholder]="'salary_packages.copy_modal.new_name_placeholder' | translate"
              class="w-full"
            />
            @if (form.get('newName')?.invalid && form.get('newName')?.touched) {
              <small class="text-(--danger-color)">
                {{ 'salary_packages.validation.name_required' | translate }}
              </small>
            }
          </div>
        </form>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button
            [label]="'common.cancel' | translate"
            [text]="true"
            (onClick)="onCancel()"
            [disabled]="isCloning()"
          ></p-button>
          <p-button
            [label]="'salary_packages.copy_modal.confirm' | translate"
            icon="pi pi-copy"
            (onClick)="onClone()"
            [loading]="isCloning()"
            [disabled]="form.invalid || isCloning()"
          ></p-button>
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class CloneDialogComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly salaryPackageService = inject(SalaryPackageService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() visible = false;
  @Input() sourceTemplate: SalaryPackageTemplate | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() cloneSuccess = new EventEmitter<SalaryPackageTemplate>();
  @Output() cloneCancel = new EventEmitter<void>();

  readonly isCloning = signal(false);

  form: FormGroup = this.fb.group({
    newName: ['', [Validators.required, Validators.maxLength(100)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sourceTemplate'] && this.sourceTemplate) {
      this.form.patchValue({
        newName: `${this.sourceTemplate.name} (Copie)`
      });
    }
  }

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
    if (!value) {
      this.form.reset();
    }
  }

  onCancel(): void {
    this.cloneCancel.emit();
    this.form.reset();
  }

  onClone(): void {
    if (this.form.invalid || !this.sourceTemplate) return;

    const companyId = this.companyContext.companyId();
    if (!companyId) return;

    this.isCloning.set(true);

    this.salaryPackageService.clone(
      this.sourceTemplate.id,
      this.form.value.newName,
      Number(companyId)
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (clonedTemplate) => {
          this.isCloning.set(false);
          this.cloneSuccess.emit(clonedTemplate);
          this.form.reset();
        },
        error: (error) => {
          console.error('Failed to clone template:', error);
          this.isCloning.set(false);
        }
      });
  }
}
