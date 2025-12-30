import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { CompanyContextService } from './companyContext.service';

// Interface for the employee response that includes user/role info
interface EmployeeWithUserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  roleName: string | null;
  statusName: string | null;
}

// Interface for available employees (without user accounts)
export interface AvailableEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private contextService = inject(CompanyContextService);
  private apiUrl = `${environment.apiUrl}/users`;
  private employeeApiUrl = `${environment.apiUrl}/employee`;

  /**
   * Get employees who don't have a user account yet (available for invitation).
   * These are employees with roleName = null.
   */
  getAvailableEmployees(companyId: number): Observable<AvailableEmployee[]> {
    return this.http.get<EmployeeWithUserDto[]>(`${this.employeeApiUrl}/company/${companyId}`).pipe(
      map(employees => {
        // Filter to employees who DON'T have a role (meaning no user account)
        return employees
          .filter(emp => emp.roleName === null || emp.roleName === undefined || emp.roleName === '')
          .map(emp => ({
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            fullName: `${emp.firstName} ${emp.lastName}`.trim()
          }));
      })
    );
  }

  /**
   * Get users by company ID.
   * Uses the employee endpoint since users are linked via Employee.CompanyId.
   * Only returns employees who have an associated user account (with roleName).
   */
  getUsersByCompany(companyId: number): Observable<User[]> {
    return this.http.get<EmployeeWithUserDto[]>(`${this.employeeApiUrl}/company/${companyId}`).pipe(
      map(employees => {
        // Filter to only employees who have a role (meaning they have a user account)
        // Employees without user accounts won't have a roleName
        return employees
          .filter(emp => emp.roleName !== null && emp.roleName !== undefined)
          .map(emp => this.mapEmployeeToUser(emp));
      })
    );
  }

  getUsers(companyId?: number): Observable<User[]> {
    // If no companyId provided, try to get from context, otherwise fetch all (admin?)
    const targetCompanyId = companyId || this.contextService.companyId();
    
    // Use the company-specific endpoint if we have a companyId
    if (targetCompanyId) {
      return this.getUsersByCompany(Number(targetCompanyId));
    }
    
    // Fallback to fetching all users (for admin scenarios)
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(dtos => dtos.map(dto => this.mapDtoToUser(dto)))
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<any>(this.apiUrl, user).pipe(
      map(dto => this.mapDtoToUser(dto))
    );
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, user).pipe(
      map(dto => this.mapDtoToUser(dto))
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Invite user (might be a specific endpoint or just create)
  inviteUser(email: string, role: string, companyId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/invite`, { email, role, companyId });
  }

  private mapDtoToUser(dto: any): User {
    return {
      id: dto.id?.toString(),
      email: dto.email,
      username: dto.username,
      firstName: dto.firstName || dto.employee?.firstName || '',
      lastName: dto.lastName || dto.employee?.lastName || '',
      role: dto.roles?.[0] || 'employee', // Simplified role mapping
      employee_id: dto.employeeId?.toString(),
      companyId: dto.companyId?.toString(),
      companyName: dto.companyName,
      isCabinetExpert: dto.isCabinetExpert
    } as User;
  }

  /**
   * Maps an employee DTO (from /api/employee/company/{id}) to a User object.
   * Used when fetching users via the employee endpoint.
   */
  private mapEmployeeToUser(emp: EmployeeWithUserDto): User {
    return {
      id: emp.id.toString(),
      email: emp.email,
      username: emp.email, // Use email as username fallback
      firstName: emp.firstName,
      lastName: emp.lastName,
      role: emp.roleName || 'employee',
      employee_id: emp.id.toString(),
      companyId: undefined, // Not directly available, but we know it's the requested company
      companyName: emp.companyName,
      isActive: emp.statusName === 'Active' || emp.statusName === 'Actif',
    } as User;
  }
}


