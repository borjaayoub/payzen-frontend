import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services
import { SalaryPackageService } from '@app/core/services/salary-package.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';

// Models
import {
  SalaryPackageTemplate,
  TemplateStatus,
  TemplateType,
  OriginType
} from '@app/core/models/salary-package.model';

// Components
import { CloneDialogComponent } from './components/clone-dialog/clone-dialog.component';
import { EmptyState } from '@app/shared/components/empty-state/empty-state';

@Component({
  selector: 'app-salary-packages-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    CloneDialogComponent,
    EmptyState
  ],
  providers: [MessageService],
  templateUrl: './salary-packages-tab.component.html'
})
export class SalaryPackagesTabComponent implements OnInit {
  private readonly salaryPackageService = inject(SalaryPackageService);
  private readonly companyContext = inject(CompanyContextService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly activeTabIndex = signal(0); // 0 = Company, 1 = Official
  readonly isLoading = signal(false);
  
  // Company templates state
  readonly companyTemplates = signal<SalaryPackageTemplate[]>([]);
  readonly companySearch = signal('');
  readonly companyStatusFilter = signal<TemplateStatus | ''>('');
  
  // Official templates state
  readonly officialTemplates = signal<SalaryPackageTemplate[]>([]);
  readonly officialSearch = signal('');
  readonly officialCategoryFilter = signal('');
  
  // Clone dialog state
  readonly showCloneDialog = signal(false);
  readonly templateToClone = signal<SalaryPackageTemplate | null>(null);

  // Filter options
  readonly statusOptions = [
    { label: 'Tous', value: '' },
    { label: 'Brouillon', value: TemplateStatus.DRAFT },
    { label: 'Publié', value: TemplateStatus.PUBLISHED },
    { label: 'Archivé', value: TemplateStatus.ARCHIVED }
  ];

  readonly categoryOptions = signal<{ label: string; value: string }[]>([
    { label: 'Toutes', value: '' }
  ]);

  // Computed filtered lists
  readonly filteredCompanyTemplates = computed(() => {
    let templates = this.companyTemplates();
    const search = this.companySearch().toLowerCase();
    const status = this.companyStatusFilter();

    if (search) {
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.code?.toLowerCase().includes(search)
      );
    }

    if (status) {
      templates = templates.filter(t => t.status === status);
    }

    return templates;
  });

  readonly filteredOfficialTemplates = computed(() => {
    let templates = this.officialTemplates();
    const search = this.officialSearch().toLowerCase();
    const category = this.officialCategoryFilter();

    if (search) {
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.code?.toLowerCase().includes(search)
      );
    }

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return templates;
  });

  // Expose enums to template
  readonly TemplateStatus = TemplateStatus;
  readonly OriginType = OriginType;

  ngOnInit(): void {
    this.loadData();

    // Subscribe to context changes
    this.companyContext.contextChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());

    // Subscribe to template changes
    this.salaryPackageService.templateChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());
  }

  private loadData(): void {
    this.loadCompanyTemplates();
    this.loadOfficialTemplates();
  }

  private loadCompanyTemplates(): void {
    const companyId = this.companyContext.companyId();
    if (!companyId) return;

    this.isLoading.set(true);
    this.salaryPackageService.getCompanyTemplates(Number(companyId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.companyTemplates.set(templates);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load company templates:', error);
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les modèles'
          });
        }
      });
  }

  private loadOfficialTemplates(): void {
    this.salaryPackageService.getOfficialTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.officialTemplates.set(templates);
          // Extract unique categories
          const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];
          this.categoryOptions.set([
            { label: 'Toutes', value: '' },
            ...categories.map(c => ({ label: c!, value: c! }))
          ]);
        },
        error: (error) => {
          console.error('Failed to load official templates:', error);
        }
      });
  }

  // ============================================
  // Actions - Company Templates
  // ============================================

  createNewTemplate(): void {
    this.router.navigate(['/app/company/salary-packages/new']);
  }

  viewTemplate(template: SalaryPackageTemplate): void {
    this.router.navigate(['/app/company/salary-packages', template.id]);
  }

  editTemplate(template: SalaryPackageTemplate): void {
    this.router.navigate(['/app/company/salary-packages', template.id, 'edit']);
  }

  duplicateTemplate(template: SalaryPackageTemplate): void {
    const companyId = this.companyContext.companyId();
    if (!companyId) return;

    this.salaryPackageService.duplicate(template.id, Number(companyId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Modèle dupliqué avec succès'
          });
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

  archiveTemplate(template: SalaryPackageTemplate): void {
    this.salaryPackageService.archive(template.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Modèle archivé'
          });
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

  deleteTemplate(template: SalaryPackageTemplate): void {
    this.salaryPackageService.delete(template.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Modèle supprimé'
          });
        },
        error: (error) => {
          console.error('Failed to delete template:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de supprimer le modèle'
          });
        }
      });
  }

  // ============================================
  // Actions - Official Templates
  // ============================================

  viewOfficialTemplate(template: SalaryPackageTemplate): void {
    this.router.navigate(['/app/company/salary-packages/official', template.id]);
  }

  openCloneDialog(template: SalaryPackageTemplate): void {
    this.templateToClone.set(template);
    this.showCloneDialog.set(true);
  }

  onCloneSuccess(): void {
    this.showCloneDialog.set(false);
    this.templateToClone.set(null);
    this.activeTabIndex.set(0); // Switch to company templates tab
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Modèle copié dans vos modèles'
    });
  }

  onCloneCancel(): void {
    this.showCloneDialog.set(false);
    this.templateToClone.set(null);
  }

  // ============================================
  // Helper Methods
  // ============================================

  getStatusSeverity(status: TemplateStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
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

  getOriginLabel(origin: OriginType | undefined): string {
    if (!origin || origin === OriginType.CUSTOM) {
      return 'Personnalisé';
    }
    return 'Copié';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(value);
  }

  switchToOfficialTab(): void {
    this.activeTabIndex.set(1);
  }
}
