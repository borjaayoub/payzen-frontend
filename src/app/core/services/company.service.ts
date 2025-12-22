import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, TaxRegime } from '../models/company.model';
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
    // Use ID from the company object if available, otherwise fallback to auth service
    const companyId = company.id || this.authService.currentUser()?.companyId;
    
    if (!companyId) {
      console.error('UpdateCompany: No company ID found');
      return throwError(() => new Error('Company ID is required for update'));
    }

    // Map frontend model to backend DTO
    const updateDto: any = {};
    if (company.legalName) updateDto.CompanyName = company.legalName;
    if (company.email) updateDto.Email = company.email;
    if (company.phone) updateDto.PhoneNumber = company.phone;
    if (company.address) updateDto.CompanyAddress = company.address;
    // Note: Backend might expect CityId/CountryId instead of names for update.
    // Keeping existing mapping for now but this might need adjustment if 400 occurs.
    if (company.city) updateDto.CityName = company.city; 
    
    const url = `${this.apiUrl}/companies/${companyId}`;
    console.log('Updating company at URL:', url, 'Method: PATCH', 'Payload:', updateDto);

    return this.http.patch<CompanyDto>(url, updateDto).pipe(
      map(dto => this.mapDtoToCompany(dto))
    );
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
