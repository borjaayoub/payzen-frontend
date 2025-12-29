import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { CompanyContextService } from './companyContext.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private contextService = inject(CompanyContextService);
  private apiUrl = `${environment.apiUrl}/users`;

  getUsers(companyId?: number): Observable<User[]> {
    // If no companyId provided, try to get from context, otherwise fetch all (admin?)
    const targetCompanyId = companyId || this.contextService.companyId();
    
    let params = new HttpParams();
    if (targetCompanyId) {
      params = params.set('companyId', targetCompanyId.toString());
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
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
}


