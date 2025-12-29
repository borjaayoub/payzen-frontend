import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Employee as EmployeeProfileModel } from '@app/core/models/employee.model';
import { CompanyContextService } from '@app/core/services/companyContext.service';

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
  companyId?: string | number;
  page?: number;
  limit?: number;
}

export interface EmployeesResponse {
  employees: Employee[];
  total: number;
  active: number;
  departments: string[];
  statuses: string[];
}

export interface EmployeeStats {
  total: number;
  active: number;
}

interface LookupResponseItem {
  id: number;
  name: string;
}

interface CountryResponseItem {
  id: number;
  countryName: string;
  countryPhoneCode: string;
}

interface CityResponseItem {
  id: number;
  cityName: string;
  countryId: number;
  countryName: string;
}

interface DepartementResponseItem {
  id: number;
  departementName: string;
  companyId: number;
}

interface JobPositionResponseItem {
  id: number;
  name: string;
  companyId: number;
}

interface ContractTypeResponseItem {
  id: number;
  contractTypeName: string;
  companyId: number;
}

interface PotentialManagerResponseItem {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  departementName: string;
}

interface EmployeeFormDataResponse {
  statuses?: LookupResponseItem[];
  genders?: LookupResponseItem[];
  educationLevels?: LookupResponseItem[];
  maritalStatuses?: LookupResponseItem[];
  nationalities?: LookupResponseItem[];
  countries?: CountryResponseItem[];
  cities?: CityResponseItem[];
  departements?: DepartementResponseItem[];
  jobPositions?: JobPositionResponseItem[];
  contractTypes?: ContractTypeResponseItem[];
  potentialManagers?: PotentialManagerResponseItem[];
}

export interface LookupOption {
  id: number;
  label: string;
}

export interface CountryLookupOption extends LookupOption {
  phoneCode: string;
}

export interface CityLookupOption extends LookupOption {
  countryId: number;
  countryName: string;
}

export interface ManagerLookupOption extends LookupOption {
  departmentName: string;
}

export interface EmployeeFormData {
  statuses: LookupOption[];
  genders: LookupOption[];
  educationLevels: LookupOption[];
  maritalStatuses: LookupOption[];
  nationalities: LookupOption[];
  countries: CountryLookupOption[];
  cities: CityLookupOption[];
  departments: LookupOption[];
  jobPositions: LookupOption[];
  contractTypes: LookupOption[];
  potentialManagers: ManagerLookupOption[];
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  cinNumber?: string | null;
  dateOfBirth: string;
  phone: string;
  email: string;
  statusId: number;
  genderId?: number | null;
  educationLevelId?: number | null;
  maritalStatusId?: number | null;
  nationalityId?: number | null;
  countryId?: number | null;
  cityId?: number | null;
  countryPhoneCode?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  zipCode?: string | null;
  departementId?: number | null;
  jobPositionId?: number | null;
  contractTypeId?: number | null;
  managerId?: number | null;
  startDate?: string | null;
  salary?: number | null;
  cnssNumber?: string | null;
  cimrNumber?: string | null;
}

interface DashboardEmployee {
  id: string | number;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  status: string;
  startDate: string;
  missingDocuments: number;
  contractType: string;
  manager?: string | null;
}

interface DashboardEmployeesResponse {
  totalEmployees: number;
  activeEmployees: number;
  employees: DashboardEmployee[];
  departments?: string[];
  statuses?: string[];
}

interface EmployeeAddressResponse {
  addressLine1?: string;
  addressLine2?: string;
  zipCode?: string;
  cityName?: string;
  countryName?: string;
}

interface SalaryComponentResponse {
  componentName: string;
  amount: number;
}

interface BackendEventResponse {
  type: string;
  title: string;
  date: string;
  description: string;
  details?: any;
  modifiedBy?: {
    name: string;
    role: string;
  };
  timestamp: string;
}

interface EmployeeDetailsResponse {
  id: string | number;
  firstName: string;
  lastName: string;
  cinNumber: string;
  maritalStatusName: string;
  dateOfBirth: string;
  statusName: string;
  email: string;
  phone: string | number;
  countryPhoneCode?: string | null;
  address?: EmployeeAddressResponse;
  jobPositionName: string;
  departments?: string | null;
  department?: string;
  departmentName?: string;
  managerName?: string | null;
  contractStartDate: string;
  contractTypeName: string;
  baseSalary: number;
  salaryComponents?: SalaryComponentResponse[];
  totalSalary?: number;
  cnss?: string | number;
  amo?: string | number;
  cimr?: string | number;
  createdAt?: string;
  updatedAt?: string;
  companyId?: string | number;
  userId?: string | number;
  missingDocuments?: number;
  salaryPaymentMethod?: string;
  annualLeave?: number;
  probationPeriod?: string;
  events?: BackendEventResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  // Backend uses /api/employee (singular) for all employee operations
  private readonly EMPLOYEE_URL = `${environment.apiUrl}/employee`;
  private readonly EMPLOYEE_SUMMARY_URL = `${environment.apiUrl}/employee/summary`;

  private readonly contextService = inject(CompanyContextService);

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
    
    // Always include companyId if provided to ensure data isolation
    if (filters.companyId !== undefined && filters.companyId !== null) {
      params = params.set('companyId', filters.companyId.toString());
    }

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return params;
  }

  /**
   * Get all employees with optional filters
   * Backend endpoint: GET /api/employee/summary
   */
  getEmployees(filters?: EmployeeFilters): Observable<EmployeesResponse> {
    const params = this.buildFilterParams(filters);
    return this.http
      .get<DashboardEmployeesResponse>(this.EMPLOYEE_SUMMARY_URL, { params })
      .pipe(map(response => this.mapDashboardEmployeesResponse(response)));
  }

  /**
   * Get employee by ID
   * Backend endpoint: GET /api/employee/{id}
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.EMPLOYEE_URL}/${id}`);
  }

  /**
   * Get detailed employee profile
   * Backend endpoint: GET /api/employee/{id}/details
   */
  getEmployeeDetails(id: string): Observable<EmployeeProfileModel> {
    return this.http
      .get<EmployeeDetailsResponse>(`${this.EMPLOYEE_URL}/${id}/details`)
      .pipe(map(response => this.mapEmployeeDetailsResponse(response)));
  }

  /**
   * Get lookup values to build the employee creation form
   * Backend endpoint: GET /api/employee/form-data
   */
  getEmployeeFormData(): Observable<EmployeeFormData> {
    const companyId = this.contextService.companyId();
    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', String(companyId));
    }

    return this.http
      .get<EmployeeFormDataResponse>(`${this.EMPLOYEE_URL}/form-data`, { params })
      .pipe(map(response => this.mapEmployeeFormDataResponse(response)));
  }

  /**
   * Create new employee
   * Backend endpoint: POST /api/employee
   */
  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.EMPLOYEE_URL, employee);
  }

  /**
   * Create employee record through HR endpoint
   * Backend endpoint: POST /api/employee
   */
  createEmployeeRecord(payload: CreateEmployeeRequest): Observable<any> {
    return this.http.post<any>(this.EMPLOYEE_URL, payload);
  }

  /**
   * Update employee
   * Backend endpoint: PUT /api/employee/{id}
   */
  updateEmployee(id: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.EMPLOYEE_URL}/${id}`, employee);
  }

  /**
   * Patch employee profile details (field-level updates)
   * Backend endpoint: PATCH /api/employee/{id}
   */
  patchEmployeeProfile(id: string, payload: Partial<EmployeeProfileModel>): Observable<EmployeeProfileModel> {
    return this.http
      .patch<EmployeeDetailsResponse>(`${this.EMPLOYEE_URL}/${id}`, payload)
      .pipe(map(response => this.mapEmployeeDetailsResponse(response)));
  }

  /**
   * Delete employee
   * Backend endpoint: DELETE /api/employee/{id}
   */
  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.EMPLOYEE_URL}/${id}`);
  }

  /**
   * Upload employee document
   */
  uploadDocument(employeeId: string, documentType: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    return this.http.post(`${this.EMPLOYEE_URL}/${employeeId}/documents`, formData);
  }

  /**
   * Get employee documents
   * Backend endpoint: GET /api/employee/{id}/documents
   */
  getDocuments(employeeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.EMPLOYEE_URL}/${employeeId}/documents`);
  }

  /**
   * Get employee salary details including components with IDs
   */
  getEmployeeSalaryDetails(employeeId: string): Observable<{ id: number, components: any[] }> {
    return this.http.get<any[]>(`${environment.apiUrl}/employee-salaries/employee/${employeeId}`).pipe(
      map(salaries => {
        // Find active salary (no end date)
        return salaries.find(s => !s.endDate);
      }),
      switchMap(activeSalary => {
        if (!activeSalary) return of({ id: 0, components: [] });
        return this.http.get<any[]>(`${environment.apiUrl}/employee-salary-components/salary/${activeSalary.id}`).pipe(
          map(components => ({
            id: activeSalary.id,
            components: components.map(c => ({
              id: c.id,
              employeeSalaryId: c.employeeSalaryId,
              type: c.componentType,
              amount: c.amount
            }))
          }))
        );
      })
    );
  }

  addSalaryComponent(component: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/employee-salary-components`, component);
  }

  updateSalaryComponent(id: number, component: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/employee-salary-components/${id}`, component);
  }

  deleteSalaryComponent(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/employee-salary-components/${id}`);
  }


  /**
   * Search countries
   */
  searchCountries(query: string): Observable<CountryLookupOption[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<CountryResponseItem[]>(`${environment.apiUrl}/countries`, { params })
      .pipe(map(items => {
        const allItems = (items || []).map(item => ({
          id: item.id,
          label: item.countryName,
          phoneCode: item.countryPhoneCode
        }));
        
        if (!query) return allItems;
        
        const lowerQuery = query.toLowerCase();
        return allItems.filter(item => item.label.toLowerCase().includes(lowerQuery));
      }));
  }

  /**
   * Search cities
   */
  searchCities(query: string): Observable<CityLookupOption[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<CityResponseItem[]>(`${environment.apiUrl}/cities`, { params })
      .pipe(map(items => {
        const allItems = (items || []).map(item => ({
          id: item.id,
          label: item.cityName,
          countryId: item.countryId,
          countryName: item.countryName
        }));
        
        if (!query) return allItems;
        
        const lowerQuery = query.toLowerCase();
        return allItems.filter(item => item.label.toLowerCase().includes(lowerQuery));
      }));
  }

  /**
   * Create new country
   */
  createCountry(name: string): Observable<CountryLookupOption> {
    return this.http.post<CountryResponseItem>(`${environment.apiUrl}/countries`, { countryName: name })
      .pipe(map(item => ({
        id: item.id,
        label: item.countryName,
        phoneCode: item.countryPhoneCode
      })));
  }

  /**
   * Create new city
   */
  createCity(name: string, countryId?: number): Observable<CityLookupOption> {
    return this.http.post<CityResponseItem>(`${environment.apiUrl}/cities`, { cityName: name, countryId })
      .pipe(map(item => ({
        id: item.id,
        label: item.cityName,
        countryId: item.countryId,
        countryName: item.countryName
      })));
  }

  private mapEmployeeFormDataResponse(response: EmployeeFormDataResponse = {} as EmployeeFormDataResponse): EmployeeFormData {
    const toLookupOption = (items?: LookupResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.id, label: item.name }));

    const toCountryOption = (items?: CountryResponseItem[]): CountryLookupOption[] =>
      (items ?? []).map(item => ({
        id: item.id,
        label: item.countryName,
        phoneCode: item.countryPhoneCode
      }));

    const toCityOption = (items?: CityResponseItem[]): CityLookupOption[] =>
      (items ?? []).map(item => ({
        id: item.id,
        label: item.cityName,
        countryId: item.countryId,
        countryName: item.countryName
      }));

    const toDepartmentOption = (items?: DepartementResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.id, label: item.departementName }));

    const toJobPositionOption = (items?: JobPositionResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.id, label: item.name }));

    const toContractTypeOption = (items?: ContractTypeResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.id, label: item.contractTypeName }));

    const toManagerOption = (items?: PotentialManagerResponseItem[]): ManagerLookupOption[] =>
      (items ?? []).map(item => ({
        id: item.id,
        label: (item.fullName || `${item.firstName ?? ''} ${item.lastName ?? ''}`).trim(),
        departmentName: item.departementName
      }));

    return {
      statuses: toLookupOption(response?.statuses),
      genders: toLookupOption(response?.genders),
      educationLevels: toLookupOption(response?.educationLevels),
      maritalStatuses: toLookupOption(response?.maritalStatuses),
      nationalities: toLookupOption(response?.nationalities),
      countries: toCountryOption(response?.countries),
      cities: toCityOption(response?.cities),
      departments: toDepartmentOption(response?.departements),
      jobPositions: toJobPositionOption(response?.jobPositions),
      contractTypes: toContractTypeOption(response?.contractTypes),
      potentialManagers: toManagerOption(response?.potentialManagers)
    };
  }

  private mapDashboardEmployeesResponse(response: DashboardEmployeesResponse): EmployeesResponse {
    const employees = (response?.employees ?? []).map(emp => this.mapDashboardEmployee(emp));
    const total = response?.totalEmployees ?? employees.length;
    const active = response?.activeEmployees ?? employees.filter(emp => emp.status === 'active').length;
    const departments = Array.from(new Set(response?.departments ?? employees
      .map(emp => emp.department)
      .filter(dep => !!dep))) as string[];
    const statuses = Array.from(new Set(response?.statuses ?? employees
      .map(emp => emp.status)
      .filter(status => !!status))) as string[];

    return { employees, total, active, departments, statuses };
  }

  private mapDashboardEmployee(employee: DashboardEmployee): Employee {
    return {
      id: this.toStringValue(employee.id),
      firstName: employee.firstName ?? '',
      lastName: employee.lastName ?? '',
      position:  employee.position ?? 'Non assigné',
      department: employee.department ?? '',
      status: this.mapEmployeeStatus(employee.status),
      startDate: employee.startDate ?? '',
      missingDocuments: this.toNumberValue(employee.missingDocuments),
      contractType: this.mapContractType(employee.contractType),
      manager: employee.manager ?? undefined
    };
  }

  private mapEmployeeDetailsResponse(payload: EmployeeDetailsResponse): EmployeeProfileModel {
    const salaryComponents = (payload.salaryComponents ?? []).map(c => ({
      type: c.componentName,
      amount: c.amount
    }));
    
    // Handle potential PascalCase from backend for Address object
    const addressPayload = payload.address || (payload as any).Address;
    const cityName = addressPayload?.cityName || addressPayload?.CityName || '';
    const countryName = addressPayload?.countryName || addressPayload?.CountryName || '';
    const addressLine1 = addressPayload?.addressLine1 || addressPayload?.AddressLine1 || '';
    const addressLine2 = addressPayload?.addressLine2 || addressPayload?.AddressLine2 || '';
    const zipCode = addressPayload?.zipCode || addressPayload?.ZipCode || '';

    const detail: EmployeeProfileModel = {
      id: this.toStringValue(payload.id),
      firstName: payload.firstName ?? '',
      lastName: payload.lastName ?? '',
      photo: undefined,
      cin: payload.cinNumber ?? '',
      maritalStatus: this.mapMaritalStatus(payload.maritalStatusName),
      dateOfBirth: payload.dateOfBirth ?? '',
      birthPlace: cityName, // Use extracted city name
      professionalEmail: payload.email ?? '',
      personalEmail: payload.email ?? '',
      phone: this.composePhone(payload.countryPhoneCode, payload.phone),
      address: this.formatAddress(addressPayload),
      // Map individual address fields from the nested address object
      countryId: undefined, // Backend doesn't return ID, only name
      countryName: countryName,
      city: cityName,
      addressLine1: addressLine1,
      addressLine2: addressLine2,
      zipCode: zipCode,
      position: payload.jobPositionName ?? 'Non assigné',
      department: payload.department ?? payload.departmentName ?? payload.departments ?? '',
      manager: payload.managerName ?? '',
      contractType: this.mapContractType(payload.contractTypeName),
      startDate: payload.contractStartDate ?? '',
      endDate: undefined,
      probationPeriod: payload.probationPeriod ?? '',
      exitReason: undefined,
      baseSalary: payload.baseSalary ?? 0,
      salaryComponents,
      activeSalaryId: undefined, // Will be populated separately
      paymentMethod: this.mapPaymentMethod(payload.salaryPaymentMethod),
      cnss: this.toStringValue(payload.cnss),
      amo: this.toStringValue(payload.amo),
      cimr: this.toStringValue(payload.cimr) || undefined,
      annualLeave: payload.annualLeave ?? 0,
      status: this.mapEmployeeStatus(payload.statusName),
      missingDocuments: payload.missingDocuments ?? 0,
      companyId: this.toStringValue(payload.companyId) || undefined,
      userId: this.toStringValue(payload.userId) || undefined,
      createdAt: payload.createdAt ? new Date(payload.createdAt) : undefined,
      updatedAt: payload.updatedAt ? new Date(payload.updatedAt) : undefined,
      events: (payload.events || []).map(event => ({
        type: event.type,
        title: event.title,
        date: event.date,
        description: event.description,
        details: event.details,
        modifiedBy: event.modifiedBy ? {
          name: event.modifiedBy.name,
          role: event.modifiedBy.role
        } : undefined,
        timestamp: event.timestamp
      }))
    };

    return detail;
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

  private mapMaritalStatus(status?: string): EmployeeProfileModel['maritalStatus'] {
    const normalized = (status ?? '').toLowerCase();
    if (normalized.includes('mari')) return 'married';
    if (normalized.includes('divorc')) return 'divorced';
    if (normalized.includes('veuf') || normalized.includes('veuve')) return 'widowed';
    return 'single';
  }

  private mapPaymentMethod(method?: string): EmployeeProfileModel['paymentMethod'] {
    const normalized = (method ?? '').toLowerCase();
    if (normalized.includes('ch')) return 'check';
    if (normalized.includes('esp')) return 'cash';
    return 'bank_transfer';
  }

  private composePhone(code?: string | null, phone?: string | number): string {
    const cleanCode = code ? String(code).trim() : '';
    const cleanPhone = phone ? String(phone).trim() : '';
    return `${cleanCode} ${cleanPhone}`.trim();
  }

  private formatAddress(address?: any): string {
    if (!address) {
      return '';
    }
    
    const line1 = address.addressLine1 || address.AddressLine1;
    const line2 = address.addressLine2 || address.AddressLine2;
    const city = address.cityName || address.CityName;
    const zip = address.zipCode || address.ZipCode;
    const country = address.countryName || address.CountryName;

    const parts = [line1, line2, city, zip, country]
      .filter(part => !!part)
      .map(part => part?.trim());
    return parts.join(', ');
  }

  private toStringValue(value: string | number | undefined | null): string {
    return value !== undefined && value !== null ? String(value) : '';
  }

  private toNumberValue(value: number | string | undefined | null): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
}
