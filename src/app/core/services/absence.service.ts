import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Absence,
  AbsenceFilters,
  AbsencesResponse,
  CreateAbsenceRequest,
  UpdateAbsenceRequest,
  AbsenceStats
} from '@app/core/models/absence.model';
import { CompanyContextService } from './companyContext.service';

@Injectable({
  providedIn: 'root'
})
export class AbsenceService {
  private readonly ABSENCE_URL = `${environment.apiUrl}/absences`;
  private contextService = inject(CompanyContextService);

  constructor(private http: HttpClient) {}

  /**
   * Get all absences with optional filters (for HR)
   */
  getAbsences(filters?: AbsenceFilters): Observable<AbsencesResponse> {
    let params = new HttpParams();
    const companyId = this.contextService.companyId();
    
    if (companyId) {
      params = params.set('companyId', String(companyId));
    }

    if (filters) {
      if (filters.employeeId) params = params.set('employeeId', filters.employeeId.toString());
      if (filters.absenceType) params = params.set('absenceType', filters.absenceType);
      if (filters.durationType) params = params.set('durationType', filters.durationType);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<AbsencesResponse>(this.ABSENCE_URL, { params });
  }

  /**
   * Get absences for a specific employee
   */
  getEmployeeAbsences(employeeId: string): Observable<AbsencesResponse> {
    return this.getAbsences({ employeeId: Number(employeeId) });
  }

  /**
   * Get a single absence by ID
   */
  getAbsenceById(id: number): Observable<Absence> {
    return this.http.get<Absence>(`${this.ABSENCE_URL}/${id}`);
  }

  /**
   * Create a new absence request
   */
  createAbsence(request: CreateAbsenceRequest): Observable<Absence> {
    const companyId = this.contextService.companyId();
    const payload = { ...request, companyId };
    return this.http.post<Absence>(this.ABSENCE_URL, payload);
  }

  /**
   * Update an absence
   */
  updateAbsence(id: number, request: UpdateAbsenceRequest): Observable<Absence> {
    return this.http.patch<Absence>(`${this.ABSENCE_URL}/${id}`, request);
  }

  /**
   * Delete an absence
   */
  deleteAbsence(id: number): Observable<void> {
    return this.http.delete<void>(`${this.ABSENCE_URL}/${id}`);
  }

  /**
   * Get absence statistics
   */
  getAbsenceStats(filters?: AbsenceFilters): Observable<AbsenceStats> {
    let params = new HttpParams();
    const companyId = this.contextService.companyId();
    
    if (companyId) {
      params = params.set('companyId', String(companyId));
    }

    if (filters?.employeeId) {
      params = params.set('employeeId', filters.employeeId.toString());
    }

    return this.http.get<AbsenceStats>(`${this.ABSENCE_URL}/stats`, { params });
  }

  /**
   * Upload justification document
   */
  uploadJustification(absenceId: number, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.ABSENCE_URL}/${absenceId}/upload`, formData);
  }
}
