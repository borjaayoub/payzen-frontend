import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Company, TaxRegime } from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  // Mock data
  private mockCompany: Company = {
    id: '1',
    legalName: 'Tech Solutions SARL',
    ice: '123456789',
    cnss: '987654321',
    address: '123 Innovation Blvd',
    city: 'Casablanca',
    postalCode: '20000',
    country: 'Morocco',
    email: 'contact@techsolutions.ma',
    phone: '+212 5 22 00 00 00',
    website: 'www.techsolutions.ma',
    taxRegime: TaxRegime.IS,
    fiscalYear: 2024,
    employeeCount: 45,
    hrParameters: {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workingHoursPerDay: 8,
      workingHoursPerWeek: 40,
      leaveCalculationMode: 'working_days',
      absenceCalculationMode: 'working_days',
      annualLeaveDays: 18,
      publicHolidays: [],
      probationPeriodDays: 90,
      noticePeriodDays: 30,
      defaultPaymentMode: 'virement',
      leaveAccrualRate: 1.5
    },
    documents: {
      rc: 'rc.pdf',
      patente: 'patente.pdf',
      if: 'if.pdf',
      ice: 'ice.pdf'
    } as any, // Casting for now as CompanyDocuments interface might be different
    isActive: true,
    logoUrl: 'assets/images/logo-placeholder.png',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  private companySignal = signal<Company>(this.mockCompany);

  getCompany(): Observable<Company> {
    return of(this.mockCompany).pipe(delay(500));
  }

  updateCompany(company: Partial<Company>): Observable<Company> {
    this.mockCompany = { ...this.mockCompany, ...company };
    this.companySignal.set(this.mockCompany);
    return of(this.mockCompany).pipe(delay(500));
  }

  updateLogo(file: File): Observable<string> {
    // Mock upload
    return of('assets/images/new-logo.png').pipe(delay(1000));
  }
}
