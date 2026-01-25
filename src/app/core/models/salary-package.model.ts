/**
 * Salary Package Template Models
 * 
 * 2-Level Template System:
 * - Official Templates: Created by PayZen, read-only for clients
 * - Company Templates: Owned by companies, fully editable
 */

// ============================================
// ENUMS
// ============================================

/**
 * Distinguishes between official (PayZen) and company-owned templates
 */
export enum TemplateType {
  OFFICIAL = 'OFFICIAL',
  COMPANY = 'COMPANY'
}

/**
 * Template lifecycle status
 * - DRAFT: Being edited, not usable for employees
 * - PUBLISHED: Locked, can be assigned to employees
 * - DEPRECATED: Official templates marked as outdated (still readable)
 * - ARCHIVED: Company templates hidden from active use
 */
export enum TemplateStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Tracks how a company template was created
 */
export enum OriginType {
  CUSTOM = 'CUSTOM',
  COPIED_FROM_OFFICIAL = 'COPIED_FROM_OFFICIAL'
}

/**
 * How the item value is calculated
 */
export enum ValueType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENT_OF_BASE = 'PERCENT_OF_BASE'
}

/**
 * Nature of the salary item
 * - FIXED: Static value set in template
 * - AUTO: Calculated by system rules (e.g., seniority bonus)
 * - VARIABLE_PLACEHOLDER: Placeholder for variable amounts (e.g., overtime)
 */
export enum ItemNature {
  FIXED = 'FIXED',
  AUTO = 'AUTO',
  VARIABLE_PLACEHOLDER = 'VARIABLE_PLACEHOLDER'
}

// ============================================
// INTERFACES - Core Entities
// ============================================

/**
 * Individual salary component within a template
 */
export interface TemplateItem {
  id?: number;
  name: string;
  code?: string;
  nature: ItemNature;
  valueType: ValueType;
  value: number;
  sortOrder: number;
  
  // Compliance flags (Morocco 2025)
  isTaxable: boolean;
  isCnssBase: boolean;
  isCimrBase: boolean;
  
  // Optional exemption limit for partial taxation
  exemptionLimit?: number | null;
}

/**
 * Auto-calculation rules configuration
 */
export interface AutoRules {
  seniorityBonusEnabled: boolean;
  ruleVersion: string; // e.g., "MA_2025"
}

/**
 * Tracks origin for copied templates
 */
export interface TemplateOrigin {
  originType: OriginType;
  sourceTemplateId?: number | null;
  sourceTemplateName?: string | null;
  copiedAt?: string | null;
}

/**
 * Main Salary Package Template entity
 */
export interface SalaryPackageTemplate {
  id: number;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  
  // Type and ownership
  templateType: TemplateType;
  companyId?: number | null; // null for official templates
  
  // Status lifecycle
  status: TemplateStatus;
  
  // Salary configuration
  baseSalary: number;
  payrollFrequency?: string; // 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'
  workingHoursPerWeek?: number;
  
  // Template items (fixed elements)
  items: TemplateItem[];
  
  // Auto rules
  autoRules?: AutoRules;
  
  // Origin tracking (for company templates)
  origin?: TemplateOrigin;
  
  // Regulation info
  regulationCode?: string; // e.g., "MA_2025"
  
  // Audit fields
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================
// DTOs - API Communication
// ============================================

/**
 * DTO for creating a new template
 */
export interface SalaryPackageTemplateCreateDto {
  Name: string;
  Code?: string;
  Description?: string;
  Category?: string;
  BaseSalary: number;
  PayrollFrequency?: string;
  WorkingHoursPerWeek?: number;
  Items?: TemplateItemWriteDto[];
  AutoRules?: AutoRulesWriteDto;
  Origin?: TemplateOriginWriteDto;
}

/**
 * DTO for updating an existing template
 */
export interface SalaryPackageTemplateUpdateDto {
  Name?: string;
  Code?: string;
  Description?: string;
  Category?: string;
  BaseSalary?: number;
  PayrollFrequency?: string;
  WorkingHoursPerWeek?: number;
  Items?: TemplateItemWriteDto[];
  AutoRules?: AutoRulesWriteDto;
  Status?: string;
}

/**
 * DTO for cloning official template to company
 */
export interface CloneTemplateDto {
  SourceTemplateId: number;
  NewName: string;
  Category?: string;
  CompanyId: number;
}

/**
 * Write DTO for template items
 */
export interface TemplateItemWriteDto {
  Id?: number | null;
  Name: string;
  Code?: string;
  Nature: string;
  ValueType: string;
  Value: number;
  SortOrder?: number;
  IsTaxable: boolean;
  IsCnssBase: boolean;
  IsCimrBase: boolean;
  ExemptionLimit?: number | null;
}

/**
 * Write DTO for auto rules
 */
export interface AutoRulesWriteDto {
  SeniorityBonusEnabled: boolean;
  RuleVersion?: string;
}

/**
 * Write DTO for origin tracking
 */
export interface TemplateOriginWriteDto {
  OriginType: string;
  SourceTemplateId?: number | null;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Filter options for template list queries
 */
export interface TemplateListFilter {
  search?: string;
  category?: string;
  status?: TemplateStatus;
  templateType?: TemplateType;
}

/**
 * Summary statistics for salary preview
 */
export interface SalarySummary {
  baseSalary: number;
  totalAllowances: number;
  grossTotal: number;
  taxableAmount: number;
  cnssBase: number;
  cimrBase: number;
}

/**
 * Validation result for template
 */
export interface TemplateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
