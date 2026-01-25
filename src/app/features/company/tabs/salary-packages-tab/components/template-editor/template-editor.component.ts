import { Component, inject, OnInit, signal, computed, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services
import { SalaryPackageService } from '@app/core/services/salary-package.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';
import { DraftService } from '@app/core/services/draft.service';

// Models
import {
  SalaryPackageTemplate,
  TemplateItem,
  TemplateStatus,
  OriginType,
  ValueType,
  ItemNature,
  SalarySummary
} from '@app/core/models/salary-package.model';

// Guards
import { CanComponentDeactivate } from '@app/core/guards/unsaved-changes.guard';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    ToastModule,
    DialogModule,
    ProgressSpinnerModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './template-editor.component.html'
})
export class TemplateEditorComponent implements OnInit, CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly salaryPackageService = inject(SalaryPackageService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly draftService = inject(DraftService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isPublishing = signal(false);
  readonly isEditMode = signal(false);
  readonly templateId = signal<number | null>(null);
  readonly existingTemplate = signal<SalaryPackageTemplate | null>(null);
  readonly hasUnsavedChanges = signal(false);
  readonly showPublishDialog = signal(false);
  readonly lastAutoSave = signal<Date | null>(null);

  // Draft key for auto-save
  private readonly DRAFT_ENTITY_TYPE = 'salary-template';
  private draftEntityId = '';

  // Form
  form!: FormGroup;

  // Value type options
  readonly valueTypeOptions = [
    { label: 'Montant fixe', value: ValueType.FIXED_AMOUNT },
    { label: '% du salaire de base', value: ValueType.PERCENT_OF_BASE }
  ];

  readonly itemNatureOptions = [
    { label: 'Fixe', value: ItemNature.FIXED },
    { label: 'Automatique', value: ItemNature.AUTO },
    { label: 'Variable', value: ItemNature.VARIABLE_PLACEHOLDER }
  ];

  // Computed salary summary
  readonly salarySummary = computed<SalarySummary>(() => {
    const formValue = this.form?.value;
    if (!formValue) {
      return { baseSalary: 0, totalAllowances: 0, grossTotal: 0, taxableAmount: 0, cnssBase: 0, cimrBase: 0 };
    }

    const baseSalary = formValue.baseSalary || 0;
    let totalAllowances = 0;
    let taxableAmount = baseSalary;
    let cnssBase = baseSalary;
    let cimrBase = baseSalary;

    const items = formValue.items || [];
    items.forEach((item: any) => {
      const itemValue = this.calculateItemValue(item, baseSalary);
      totalAllowances += itemValue;
      
      if (item.isTaxable) {
        taxableAmount += itemValue;
      }
      if (item.isCnssBase) {
        cnssBase += itemValue;
      }
      if (item.isCimrBase) {
        cimrBase += itemValue;
      }
    });

    return {
      baseSalary,
      totalAllowances,
      grossTotal: baseSalary + totalAllowances,
      taxableAmount,
      cnssBase,
      cimrBase
    };
  });

  // Form validation status
  readonly validationErrors = computed(() => {
    const errors: string[] = [];
    if (!this.form?.valid) {
      if (this.form?.get('name')?.invalid) {
        errors.push('Le nom est requis');
      }
      if (this.form?.get('baseSalary')?.invalid) {
        errors.push('Le salaire de base doit être positif');
      }
    }
    return errors;
  });

  readonly isFormValid = computed(() => this.validationErrors().length === 0);

  // Expose enums to template
  readonly OriginType = OriginType;
  readonly ValueType = ValueType;

  constructor() {
    this.initForm();
    
    // Set up auto-save effect
    effect(() => {
      const hasChanges = this.hasUnsavedChanges();
      if (hasChanges && this.draftEntityId) {
        this.autoSaveDraft();
      }
    });
  }

  ngOnInit(): void {
    // Get template ID from route if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.templateId.set(+id);
      this.isEditMode.set(true);
      this.draftEntityId = id;
      this.loadTemplate(+id);
    } else {
      // New template - try to restore draft
      this.draftEntityId = `new-${this.companyContext.companyId()}`;
      this.restoreDraft();
    }

    // Set up form change detection for auto-save
    this.form.valueChanges.pipe(
      debounceTime(800),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      filter(() => !this.isLoading()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.hasUnsavedChanges.set(true);
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]],
      category: [''],
      baseSalary: [0, [Validators.required, Validators.min(0)]],
      payrollFrequency: ['MONTHLY'],
      workingHoursPerWeek: [44],
      items: this.fb.array([]),
      autoRules: this.fb.group({
        seniorityBonusEnabled: [true],
        ruleVersion: ['MA_2025']
      })
    });
  }

  get itemsFormArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private loadTemplate(id: number): void {
    this.isLoading.set(true);
    this.draftEntityId = String(id);

    this.salaryPackageService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => {
          this.existingTemplate.set(template);
          this.populateForm(template);
          this.isLoading.set(false);
          
          // Try to restore draft if exists
          this.restoreDraft();
        },
        error: (error) => {
          console.error('Failed to load template:', error);
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger le modèle'
          });
          this.router.navigate(['/app/company']);
        }
      });
  }

  private populateForm(template: SalaryPackageTemplate): void {
    // Clear existing items
    while (this.itemsFormArray.length) {
      this.itemsFormArray.removeAt(0);
    }

    // Patch main form values
    this.form.patchValue({
      name: template.name,
      code: template.code,
      description: template.description,
      category: template.category,
      baseSalary: template.baseSalary,
      payrollFrequency: template.payrollFrequency || 'MONTHLY',
      workingHoursPerWeek: template.workingHoursPerWeek || 44,
      autoRules: {
        seniorityBonusEnabled: template.autoRules?.seniorityBonusEnabled ?? true,
        ruleVersion: template.autoRules?.ruleVersion || 'MA_2025'
      }
    });

    // Add items
    template.items.forEach(item => {
      this.itemsFormArray.push(this.createItemFormGroup(item));
    });

    this.hasUnsavedChanges.set(false);
  }

  private createItemFormGroup(item?: Partial<TemplateItem>): FormGroup {
    return this.fb.group({
      id: [item?.id || null],
      name: [item?.name || '', Validators.required],
      code: [item?.code || ''],
      nature: [item?.nature || ItemNature.FIXED],
      valueType: [item?.valueType || ValueType.FIXED_AMOUNT],
      value: [item?.value || 0, Validators.min(0)],
      sortOrder: [item?.sortOrder || this.itemsFormArray.length],
      isTaxable: [item?.isTaxable ?? true],
      isCnssBase: [item?.isCnssBase ?? true],
      isCimrBase: [item?.isCimrBase ?? false],
      exemptionLimit: [item?.exemptionLimit || null]
    });
  }

  addItem(): void {
    this.itemsFormArray.push(this.createItemFormGroup());
    this.hasUnsavedChanges.set(true);
  }

  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    this.hasUnsavedChanges.set(true);
  }

  // ============================================
  // Auto-save Draft
  // ============================================

  private autoSaveDraft(): void {
    if (!this.draftEntityId) return;
    
    const formValue = this.form.value;
    this.draftService.saveDraft(this.DRAFT_ENTITY_TYPE, this.draftEntityId, formValue);
    this.lastAutoSave.set(new Date());
  }

  private restoreDraft(): void {
    if (!this.draftEntityId) return;

    const draft = this.draftService.loadDraft<any>(this.DRAFT_ENTITY_TYPE, this.draftEntityId);
    if (draft) {
      this.confirmationService.confirm({
        message: 'Un brouillon a été trouvé. Voulez-vous le restaurer?',
        header: 'Restaurer le brouillon',
        icon: 'pi pi-history',
        acceptLabel: 'Restaurer',
        rejectLabel: 'Ignorer',
        accept: () => {
          this.applyDraft(draft.data);
        },
        reject: () => {
          this.draftService.clearDraft(this.DRAFT_ENTITY_TYPE, this.draftEntityId);
        }
      });
    }
  }

  private applyDraft(draft: any): void {
    // Clear existing items
    while (this.itemsFormArray.length) {
      this.itemsFormArray.removeAt(0);
    }

    // Patch form values
    this.form.patchValue({
      name: draft.name,
      code: draft.code,
      description: draft.description,
      category: draft.category,
      baseSalary: draft.baseSalary,
      payrollFrequency: draft.payrollFrequency,
      workingHoursPerWeek: draft.workingHoursPerWeek,
      autoRules: draft.autoRules
    });

    // Add items
    if (draft.items?.length) {
      draft.items.forEach((item: any) => {
        this.itemsFormArray.push(this.createItemFormGroup(item));
      });
    }

    this.hasUnsavedChanges.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Brouillon restauré',
      detail: 'Vos modifications précédentes ont été restaurées'
    });
  }

  // ============================================
  // Save Operations
  // ============================================

  saveDraft(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const companyId = this.companyContext.companyId();
    if (!companyId) return;

    this.isSaving.set(true);
    const formValue = this.form.value;

    const template: Partial<SalaryPackageTemplate> = {
      name: formValue.name,
      code: formValue.code,
      description: formValue.description,
      category: formValue.category,
      baseSalary: formValue.baseSalary,
      payrollFrequency: formValue.payrollFrequency,
      workingHoursPerWeek: formValue.workingHoursPerWeek,
      items: formValue.items,
      autoRules: formValue.autoRules,
      status: TemplateStatus.DRAFT
    };

    const operation = this.isEditMode()
      ? this.salaryPackageService.update(this.templateId()!, template)
      : this.salaryPackageService.create(template, Number(companyId));

    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (savedTemplate) => {
        this.isSaving.set(false);
        this.hasUnsavedChanges.set(false);
        this.draftService.clearDraft(this.DRAFT_ENTITY_TYPE, this.draftEntityId);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.isEditMode() ? 'Modèle mis à jour' : 'Modèle créé'
        });

        if (!this.isEditMode()) {
          // Navigate to edit mode for newly created template
          this.router.navigate(['/app/company/salary-packages', savedTemplate.id, 'edit']);
        } else {
          this.existingTemplate.set(savedTemplate);
        }
      },
      error: (error) => {
        console.error('Failed to save template:', error);
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de sauvegarder le modèle'
        });
      }
    });
  }

  openPublishDialog(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.showPublishDialog.set(true);
  }

  publish(): void {
    if (!this.templateId()) {
      // Need to save first
      this.saveDraft();
      return;
    }

    this.isPublishing.set(true);
    this.showPublishDialog.set(false);

    this.salaryPackageService.publish(this.templateId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isPublishing.set(false);
          this.hasUnsavedChanges.set(false);
          this.draftService.clearDraft(this.DRAFT_ENTITY_TYPE, this.draftEntityId);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Modèle publié avec succès'
          });

          // Navigate back to company page
          this.router.navigate(['/app/company'], { queryParams: { tab: 'salaryPackages' } });
        },
        error: (error) => {
          console.error('Failed to publish template:', error);
          this.isPublishing.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de publier le modèle'
          });
        }
      });
  }

  cancel(): void {
    if (this.hasUnsavedChanges()) {
      this.confirmationService.confirm({
        message: 'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter?',
        header: 'Modifications non enregistrées',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Quitter',
        rejectLabel: 'Rester',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.draftService.clearDraft(this.DRAFT_ENTITY_TYPE, this.draftEntityId);
          this.hasUnsavedChanges.set(false);
          this.router.navigate(['/app/company'], { queryParams: { tab: 'salaryPackages' } });
        }
      });
    } else {
      this.router.navigate(['/app/company'], { queryParams: { tab: 'salaryPackages' } });
    }
  }

  // ============================================
  // Unsaved Changes Guard
  // ============================================

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges();
  }

  // ============================================
  // Helpers
  // ============================================

  calculateItemValue(item: any, baseSalary: number): number {
    if (!item) return 0;
    
    if (item.valueType === ValueType.PERCENT_OF_BASE) {
      return (baseSalary * (item.value || 0)) / 100;
    }
    return item.value || 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(value);
  }
}
