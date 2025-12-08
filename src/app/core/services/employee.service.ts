import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  status: 'active' | 'on_leave' | 'inactive';
  startDate: string;
  missingDocuments: number;
  contractType: 'CDI' | 'CDD' | 'Stage';
  manager?: string;
}

export interface EmployeeFilters {
  searchQuery?: string;
  department?: string;
  status?: string;
  contractType?: string;
  page?: number;
  limit?: number;
}

export interface EmployeesResponse {
  employees: Employee[];
  total: number;
  active: number;
}

export interface EmployeeStats {
  total: number;
  active: number;
}

interface DashboardEmployee {
  Id: string | number;
  FirstName: string;
  LastName: string;
  Position: string;
  Department: string;
  Status: string;
  StartDate: string;
  MissingDocuments: number;
  ContractType: string;
  Manager?: string | null;
}

interface DashboardEmployeesResponse {
  TotalEmployees: number;
  ActiveEmployees: number;
  Employees: DashboardEmployee[];
}


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly EMPLOYEES_URL = `${environment.apiUrl}/employees`;
  private readonly DASHBOARD_EMPLOYEES_URL = `${environment.apiUrl}/dashboard/employees`;

  constructor(private http: HttpClient) {}

  private buildFilterParams(filters?: EmployeeFilters): HttpParams {
    let params = new HttpParams();

    if (!filters) {
      return params;
    }

    if (filters.searchQuery) params = params.set('search', filters.searchQuery);
    if (filters.department) params = params.set('department', filters.department);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.contractType) params = params.set('contractType', filters.contractType);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return params;
  }

  /**
   * Get all employees with optional filters
   */
  getEmployees(filters?: EmployeeFilters): Observable<EmployeesResponse> {
    const params = this.buildFilterParams(filters);
    return this.http
      .get<DashboardEmployeesResponse>(this.DASHBOARD_EMPLOYEES_URL, { params })
      .pipe(map(response => this.mapDashboardEmployeesResponse(response)));
  }

  /**
   * Get employee by ID
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.EMPLOYEES_URL}/${id}`);
  }

  /**
   * Create new employee
   */
  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.EMPLOYEES_URL, employee);
  }

  /**
   * Update employee
   */
  updateEmployee(id: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.EMPLOYEES_URL}/${id}`, employee);
  }

  /**
   * Delete employee
   */
  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.EMPLOYEES_URL}/${id}`);
  }

  /**
   * Upload employee document
   */
  uploadDocument(employeeId: string, documentType: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    return this.http.post(`${this.EMPLOYEES_URL}/${employeeId}/documents`, formData);
  }

  /**
   * Get employee documents
   */
  getDocuments(employeeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.EMPLOYEES_URL}/${employeeId}/documents`);
  }

  private mapDashboardEmployeesResponse(response: DashboardEmployeesResponse): EmployeesResponse {
    const employees = (response?.Employees ?? []).map(emp => this.mapDashboardEmployee(emp));
    const total = response?.TotalEmployees ?? employees.length;
    const active = response?.ActiveEmployees ?? employees.filter(emp => emp.status === 'active').length;

    return { employees, total, active };
  }

  private mapDashboardEmployee(employee: DashboardEmployee): Employee {
    return {
      id: this.toStringValue(employee.Id),
      firstName: employee.FirstName ?? '',
      lastName: employee.LastName ?? '',
      position: employee.Position ?? 'Non assigné',
      department: employee.Department ?? '',
      status: this.mapEmployeeStatus(employee.Status),
      startDate: employee.StartDate ?? '',
      missingDocuments: this.toNumberValue(employee.MissingDocuments),
      contractType: this.mapContractType(employee.ContractType),
      manager: employee.Manager ?? undefined
    };
  }

  private mapEmployeeStatus(status?: string): Employee['status'] {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'active') return 'active';
    if (normalized === 'on_leave' || normalized === 'on leave' || normalized === 'en congé') return 'on_leave';
    return 'inactive';
  }

  private mapContractType(type?: string): Employee['contractType'] {
    const normalized = (type ?? '').toLowerCase();
    if (normalized === 'cdd') return 'CDD';
    if (normalized === 'stage' || normalized === 'intern') return 'Stage';
    return 'CDI';
  }

  private toStringValue(value: string | number | undefined | null): string {
    return value !== undefined && value !== null ? String(value) : '';
  }

  private toNumberValue(value: number | string | undefined | null): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
}
