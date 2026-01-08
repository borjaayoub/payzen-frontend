import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface EmployeeCategory {
  id: number;
  companyId: number;
  companyName?: string;
  name: string;
  mode: string | number;
  modeDescription?: string;
  createdAt?: string;
}

export interface EmployeeCategoryCreateDto {
  companyId: number;
  name: string;
  mode: string | number;
}

export interface EmployeeCategoryUpdateDto {
  name?: string;
  mode?: string | number;
}

export interface EmployeeCategoryLookupOption {
  id: number;
  label: string;
  mode?: string | number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeCategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/employee-categories`;

  /**
   * Get all categories for a company
   */
  getByCompany(companyId: number): Observable<EmployeeCategory[]> {
    // Try the more explicit "by-company" route first, then fallback to older "company" route
    const primary = `${this.baseUrl}/by-company/${companyId}`;
    const fallback = `${this.baseUrl}/company/${companyId}`;

    return this.http.get<EmployeeCategory[]>(primary).pipe(
      catchError(err => {
        if (err?.status === 404) {
          return this.http.get<EmployeeCategory[]>(fallback);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Get categories as lookup options for dropdowns
   */
  getLookupOptions(companyId: number): Observable<EmployeeCategoryLookupOption[]> {
    return this.getByCompany(companyId).pipe(
      map(categories => categories.map(c => ({ id: c.id, label: c.name, mode: c.mode })))
    );
  }

  /**
   * Get a specific category by ID
   */
  getById(id: number): Observable<EmployeeCategory> {
    return this.http.get<EmployeeCategory>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new category
   */
  create(dto: EmployeeCategoryCreateDto): Observable<EmployeeCategory> {
    return this.http.post<EmployeeCategory>(this.baseUrl, dto);
  }

  /**
   * Update an existing category
   */
  update(id: number, dto: EmployeeCategoryUpdateDto): Observable<EmployeeCategory> {
    // backend Update DTO uses optional fields, prefer PATCH
    return this.http.patch<EmployeeCategory>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Delete a category
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
