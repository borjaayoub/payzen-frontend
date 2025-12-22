import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, CompanyEvent, TaxRegime } from '../models/company.model';
import { AuthService } from './auth.service';

interface CityDto {
  id: number;
  cityName: string;
  countryId: number;
  countryName: string;
}

interface CompanyDto {
  id: number;
  companyName: string;
  companyAddress: string;
  cityName: string;
  countryName: string;
  cnssNumber: string;
  iceNumber: string;
  rcNumber?: string;
  ifNumber?: string;
  phoneNumber: string;
  email: string;
  createdAt: string;
  // Add other fields as needed based on backend response
}

interface CompanyUpdateDto {
  CompanyName?: string;
  Email?: string;
  PhoneNumber?: string;
  CompanyAddress?: string;
  CityName?: string;
}

// Mapping configuration from frontend model to backend DTO
const COMPANY_FIELD_MAP: Partial<Record<keyof Company, keyof CompanyUpdateDto>> = {
  legalName: 'CompanyName',
  email: 'Email',
  phone: 'PhoneNumber',
  address: 'CompanyAddress',
  city: 'CityName'
};

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}`;

  getCompany(): Observable<Company> {
    const companyId = this.authService.currentUser()?.companyId;
    if (!companyId) {
      // Fallback or error if no company ID is available
      return of({} as Company); 
    }

    return this.http.get<CompanyDto>(`${this.apiUrl}/companies/${companyId}`).pipe(
      map(dto => this.mapDtoToCompany(dto))
    );
  }

  updateCompany(company: Partial<Company>): Observable<Company> {
    const companyId = company.id || this.authService.currentUser()?.companyId;
    
    if (!companyId) {
      console.error('UpdateCompany: No company ID found');
      return throwError(() => new Error('Company ID is required for update'));
    }

    const updateDto = this.mapCompanyToUpdateDto(company);
    const url = `${this.apiUrl}/companies/${companyId}`;

    return this.http.patch<CompanyDto>(url, updateDto).pipe(
      map(dto => this.mapDtoToCompany(dto))
    );
  }

  /**
   * Maps frontend Company model to backend CompanyUpdateDto
   * Only includes fields that are present in the partial Company object
   */
  private mapCompanyToUpdateDto(company: Partial<Company>): CompanyUpdateDto {
    const updateDto: CompanyUpdateDto = {};

    // Iterate over the field mapping and include only fields present in the input
    (Object.keys(COMPANY_FIELD_MAP) as Array<keyof typeof COMPANY_FIELD_MAP>).forEach(frontendKey => {
      if (frontendKey in company) {
        const backendKey = COMPANY_FIELD_MAP[frontendKey];
        if (backendKey) {
          updateDto[backendKey] = company[frontendKey] as string;
        }
      }
    });

    return updateDto;
  }

  searchCities(query: string): Observable<string[]> {
    // The backend /api/cities returns all cities. We filter them client-side.
    return this.http.get<CityDto[]>(`${this.apiUrl}/cities`).pipe(
      map(cities => {
        if (!query) return cities.map(c => c.cityName);
        const lowerQuery = query.toLowerCase();
        return cities
          .filter(c => c.cityName.toLowerCase().includes(lowerQuery))
          .map(c => c.cityName);
      })
    );
  }

  updateLogo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    // Endpoint to be confirmed, keeping as is for now
    return this.http.post(`${this.apiUrl}/company/logo`, formData);
  }

  getCompanyHistory(): Observable<CompanyEvent[]> {
    const companyId = this.authService.currentUser()?.companyId;
    if (!companyId) {
      return of([]);
    }

    return this.http.get<any[]>(`${this.apiUrl}/companies/${companyId}/history`).pipe(
      map(events => events.map(event => this.mapEventDto(event)))
    );
  }

  private mapEventDto(dto: any): CompanyEvent {
    return {
      type: dto.type || dto.eventType || 'general_update',
      title: dto.title || dto.eventTitle || '',
      date: dto.date || dto.eventDate || '',
      description: dto.description || dto.eventDescription || '',
      details: dto.details || {},
      modifiedBy: dto.modifiedBy ? {
        name: dto.modifiedBy.name || dto.modifiedBy.userName || '',
        role: dto.modifiedBy.role || dto.modifiedBy.userRole || ''
      } : undefined,
      timestamp: dto.timestamp || dto.createdAt || new Date().toISOString()
    };
  }

  private mapDtoToCompany(dto: CompanyDto): Company {
    return {
      id: dto.id.toString(),
      legalName: dto.companyName,
      ice: dto.iceNumber,
      rc: dto.rcNumber,
      cnss: dto.cnssNumber,
      address: dto.companyAddress,
      city: dto.cityName,
      country: dto.countryName || 'Maroc', // Default if missing
      email: dto.email,
      phone: dto.phoneNumber,
      // Map other fields with defaults
      postalCode: '',
      taxRegime: TaxRegime.IS, // Default
      fiscalYear: new Date().getFullYear(),
      employeeCount: 0,
      hrParameters: {
        workingDays: [],
        workingHoursPerDay: 8,
        workingHoursPerWeek: 44,
        leaveCalculationMode: 'working_days',
        absenceCalculationMode: 'hourly',
        annualLeaveDays: 18,
        publicHolidays: [],
        probationPeriodDays: 90,
        noticePeriodDays: 30
      },
      documents: {
        cnss_attestation: null,
        amo: null,
        logo: null,
        rib: null,
        other: []
      },
      isActive: true,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.createdAt)
    };
  }
}
