// Employee model for PayZen SaaS

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  cin: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dateOfBirth: string;
  birthPlace: string;
  professionalEmail: string;
  personalEmail: string;
  phone: string;
  address: string;
  countryId?: number;
  countryName?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  zipCode?: string;
  position: string;
  department: string;
  manager?: string;
  contractType: 'CDI' | 'CDD' | 'Stage';
  startDate: string;
  endDate?: string;
  probationPeriod: string;
  exitReason?: string;
  baseSalary: number;
  transportAllowance: number;
  mealAllowance: number;
  seniorityBonus: number;
  benefitsInKind?: string;
  paymentMethod: 'bank_transfer' | 'check' | 'cash';
  cnss: string;
  amo: string;
  cimr?: string;
  annualLeave: number;
  status: 'active' | 'on_leave' | 'inactive';
  missingDocuments: number;
  companyId?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  events?: EmployeeEvent[];
}

export interface EmployeeEvent {
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

// Backend employee response format (PascalCase from C#)
export interface BackendEmployee {
  Id: string | number;
  FirstName: string;
  LastName: string;
  Photo?: string;
  Cin: string;
  MaritalStatus: string;
  DateOfBirth: string;
  BirthPlace: string;
  ProfessionalEmail: string;
  PersonalEmail: string;
  Phone: string;
  Address: string;
  Position: string;
  DepartmentName: string;
  Manager?: string;
  ContractType: string;
  StartDate: string;
  EndDate?: string;
  ProbationPeriod: string;
  ExitReason?: string;
  BaseSalary: number;
  TransportAllowance: number;
  MealAllowance: number;
  SeniorityBonus: number;
  BenefitsInKind?: string;
  PaymentMethod: string;
  Cnss: string;
  Amo: string;
  Cimr?: string;
  AnnualLeave: number;
  Status: string;
  MissingDocuments: number;
  CompanyId?: string | number;
  UserId?: string | number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

// Create employee request
export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  photo?: string;
  cin: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dateOfBirth: string;
  birthPlace: string;
  professionalEmail: string;
  personalEmail: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  manager?: string;
  contractType: 'CDI' | 'CDD' | 'Stage';
  startDate: string;
  endDate?: string;
  probationPeriod: string;
  baseSalary: number;
  transportAllowance?: number;
  mealAllowance?: number;
  seniorityBonus?: number;
  benefitsInKind?: string;
  paymentMethod: 'bank_transfer' | 'check' | 'cash';
  cnss: string;
  amo: string;
  cimr?: string;
  annualLeave?: number;
  status?: 'active' | 'on_leave' | 'inactive';
  companyId?: string;
  userId?: string;
}

// Update employee request
export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  photo?: string;
  cin?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  dateOfBirth?: string;
  birthPlace?: string;
  professionalEmail?: string;
  personalEmail?: string;
  phone?: string;
  address?: string;
  position?: string;
  department?: string;
  manager?: string;
  contractType?: 'CDI' | 'CDD' | 'Stage';
  startDate?: string;
  endDate?: string;
  probationPeriod?: string;
  exitReason?: string;
  baseSalary?: number;
  transportAllowance?: number;
  mealAllowance?: number;
  seniorityBonus?: number;
  benefitsInKind?: string;
  paymentMethod?: 'bank_transfer' | 'check' | 'cash';
  cnss?: string;
  amo?: string;
  cimr?: string;
  annualLeave?: number;
  status?: 'active' | 'on_leave' | 'inactive';
}

// Employee filters
export interface EmployeeFilters {
  searchQuery?: string;
  department?: string;
  status?: string;
  contractType?: string;
  companyId?: string;
}

// Employee list response
export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page?: number;
  pageSize?: number;
}

// Employee document
export interface EmployeeDocument {
  id: string;
  employeeId: string;
  type: 'cin' | 'contract' | 'rib' | 'job_description' | 'diploma' | 'other';
  name: string;
  url: string;
  uploadDate: string;
  status: 'uploaded' | 'missing' | 'pending';
}

// Employee history event
export interface EmployeeHistoryEvent {
  id: string;
  employeeId: string;
  date: string;
  type: 'salary_change' | 'position_change' | 'contract_change' | 'note';
  title: string;
  description: string;
  author: string;
  createdAt: string;
}

