import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

// Employee Summary Response (from /api/employee/summary)
export interface EmployeeSummaryResponse {
  totalEmployees: number;
  activeEmployees: number;
  employees: EmployeeDashboardItem[];
}

export interface EmployeeDashboardItem {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  status: string; // 'active', 'on_leave', 'inactive'
  startDate: string;
  missingDocuments: number;
  contractType: string;
  manager?: string;
}

// Dashboard Summary Response (from /api/dashboard/summary) - Expert Mode
export interface DashboardSummaryResponse {
  totalCompanies: number;
  totalEmployees: number;
  accountingFirmsCount: number;
  avgEmployeesPerCompany: number;
  employeeDistribution: DistributionBucket[];
  recentCompanies: RecentCompany[];
  asOf: string;
}

export interface DistributionBucket {
  bucket: string;
  companiesCount: number;
  employeesCount: number;
  percentage: number;
}

export interface RecentCompany {
  id: number;
  companyName: string;
  countryName: string | null;
  cityName: string | null;
  employeesCount: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get employee summary for standard (client) dashboard
   * Calls: GET /api/employee/summary
   * Returns: Total employees, active employees, and employee list
   */
  getEmployeeSummary(): Observable<EmployeeSummaryResponse> {
    return this.http.get<EmployeeSummaryResponse>(`${this.apiUrl}/employee/summary`);
  }

  /**
   * Get dashboard summary for expert dashboard
   * Calls: GET /api/dashboard/summary
   * Returns: Global statistics including total companies, employees, distribution, etc.
   */
  getDashboardSummary(): Observable<DashboardSummaryResponse> {
    return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/dashboard/summary`);
  }
}
