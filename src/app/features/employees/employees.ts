import { Component, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { EmployeeService, Employee, EmployeeFilters, EmployeeStats } from '@app/core/services/employee.service';

@Component({
  selector: 'app-employees',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
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

  readonly departments = [
    { label: 'Tous les départements', value: null },
    { label: 'IT', value: 'IT' },
    { label: 'RH', value: 'RH' },
    { label: 'Finance', value: 'Finance' },
    { label: 'Marketing', value: 'Marketing' }
  ];

  readonly statuses = [
    { label: 'Tous les statuts', value: null },
    { label: 'Actif', value: 'active' },
    { label: 'En congé', value: 'on_leave' },
    { label: 'Inactif', value: 'inactive' }
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

  constructor(
    private router: Router,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
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
      status: this.selectedStatus() || undefined
    };

    this.employeeService.getEmployees(filters).subscribe({
      next: (response) => {
      this.employees.set(response.employees);
      this.isLoading.set(false);
      },
      error: (err) => {
      this.error.set(err.error?.message || 'Échec du chargement des employés');
      this.isLoading.set(false);
      console.error('Error loading employees:', err);
      }
    });

    this.loadStatistics(filters);
  }

  private loadStatistics(filters?: EmployeeFilters): void {
    this.employeeService.getStatistics(filters).subscribe({
      next: stats => this.stats.set(stats),
      error: err => console.error('Error loading employee statistics:', err)
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

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
    const severityMap: Record<string, 'success' | 'warn' | 'danger'> = {
      active: 'success',
      on_leave: 'warn',
      inactive: 'danger'
    };
    return severityMap[status] || 'warn';
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      active: 'Actif',
      on_leave: 'En congé',
      inactive: 'Inactif'
    };
    return labelMap[status] || status;
  }

  getContractTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      CDI: 'bg-green-100 text-green-600',
      CDD: 'bg-blue-100 text-blue-600',
      Stage: 'bg-purple-100 text-purple-600'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-600';
  }

  viewEmployee(employee: Employee) {
    this.router.navigate(['/employees', employee.id]);
  }

  addEmployee() {
    this.router.navigate(['/employees', 'new']);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedDepartment.set(null);
    this.selectedStatus.set(null);
    this.loadEmployees();
  }
}
