import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Employee as EmployeeProfileModel } from '@app/core/models/employee.model';

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
  active: number;
  departments: string[];
  statuses: string[];
}

export interface EmployeeStats {
  total: number;
  active: number;
}

interface LookupResponseItem {
  Id: number;
  Name: string;
}

interface CountryResponseItem {
  Id: number;
  CountryName: string;
  CountryPhoneCode: string;
}

interface CityResponseItem {
  Id: number;
  CityName: string;
  CountryId: number;
  CountryName: string;
}

interface DepartementResponseItem {
  Id: number;
  DepartementName: string;
  CompanyId: number;
}

interface JobPositionResponseItem {
  Id: number;
  Name: string;
  CompanyId: number;
}

interface ContractTypeResponseItem {
  Id: number;
  ContractTypeName: string;
  CompanyId: number;
}

interface PotentialManagerResponseItem {
  Id: number;
  FirstName: string;
  LastName: string;
  FullName: string;
  DepartementName: string;
}

interface EmployeeFormDataResponse {
  Statuses?: LookupResponseItem[];
  Genders?: LookupResponseItem[];
  EducationLevels?: LookupResponseItem[];
  MaritalStatuses?: LookupResponseItem[];
  Nationalities?: LookupResponseItem[];
  Countries?: CountryResponseItem[];
  Cities?: CityResponseItem[];
  Departements?: DepartementResponseItem[];
  JobPositions?: JobPositionResponseItem[];
  ContractTypes?: ContractTypeResponseItem[];
  PotentialManagers?: PotentialManagerResponseItem[];
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
  departements: LookupOption[];
  jobPositions: LookupOption[];
  contractTypes: LookupOption[];
  potentialManagers: ManagerLookupOption[];
}

export interface CreateEmployeeRequest {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  StatusId: number;
  GenderId?: number | null;
  EducationLevelId?: number | null;
  MaritalStatusId?: number | null;
  NationalityId?: number | null;
  CountryId?: number | null;
  CityId?: number | null;
  CountryPhoneCode?: string | null;
  AddressLine1?: string | null;
  AddressLine2?: string | null;
  ZipCode?: string | null;
  DepartementId?: number | null;
  JobPositionId?: number | null;
  ContractTypeId?: number | null;
  ManagerId?: number | null;
  StartDate?: string | null;
  Salary?: number | null;
}

interface DashboardEmployee {
  Id: string | number;
  FirstName: string;
  LastName: string;
  Position: string;
  Department: string;
  Status: string;
  StartDate: string;
  MissingDocuments: number;
  ContractType: string;
  Manager?: string | null;
}

interface DashboardEmployeesResponse {
  TotalEmployees: number;
  ActiveEmployees: number;
  Employees: DashboardEmployee[];
  Departments?: string[];
  Statuses?: string[];
}

interface EmployeeAddressResponse {
  AddressLine1?: string;
  AddressLine2?: string;
  ZipCode?: string;
  CityName?: string;
  CountryName?: string;
}

interface SalaryComponentResponse {
  ComponentName: string;
  Amount: number;
}

interface EmployeeDetailsResponse {
  Id: string | number;
  FirstName: string;
  LastName: string;
  CinNumber: string;
  MaritalStatusName: string;
  DateOfBirth: string;
  StatusName: string;
  Email: string;
  Phone: string | number;
  CountryPhoneCode?: string;
  Address?: EmployeeAddressResponse;
  JobPositionName: string;
  Department?: string;
  DepartmentName?: string;
  ManagerName?: string | null;
  ContractStartDate: string;
  ContractTypeName: string;
  BaseSalary: number;
  SalaryComponents?: SalaryComponentResponse[];
  TotalSalary?: number;
  CNSS?: string | number;
  AMO?: string | number;
  CIMR?: string | number;
  CreatedAt?: string;
  UpdatedAt?: string;
  CompanyId?: string | number;
  UserId?: string | number;
  MissingDocuments?: number;
  SalaryPaymentMethod?: string;
  AnnualLeave?: number;
  ProbationPeriod?: string;
}


@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly EMPLOYEES_URL = `${environment.apiUrl}/employees`;
  private readonly DASHBOARD_EMPLOYEES_URL = `${environment.apiUrl}/dashboard/employees`;
  private readonly EMPLOYEE_DETAILS_URL = `${environment.apiUrl}/employee`;

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
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return params;
  }

  /**
   * Get all employees with optional filters
   */
  getEmployees(filters?: EmployeeFilters): Observable<EmployeesResponse> {
    const params = this.buildFilterParams(filters);
    return this.http
      .get<DashboardEmployeesResponse>(this.DASHBOARD_EMPLOYEES_URL, { params })
      .pipe(map(response => this.mapDashboardEmployeesResponse(response)));
  }

  /**
   * Get employee by ID
   */
  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.EMPLOYEES_URL}/${id}`);
  }

  /**
   * Get detailed employee profile
   */
  getEmployeeDetails(id: string): Observable<EmployeeProfileModel> {
    return this.http
      .get<EmployeeDetailsResponse>(`${this.EMPLOYEE_DETAILS_URL}/${id}/details`)
      .pipe(map(response => this.mapEmployeeDetailsResponse(response)));
  }

  /**
   * Get lookup values to build the employee creation form
   */
  getEmployeeFormData(): Observable<EmployeeFormData> {
    return this.http
      .get<EmployeeFormDataResponse>(`${this.EMPLOYEE_DETAILS_URL}/form-data`)
      .pipe(map(response => this.mapEmployeeFormDataResponse(response)));
  }

  /**
   * Create new employee
   */
  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.EMPLOYEES_URL, employee);
  }

  /**
   * Create employee record through HR endpoint
   */
  createEmployeeRecord(payload: CreateEmployeeRequest): Observable<any> {
    return this.http.post<any>(this.EMPLOYEE_DETAILS_URL, payload);
  }

  /**
   * Update employee
   */
  updateEmployee(id: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.EMPLOYEES_URL}/${id}`, employee);
  }

  /**
   * Delete employee
   */
  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.EMPLOYEES_URL}/${id}`);
  }

  /**
   * Upload employee document
   */
  uploadDocument(employeeId: string, documentType: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    return this.http.post(`${this.EMPLOYEES_URL}/${employeeId}/documents`, formData);
  }

  /**
   * Get employee documents
   */
  getDocuments(employeeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.EMPLOYEES_URL}/${employeeId}/documents`);
  }

  private mapEmployeeFormDataResponse(response: EmployeeFormDataResponse = {} as EmployeeFormDataResponse): EmployeeFormData {
    const toLookupOption = (items?: LookupResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.Id, label: item.Name }));

    const toCountryOption = (items?: CountryResponseItem[]): CountryLookupOption[] =>
      (items ?? []).map(item => ({
        id: item.Id,
        label: item.CountryName,
        phoneCode: item.CountryPhoneCode
      }));

    const toCityOption = (items?: CityResponseItem[]): CityLookupOption[] =>
      (items ?? []).map(item => ({
        id: item.Id,
        label: item.CityName,
        countryId: item.CountryId,
        countryName: item.CountryName
      }));

    const toDepartementOption = (items?: DepartementResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.Id, label: item.DepartementName }));

    const toJobPositionOption = (items?: JobPositionResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.Id, label: item.Name }));

    const toContractTypeOption = (items?: ContractTypeResponseItem[]): LookupOption[] =>
      (items ?? []).map(item => ({ id: item.Id, label: item.ContractTypeName }));

    const toManagerOption = (items?: PotentialManagerResponseItem[]): ManagerLookupOption[] =>
      (items ?? []).map(item => ({
        id: item.Id,
        label: (item.FullName || `${item.FirstName ?? ''} ${item.LastName ?? ''}`).trim(),
        departmentName: item.DepartementName
      }));

    return {
      statuses: toLookupOption(response?.Statuses),
      genders: toLookupOption(response?.Genders),
      educationLevels: toLookupOption(response?.EducationLevels),
      maritalStatuses: toLookupOption(response?.MaritalStatuses),
      nationalities: toLookupOption(response?.Nationalities),
      countries: toCountryOption(response?.Countries),
      cities: toCityOption(response?.Cities),
      departements: toDepartementOption(response?.Departements),
      jobPositions: toJobPositionOption(response?.JobPositions),
      contractTypes: toContractTypeOption(response?.ContractTypes),
      potentialManagers: toManagerOption(response?.PotentialManagers)
    };
  }

  private mapDashboardEmployeesResponse(response: DashboardEmployeesResponse): EmployeesResponse {
    const employees = (response?.Employees ?? []).map(emp => this.mapDashboardEmployee(emp));
    const total = response?.TotalEmployees ?? employees.length;
    const active = response?.ActiveEmployees ?? employees.filter(emp => emp.status === 'active').length;
    const departments = Array.from(new Set(response?.Departments ?? employees
      .map(emp => emp.department)
      .filter(dep => !!dep))) as string[];
    const statuses = Array.from(new Set(response?.Statuses ?? employees
      .map(emp => emp.status)
      .filter(status => !!status))) as string[];

    return { employees, total, active, departments, statuses };
  }

  private mapDashboardEmployee(employee: DashboardEmployee): Employee {
    return {
      id: this.toStringValue(employee.Id),
      firstName: employee.FirstName ?? '',
      lastName: employee.LastName ?? '',
      position: employee.Position ?? 'Non assigné',
      department: employee.Department ?? '',
      status: this.mapEmployeeStatus(employee.Status),
      startDate: employee.StartDate ?? '',
      missingDocuments: this.toNumberValue(employee.MissingDocuments),
      contractType: this.mapContractType(employee.ContractType),
      manager: employee.Manager ?? undefined
    };
  }

  private mapEmployeeDetailsResponse(payload: EmployeeDetailsResponse): EmployeeProfileModel {
    const salaryComponents = payload.SalaryComponents ?? [];
    const transportAllowance = this.findSalaryComponentAmount(salaryComponents, ['transport']);
    const mealAllowance = this.findSalaryComponentAmount(salaryComponents, ['meal', 'restauration']);
    const seniorityBonus = this.findSalaryComponentAmount(salaryComponents, ['ancien', 'seniority']);
    const otherBenefits = this.collectOtherBenefits(salaryComponents, ['transport', 'meal', 'restauration', 'ancien', 'seniority']);

    const detail: EmployeeProfileModel = {
      id: this.toStringValue(payload.Id),
      firstName: payload.FirstName ?? '',
      lastName: payload.LastName ?? '',
      photo: undefined,
      cin: payload.CinNumber ?? '',
      maritalStatus: this.mapMaritalStatus(payload.MaritalStatusName),
      birthDate: payload.DateOfBirth ?? '',
      birthPlace: payload.Address?.CityName ?? '',
      professionalEmail: payload.Email ?? '',
      personalEmail: payload.Email ?? '',
      phone: this.composePhone(payload.CountryPhoneCode, payload.Phone),
      address: this.formatAddress(payload.Address),
      position: payload.JobPositionName ?? 'Non assigné',
      department: payload.Department ?? payload.DepartmentName ?? '',
      manager: payload.ManagerName ?? '',
      contractType: this.mapContractType(payload.ContractTypeName),
      startDate: payload.ContractStartDate ?? '',
      endDate: undefined,
      probationPeriod: payload.ProbationPeriod ?? '',
      exitReason: undefined,
      baseSalary: payload.BaseSalary ?? 0,
      transportAllowance,
      mealAllowance,
      seniorityBonus,
      benefitsInKind: otherBenefits,
      paymentMethod: this.mapPaymentMethod(payload.SalaryPaymentMethod),
      cnss: this.toStringValue(payload.CNSS),
      amo: this.toStringValue(payload.AMO),
      cimr: this.toStringValue(payload.CIMR) || undefined,
      annualLeave: payload.AnnualLeave ?? 0,
      status: this.mapEmployeeStatus(payload.StatusName),
      missingDocuments: payload.MissingDocuments ?? 0,
      companyId: this.toStringValue(payload.CompanyId) || undefined,
      userId: this.toStringValue(payload.UserId) || undefined,
      createdAt: payload.CreatedAt ? new Date(payload.CreatedAt) : undefined,
      updatedAt: payload.UpdatedAt ? new Date(payload.UpdatedAt) : undefined
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

  private composePhone(code?: string, phone?: string | number): string {
    const cleanCode = code ? String(code).trim() : '';
    const cleanPhone = phone ? String(phone).trim() : '';
    return `${cleanCode} ${cleanPhone}`.trim();
  }

  private formatAddress(address?: EmployeeAddressResponse): string {
    if (!address) {
      return '';
    }
    const parts = [address.AddressLine1, address.AddressLine2, address.CityName, address.ZipCode, address.CountryName]
      .filter(part => !!part)
      .map(part => part?.trim());
    return parts.join(', ');
  }

  private findSalaryComponentAmount(components: SalaryComponentResponse[], keywords: string[]): number {
    const match = components.find(component =>
      keywords.some(keyword => component.ComponentName?.toLowerCase().includes(keyword))
    );
    return match ? Number(match.Amount) || 0 : 0;
  }

  private collectOtherBenefits(
    components: SalaryComponentResponse[],
    excludedKeywords: string[]
  ): string | undefined {
    const others = components
      .filter(component =>
        !excludedKeywords.some(keyword => component.ComponentName?.toLowerCase().includes(keyword))
      )
      .map(component => `${component.ComponentName}: ${component.Amount} MAD`);
    return others.length ? others.join(' | ') : undefined;
  }

  private toStringValue(value: string | number | undefined | null): string {
    return value !== undefined && value !== null ? String(value) : '';
  }

  private toNumberValue(value: number | string | undefined | null): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
}
