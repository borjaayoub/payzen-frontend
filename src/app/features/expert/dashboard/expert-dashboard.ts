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
import { DashboardService, EmployeeSummaryResponse } from '@app/core/services/dashboard.service';
import { Company } from '@app/core/models/company.model';
import { CompanyMembership } from '@app/core/models/membership.model';
import { AuditLogComponent } from '../../../shared/components/audit-log/audit-log.component';
import { Subject, takeUntil } from 'rxjs';

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
    AuditLogComponent
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
  
  // Client View Signals
  readonly clientEmployeeSummary = signal<EmployeeSummaryResponse | null>(null);

  // Context Signals
  readonly isClientView = this.contextService.isClientView;
  readonly currentCompanyName = this.contextService.companyName;

  // Computed
  readonly totalEmployees = computed(() => 
    this.companies().reduce((acc, curr) => acc + (curr.employeeCount || 0), 0)
  );

  ngOnInit(): void {
    // Initial load
    this.loadDataBasedOnContext();

    // Subscribe to context changes
    this.contextService.contextChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDataBasedOnContext();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDataBasedOnContext(): void {
    if (this.isClientView()) {
      this.loadClientDashboard();
    } else {
      this.loadPortfolioDashboard();
    }
  }

  loadPortfolioDashboard(): void {
    this.loadClientCompanies();
    this.loadDashboardSummary();
  }

  loadClientDashboard(): void {
    this.isLoading.set(true);
    this.dashboardService.getEmployeeSummary().subscribe({
      next: (data) => {
        this.clientEmployeeSummary.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load client dashboard', err);
        this.isLoading.set(false);
      }
    });
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
        // Note: Backend doesn't have pending leaves endpoint yet
        // this.pendingLeaves.set(summary.pendingLeaves);
      },
      error: (err) => {
        console.error('Failed to load dashboard summary', err);
      }
    });
  }

  onSelectCompany(company: Company): void {
    this.contextService.switchToClientContext(company);
  }

  getMissingDocsCount(company: Company): number {
    // TODO: Implement when backend provides missing documents count per company
    return 0;
  }

  getLastPayrollStatus(company: Company): 'validated' | 'pending' | 'late' {
    // TODO: Implement when backend provides payroll status
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

  switchContext(company: Company): void {
    // Construct a membership for the target company
    const membership: CompanyMembership = {
      companyId: company.id,
      companyName: company.legalName,
      role: 'admin', // Experts act as admins for their clients
      isExpertMode: false, // Switch to standard mode to manage the company
      permissions: [] // Should be populated from backend
    };
    
    this.contextService.selectContext(membership);
  }
}
