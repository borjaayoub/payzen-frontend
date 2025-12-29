import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { CompanyService } from '@app/core/services/company.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';
import { DashboardService } from '@app/core/services/dashboard.service';
import { Company } from '@app/core/models/company.model';
import { AuditLogComponent } from '../../../shared/components/audit-log/audit-log.component';
import { Subject, takeUntil } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { ClientFormComponent } from '../components/client-form/client-form.component';

@Component({
  selector: 'app-expert-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    AuditLogComponent,
    DialogModule,
    ClientFormComponent
  ],
  templateUrl: './expert-dashboard.html',
  styleUrl: './expert-dashboard.css'
})
export class ExpertDashboard implements OnInit, OnDestroy {
  private companyService = inject(CompanyService);
  private contextService = inject(CompanyContextService);
  private dashboardService = inject(DashboardService);
  private destroy$ = new Subject<void>();

  // Signals
  readonly companies = signal<Company[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly searchQuery = signal<string>('');
  readonly pendingLeaves = signal<number>(0);
  readonly totalClients = signal<number>(0);
  readonly globalEmployeeCount = signal<number>(0);
  
  // Dialog state
  readonly isClientFormVisible = signal<boolean>(false);
  readonly clientFormMode = signal<'create' | 'edit'>('create');
  readonly selectedCompanyForEdit = signal<Company | undefined>(undefined);

  // Computed
  readonly totalEmployees = computed(() => 
    this.companies().reduce((acc, curr) => acc + (curr.employeeCount || 0), 0)
  );

  ngOnInit(): void {
    this.loadPortfolioDashboard();

    // Subscribe to context changes
    this.contextService.contextChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadPortfolioDashboard();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPortfolioDashboard(): void {
    this.loadClientCompanies();
    // Dashboard summary endpoint is currently not available in the backend
    // this.loadDashboardSummary();
  }

  loadClientCompanies(): void {
    this.isLoading.set(true);
    
    this.companyService.getManagedCompanies().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load managed companies', err);
        this.isLoading.set(false);
      }
    });
  }

  loadDashboardSummary(): void {
    this.dashboardService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.totalClients.set(summary.totalCompanies);
        this.globalEmployeeCount.set(summary.totalEmployees);
      },
      error: (err) => {
        console.error('Failed to load dashboard summary', err);
      }
    });
  }

  onSelectCompany(company: Company): void {
    this.contextService.switchToClientContext(company, true);
  }

  getMissingDocsCount(company: Company): number {
    return 0;
  }

  getLastPayrollStatus(company: Company): 'validated' | 'pending' | 'late' {
    return 'pending';
  }

  getSeverity(status: boolean): 'success' | 'danger' {
    return status ? 'success' : 'danger';
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Active' : 'Inactive';
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  openCreateClient(): void {
    this.clientFormMode.set('create');
    this.selectedCompanyForEdit.set(undefined);
    this.isClientFormVisible.set(true);
  }

  openEditClient(company: Company): void {
    this.clientFormMode.set('edit');
    this.selectedCompanyForEdit.set(company);
    this.isClientFormVisible.set(true);
  }

  onClientSaved(): void {
    this.isClientFormVisible.set(false);
    this.loadClientCompanies(); // Refresh list
  }
}
