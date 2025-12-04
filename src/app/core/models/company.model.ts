// Company information model
export interface Company {
  id: string;
  legalName: string;              // Raison sociale
  ice: string;                     // ICE number
  cnss: string;                    // CNSS number
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  website?: string;
  taxRegime: TaxRegime;
  fiscalYear: number;
  employeeCount: number;
  hrParameters: HRParameters;
  documents: CompanyDocuments;
  isActive: boolean;
  logoUrl?: string;
  rib?: string;                    // Bank account number
  createdAt: Date;
  updatedAt: Date;
}

// Tax regime enum
export enum TaxRegime {
  IS = 'IS',
  IR = 'IR',
  AUTO_ENTREPRENEUR = 'Auto-entrepreneur'
}

// HR parameters model
export interface HRParameters {
  workingDays: string[];
  workingHoursPerDay: number;
  workingHoursPerWeek: number;
  leaveCalculationMode: string;
  absenceCalculationMode: string;
  annualLeaveDays: number;
  publicHolidays: string[];
  probationPeriodDays: number;
  noticePeriodDays: number;
}

// Working day type
export type WorkingDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Leave calculation modes
export type LeaveCalculationMode = 'calendar_days' | 'working_days';

// Absence calculation modes
export type AbsenceCalculationMode = 'full_day' | 'half_day' | 'hourly';

// Company documents structure
export interface CompanyDocuments {
  cnss_attestation: string | null;
  amo: string | null;
  logo: string | null;
  rib: string | null;
  other: string[];
}

// Company document types (for individual documents)
export interface CompanyDocument {
  id: string;
  companyId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export type DocumentType = 'cnss_attestation' | 'amo' | 'logo' | 'rib' | 'other';
