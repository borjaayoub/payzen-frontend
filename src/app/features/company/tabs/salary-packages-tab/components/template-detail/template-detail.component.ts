import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG
import { ButtonModule } from 'primeng/button';
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

// Models
import {
  SalaryPackageTemplate,
  TemplateStatus,
  TemplateType,
  OriginType,
  ValueType,
  SalarySummary
} from '@app/core/models/salary-package.model';

// Components
import { CloneDialogComponent } from '../clone-dialog/clone-dialog.component';

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ToastModule,
    DialogModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    CloneDialogComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './template-detail.component.html'
})
export class TemplateDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly salaryPackageService = inject(SalaryPackageService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly isLoading = signal(true);
  readonly template = signal<SalaryPackageTemplate | null>(null);
  readonly isOfficialView = signal(false);
  readonly showCloneDialog = signal(false);
  readonly showArchiveDialog = signal(false);

  // Expose enums to template
  readonly TemplateStatus = TemplateStatus;
  readonly TemplateType = TemplateType;
  readonly OriginType = OriginType;
  readonly ValueType = ValueType;

  // Computed properties
  readonly isOfficial = computed(() => this.template()?.templateType === TemplateType.OFFICIAL);
  readonly isDraft = computed(() => this.template()?.status === TemplateStatus.DRAFT);
  readonly isPublished = computed(() => this.template()?.status === TemplateStatus.PUBLISHED);
  readonly isArchived = computed(() => this.template()?.status === TemplateStatus.ARCHIVED);

  readonly salarySummary = computed<SalarySummary>(() => {
    const t = this.template();
    if (!t) {
      return { baseSalary: 0, totalAllowances: 0, grossTotal: 0, taxableAmount: 0, cnssBase: 0, cimrBase: 0 };
    }

    const baseSalary = t.baseSalary || 0;
    let totalAllowances = 0;
    let taxableAmount = baseSalary;
    let cnssBase = baseSalary;
    let cimrBase = baseSalary;

    t.items.forEach(item => {
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

  ngOnInit(): void {
    // Check if this is official or company view
    const url = this.router.url;
    this.isOfficialView.set(url.includes('/official/'));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTemplate(+id);
    } else {
      this.router.navigate(['/app/company']);
    }
  }

  private loadTemplate(id: number): void {
    this.isLoading.set(true);

    this.salaryPackageService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (template) => {
          this.template.set(template);
          this.isLoading.set(false);
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

  // ============================================
  // Actions
  // ============================================

  goBack(): void {
    this.router.navigate(['/app/company'], { queryParams: { tab: 'salaryPackages' } });
  }

  editTemplate(): void {
    const t = this.template();
    if (t && t.status === TemplateStatus.DRAFT) {
      this.router.navigate(['/app/company/salary-packages', t.id, 'edit']);
    }
  }

  openCloneDialog(): void {
    this.showCloneDialog.set(true);
  }

  onCloneSuccess(): void {
    this.showCloneDialog.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Modèle copié dans vos modèles'
    });
    this.router.navigate(['/app/company'], { queryParams: { tab: 'salaryPackages' } });
  }

  onCloneCancel(): void {
    this.showCloneDialog.set(false);
  }

  duplicateTemplate(): void {
    const t = this.template();
    const companyId = this.companyContext.companyId();
    if (!t || !companyId) return;

    this.salaryPackageService.duplicate(t.id, Number(companyId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newTemplate) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Modèle dupliqué'
          });
          this.router.navigate(['/app/company/salary-packages', newTemplate.id, 'edit']);
        },
        error: (error) => {
          console.error('Failed to duplicate template:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de dupliquer le modèle'
          });
        }
      });
  }

  openArchiveDialog(): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir archiver ce modèle? Il ne sera plus utilisable pour de nouveaux employés.',
      header: 'Archiver le modèle',
      icon: 'pi pi-inbox',
      acceptLabel: 'Archiver',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.archiveTemplate()
    });
  }

  private archiveTemplate(): void {
    const t = this.template();
    if (!t) return;

    this.salaryPackageService.archive(t.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Modèle archivé'
          });
          this.router.navigate(['/app/company'], { queryParams: { tab: 'salaryPackages' } });
        },
        error: (error) => {
          console.error('Failed to archive template:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible d\'archiver le modèle'
          });
        }
      });
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

  getStatusSeverity(status: TemplateStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case TemplateStatus.PUBLISHED:
        return 'success';
      case TemplateStatus.DRAFT:
        return 'warn';
      case TemplateStatus.ARCHIVED:
        return 'secondary';
      case TemplateStatus.DEPRECATED:
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: TemplateStatus): string {
    switch (status) {
      case TemplateStatus.PUBLISHED:
        return 'Publié';
      case TemplateStatus.DRAFT:
        return 'Brouillon';
      case TemplateStatus.ARCHIVED:
        return 'Archivé';
      case TemplateStatus.DEPRECATED:
        return 'Obsolète';
      default:
        return status;
    }
  }
}
