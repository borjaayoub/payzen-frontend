import { Component, signal, computed, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagComponent } from '../../shared/components/tag/tag.component';
import { TagVariant } from '../../shared/components/tag/tag.types';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { EmployeeService, Employee, EmployeeFilters, EmployeeStats, EmployeesResponse } from '@app/core/services/employee.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';

@Component({
  selector: 'app-employees',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagComponent,
    EmptyState,
    AvatarModule,
    BadgeModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './employees.html',
  styleUrl: './employees.css'
})
export class EmployeesPage implements OnInit {
  readonly searchQuery = signal('');
  readonly selectedDepartment = signal<string | null>(null);
  readonly selectedStatus = signal<string | null>(null);

  readonly employees = signal<Employee[]>([]);
  readonly departments = signal<Array<{ label: string; value: string | null }>>([
    { label: 'Tous les départements', value: null }
  ]);
  readonly statuses = signal<Array<{ label: string; value: string | null }>>([
    { label: 'Tous les statuts', value: null }
  ]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly stats = signal<EmployeeStats>({
    total: 0,
    active: 0
  });

  get searchQueryModel(): string {
    return this.searchQuery();
  }

  set searchQueryModel(value: string) {
    this.searchQuery.set(value);
  }

  get selectedDepartmentModel(): string | null {
    return this.selectedDepartment();
  }

  set selectedDepartmentModel(value: string | null) {
    this.selectedDepartment.set(value);
  }

  get selectedStatusModel(): string | null {
    return this.selectedStatus();
  }

  set selectedStatusModel(value: string | null) {
    this.selectedStatus.set(value);
  }

  get disableClearButton(): boolean {
    return (!this.searchQuery() && !this.selectedDepartment() && !this.selectedStatus()) || this.isLoading();
  }

  readonly statCards = [
    {
      label: 'employees.stats.total',
      accessor: (stats: EmployeeStats) => stats.total,
      icon: 'pi pi-users',
      iconColor: 'text-blue-500',
      valueClass: ''
    },
    {
      label: 'employees.stats.active',
      accessor: (stats: EmployeeStats) => stats.active,
      icon: 'pi pi-check-circle',
      iconColor: 'text-green-500',
      valueClass: 'text-success'
    }
  ];

  readonly filteredEmployees = computed(() => {
    let result = this.employees();

    // Filter by search query
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(emp =>
        emp.firstName.toLowerCase().includes(query) ||
        emp.lastName.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query)
      );
    }

    // Filter by department
    if (this.selectedDepartment()) {
      result = result.filter(emp => emp.department === this.selectedDepartment());
    }

    // Filter by status
    if (this.selectedStatus()) {
      result = result.filter(emp => emp.status === this.selectedStatus());
    }

    return result;
  });

  // Route prefix based on current context mode
  private readonly contextService = inject(CompanyContextService);
  private readonly destroyRef = inject(DestroyRef);
  readonly routePrefix = computed(() => this.contextService.isExpertMode() ? '/expert' : '/app');

  constructor(
    private router: Router,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    // Load data immediately
    this.loadEmployees();

    // Subscribe to context changes to reload data
    this.contextService.contextChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadEmployees();
      });
  }

  /**
   * Load employees from backend
   */
  loadEmployees(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filters: EmployeeFilters = {
      searchQuery: this.searchQuery() || undefined,
      department: this.selectedDepartment() || undefined,
      status: this.selectedStatus() || undefined,
      companyId: this.contextService.companyId() ?? undefined
    };

    this.employeeService.getEmployees(filters).subscribe({
      next: (response: EmployeesResponse) => {
        console.log('[EmployeesPage] API response:', response);
        this.employees.set(response.employees);
        console.log('[EmployeesPage] mapped employees:', this.employees());
        this.stats.set({ total: response.total, active: response.active });
        this.departments.set([
          { label: 'Tous les départements', value: null },
          ...this.buildDepartmentOptions(response.departments)
        ]);
        this.statuses.set([
          { label: 'Tous les statuts', value: null },
          ...this.buildStatusOptions(response.statuses)
        ]);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Échec du chargement des employés');
        this.isLoading.set(false);
        console.error('Error loading employees:', err);
      }
    });
  }

  /**
   * Refresh employees when filters change
   */
  applyFilters(): void {
    this.loadEmployees();
  }

  getFullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  getInitials(employee: Employee): string {
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;
  }

  getStatusSeverity(status: string): TagVariant {
    const severityMap: Record<string, TagVariant> = {
      active: 'success',
      on_leave: 'warning',
      inactive: 'danger'
    };
    return severityMap[status] || 'warning';
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      active: 'Actif',
      on_leave: 'En congé',
      inactive: 'Inactif'
    };
    return labelMap[status] || status;
  }

  getContractTypeVariant(type: string): TagVariant {
    const variantMap: Record<string, TagVariant> = {
      CDI: 'success',
      CDD: 'info',
      Stage: 'warning'
    };
    return variantMap[type] || 'default';
  }

  viewEmployee(employee: Employee) {
    this.router.navigate([`${this.routePrefix()}/employees`, employee.id]);
  }

  addEmployee() {
    this.router.navigate([`${this.routePrefix()}/employees`, 'create']);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedDepartment.set(null);
    this.selectedStatus.set(null);
    this.loadEmployees();
  }

  private buildDepartmentOptions(departments: string[] = []): Array<{ label: string; value: string | null }> {
    const uniqueDepartments = Array.from(new Set(departments.filter(Boolean)));
    return uniqueDepartments.map(dep => ({
      label: dep,
      value: dep
    }));
  }

  private buildStatusOptions(statuses: string[] = []): Array<{ label: string; value: string | null }> {
    const uniqueStatuses = Array.from(new Set(statuses.filter(Boolean)));
    return uniqueStatuses.map(status => ({
      label: this.getStatusLabel(status) || status,
      value: status
    }));
  }
}
