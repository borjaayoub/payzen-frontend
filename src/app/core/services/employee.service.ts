import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly API_URL = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  /**
   * Get all employees with optional filters
   */
  getEmployees(filters?: EmployeeFilters): Observable<EmployeesResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.searchQuery) params = params.set('search', filters.searchQuery);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.contractType) params = params.set('contractType', filters.contractType);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<EmployeesResponse>(this.API_URL, { params });
  }

  /**
   * Get employee by ID
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.API_URL}/${id}`);
  }

  /**
   * Create new employee
   */
  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.API_URL, employee);
  }

  /**
   * Update employee
   */
  updateEmployee(id: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.API_URL}/${id}`, employee);
  }

  /**
   * Delete employee
   */
  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  /**
   * Get employee statistics
   */
  getStatistics(): Observable<any> {
    return this.http.get(`${this.API_URL}/statistics`);
  }

  /**
   * Upload employee document
   */
  uploadDocument(employeeId: string, documentType: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    return this.http.post(`${this.API_URL}/${employeeId}/documents`, formData);
  }

  /**
   * Get employee documents
   */
  getDocuments(employeeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/${employeeId}/documents`);
  }
}
