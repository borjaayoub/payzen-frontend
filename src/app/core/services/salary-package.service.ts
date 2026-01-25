import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, Subject } from 'rxjs';
import { environment } from '@environments/environment';
import {
  SalaryPackageTemplate,
  SalaryPackageTemplateCreateDto,
  SalaryPackageTemplateUpdateDto,
  CloneTemplateDto,
  TemplateItem,
  TemplateItemWriteDto,
  TemplateOrigin,
  AutoRules,
  TemplateType,
  TemplateStatus,
  OriginType,
  ValueType,
  ItemNature,
  TemplateListFilter
} from '@app/core/models/salary-package.model';

@Injectable({ providedIn: 'root' })
export class SalaryPackageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/salary-package-templates`;
  
  // Event emitter for template changes
  private readonly _templateChanged = new Subject<void>();
  readonly templateChanged$ = this._templateChanged.asObservable();

  // ============================================
  // READ OPERATIONS
  // ============================================

  /**
   * Get all templates with optional filters
   */
  getAll(filter?: TemplateListFilter): Observable<SalaryPackageTemplate[]> {
    let params = new HttpParams();
    
    if (filter?.search) {
      params = params.set('search', filter.search);
    }
    if (filter?.category) {
      params = params.set('category', filter.category);
    }
    if (filter?.status) {
      params = params.set('status', filter.status);
    }
    if (filter?.templateType) {
      params = params.set('templateType', filter.templateType);
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(dtos => dtos.map(dto => this.mapDtoToTemplate(dto)))
    );
  }

  /**
   * Get published official templates (for clients to view/copy)
   */
  getOfficialTemplates(filter?: { search?: string; category?: string }): Observable<SalaryPackageTemplate[]> {
    let params = new HttpParams()
      .set('templateType', TemplateType.OFFICIAL)
      .set('status', TemplateStatus.PUBLISHED);
    
    if (filter?.search) {
      params = params.set('search', filter.search);
    }
    if (filter?.category) {
      params = params.set('category', filter.category);
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(dtos => dtos.map(dto => this.mapDtoToTemplate(dto)))
    );
  }

  /**
   * Get company-specific templates
   */
  getCompanyTemplates(companyId: number, filter?: { search?: string; status?: TemplateStatus }): Observable<SalaryPackageTemplate[]> {
    let params = new HttpParams()
      .set('companyId', companyId.toString())
      .set('templateType', TemplateType.COMPANY);
    
    if (filter?.search) {
      params = params.set('search', filter.search);
    }
    if (filter?.status) {
      params = params.set('status', filter.status);
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(dtos => dtos.map(dto => this.mapDtoToTemplate(dto)))
    );
  }

  /**
   * Get single template by ID
   */
  getById(id: number): Observable<SalaryPackageTemplate> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.mapDtoToTemplate(dto))
    );
  }

  // ============================================
  // WRITE OPERATIONS
  // ============================================

  /**
   * Create a new company template
   */
  create(template: Partial<SalaryPackageTemplate>, companyId: number): Observable<SalaryPackageTemplate> {
    const dto = this.mapTemplateToCreateDto(template, companyId);
    
    return this.http.post<any>(this.apiUrl, dto).pipe(
      map(response => this.mapDtoToTemplate(response)),
      map(result => {
        this._templateChanged.next();
        return result;
      })
    );
  }

  /**
   * Update an existing template (draft only)
   */
  update(id: number, template: Partial<SalaryPackageTemplate>): Observable<SalaryPackageTemplate> {
    const dto = this.mapTemplateToUpdateDto(template);
    
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      map(response => this.mapDtoToTemplate(response)),
      map(result => {
        this._templateChanged.next();
        return result;
      })
    );
  }

  /**
   * Delete a template (draft only)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        this._templateChanged.next();
      })
    );
  }

  // ============================================
  // LIFECYCLE OPERATIONS
  // ============================================

  /**
   * Clone an official template to create a company template
   */
  clone(sourceTemplateId: number, newName: string, companyId: number, category?: string): Observable<SalaryPackageTemplate> {
    const dto: CloneTemplateDto = {
      SourceTemplateId: sourceTemplateId,
      NewName: newName,
      CompanyId: companyId,
      Category: category
    };
    
    return this.http.post<any>(`${this.apiUrl}/clone`, dto).pipe(
      map(response => this.mapDtoToTemplate(response)),
      map(result => {
        this._templateChanged.next();
        return result;
      })
    );
  }

  /**
   * Publish a draft template (makes it usable, locks editing)
   */
  publish(id: number): Observable<SalaryPackageTemplate> {
    return this.http.post<any>(`${this.apiUrl}/${id}/publish`, {}).pipe(
      map(response => this.mapDtoToTemplate(response)),
      map(result => {
        this._templateChanged.next();
        return result;
      })
    );
  }

  /**
   * Archive a company template (hides from active use)
   */
  archive(id: number): Observable<SalaryPackageTemplate> {
    return this.http.post<any>(`${this.apiUrl}/${id}/archive`, {}).pipe(
      map(response => this.mapDtoToTemplate(response)),
      map(result => {
        this._templateChanged.next();
        return result;
      })
    );
  }

  /**
   * Duplicate a template (creates a new draft copy)
   */
  duplicate(id: number, companyId: number): Observable<SalaryPackageTemplate> {
    return this.http.post<any>(`${this.apiUrl}/${id}/duplicate`, { CompanyId: companyId }).pipe(
      map(response => this.mapDtoToTemplate(response)),
      map(result => {
        this._templateChanged.next();
        return result;
      })
    );
  }

  // ============================================
  // DTO MAPPING - Backend to Frontend
  // ============================================

  private mapDtoToTemplate(dto: any): SalaryPackageTemplate {
    return {
      id: dto.id,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      category: dto.category,
      templateType: this.parseEnum(dto.templateType, TemplateType, TemplateType.COMPANY),
      companyId: dto.companyId,
      status: this.parseEnum(dto.status, TemplateStatus, TemplateStatus.DRAFT),
      baseSalary: dto.baseSalary || 0,
      payrollFrequency: dto.payrollFrequency,
      workingHoursPerWeek: dto.workingHoursPerWeek,
      items: this.mapDtoToItems(dto.items || []),
      autoRules: dto.autoRules ? this.mapDtoToAutoRules(dto.autoRules) : undefined,
      origin: dto.origin ? this.mapDtoToOrigin(dto.origin) : undefined,
      regulationCode: dto.regulationCode,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy
    };
  }

  private mapDtoToItems(items: any[]): TemplateItem[] {
    return items.map((item, index) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      nature: this.parseEnum(item.nature, ItemNature, ItemNature.FIXED),
      valueType: this.parseEnum(item.valueType, ValueType, ValueType.FIXED_AMOUNT),
      value: item.value || 0,
      sortOrder: item.sortOrder ?? index,
      isTaxable: item.isTaxable ?? false,
      isCnssBase: item.isCnssBase ?? false,
      isCimrBase: item.isCimrBase ?? false,
      exemptionLimit: item.exemptionLimit
    }));
  }

  private mapDtoToAutoRules(dto: any): AutoRules {
    return {
      seniorityBonusEnabled: dto.seniorityBonusEnabled ?? false,
      ruleVersion: dto.ruleVersion || 'MA_2025'
    };
  }

  private mapDtoToOrigin(dto: any): TemplateOrigin {
    return {
      originType: this.parseEnum(dto.originType, OriginType, OriginType.CUSTOM),
      sourceTemplateId: dto.sourceTemplateId,
      sourceTemplateName: dto.sourceTemplateName,
      copiedAt: dto.copiedAt
    };
  }

  // ============================================
  // DTO MAPPING - Frontend to Backend
  // ============================================

  private mapTemplateToCreateDto(template: Partial<SalaryPackageTemplate>, companyId: number): SalaryPackageTemplateCreateDto {
    return {
      Name: template.name || '',
      Code: template.code,
      Description: template.description,
      Category: template.category,
      BaseSalary: template.baseSalary || 0,
      PayrollFrequency: template.payrollFrequency,
      WorkingHoursPerWeek: template.workingHoursPerWeek,
      Items: template.items?.map(item => this.mapItemToWriteDto(item)),
      AutoRules: template.autoRules ? {
        SeniorityBonusEnabled: template.autoRules.seniorityBonusEnabled,
        RuleVersion: template.autoRules.ruleVersion
      } : undefined,
      Origin: template.origin ? {
        OriginType: template.origin.originType,
        SourceTemplateId: template.origin.sourceTemplateId
      } : undefined
    };
  }

  private mapTemplateToUpdateDto(template: Partial<SalaryPackageTemplate>): SalaryPackageTemplateUpdateDto {
    return {
      Name: template.name,
      Code: template.code,
      Description: template.description,
      Category: template.category,
      BaseSalary: template.baseSalary,
      PayrollFrequency: template.payrollFrequency,
      WorkingHoursPerWeek: template.workingHoursPerWeek,
      Items: template.items?.map(item => this.mapItemToWriteDto(item)),
      AutoRules: template.autoRules ? {
        SeniorityBonusEnabled: template.autoRules.seniorityBonusEnabled,
        RuleVersion: template.autoRules.ruleVersion
      } : undefined,
      Status: template.status
    };
  }

  private mapItemToWriteDto(item: TemplateItem): TemplateItemWriteDto {
    return {
      Id: item.id,
      Name: item.name,
      Code: item.code,
      Nature: item.nature,
      ValueType: item.valueType,
      Value: item.value,
      SortOrder: item.sortOrder,
      IsTaxable: item.isTaxable,
      IsCnssBase: item.isCnssBase,
      IsCimrBase: item.isCimrBase,
      ExemptionLimit: item.exemptionLimit
    };
  }

  // ============================================
  // UTILITIES
  // ============================================

  private parseEnum<T extends Record<string, string>>(value: string | undefined, enumType: T, defaultValue: T[keyof T]): T[keyof T] {
    if (!value) return defaultValue;
    const upperValue = value.toUpperCase();
    return Object.values(enumType).includes(upperValue as T[keyof T]) 
      ? upperValue as T[keyof T] 
      : defaultValue;
  }
}
