import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CompanyAuditLog,
  EmployeeAuditLog,
  CompanyAuditLogDto,
  EmployeeAuditLogDto,
  AuditLogFilter,
  AuditEventType,
  AuditLogDisplayItem
} from '@app/core/models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  /**
   * Fetch company audit logs
   * Backend endpoint: GET /api/companies/{companyId}/audit-logs
   * Note: Check backend for actual endpoint structure
   */
  getCompanyAuditLogs(
    companyId: number,
    filter?: AuditLogFilter
  ): Observable<CompanyAuditLog[]> {
    let params = new HttpParams();
    
    if (filter?.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter?.eventTypes?.length) {
      params = params.set('eventTypes', filter.eventTypes.join(','));
    }
    if (filter?.createdBy) {
      params = params.set('createdBy', filter.createdBy.toString());
    }

    return this.http
      .get<CompanyAuditLogDto[]>(`${this.apiUrl}/companies/${companyId}/audit-logs`, { params })
      .pipe(map(dtos => dtos.map(dto => this.mapCompanyAuditLogDtoToModel(dto))));
  }

  /**
   * Fetch employee audit logs
   * Backend endpoint: GET /api/employees/{employeeId}/audit-logs
   * Note: Check backend for actual endpoint structure
   */
  getEmployeeAuditLogs(
    employeeId: number,
    filter?: AuditLogFilter
  ): Observable<EmployeeAuditLog[]> {
    let params = new HttpParams();
    
    if (filter?.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter?.eventTypes?.length) {
      params = params.set('eventTypes', filter.eventTypes.join(','));
    }
    if (filter?.createdBy) {
      params = params.set('createdBy', filter.createdBy.toString());
    }

    return this.http
      .get<EmployeeAuditLogDto[]>(`${this.apiUrl}/employees/${employeeId}/audit-logs`, { params })
      .pipe(map(dtos => dtos.map(dto => this.mapEmployeeAuditLogDtoToModel(dto))));
  }

  /**
   * Get all audit logs for all companies managed by cabinet (expert view)
   * Backend endpoint: GET /api/audit-logs/cabinet
   * Note: This endpoint may need to be created on backend
   */
  getCabinetAuditLogs(filter?: AuditLogFilter): Observable<AuditLogDisplayItem[]> {
    let params = new HttpParams();
    
    if (filter?.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter?.eventTypes?.length) {
      params = params.set('eventTypes', filter.eventTypes.join(','));
    }
    if (filter?.companyId) {
      params = params.set('companyId', filter.companyId.toString());
    }

    // For now, return empty array - backend endpoint needs to be implemented
    // return this.http.get<any[]>(`${this.apiUrl}/audit-logs/cabinet`, { params })
    //   .pipe(map(items => items.map(item => this.mapToDisplayItem(item))));
    
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  /**
   * Map company audit log DTO to model
   * Enrichment with user details can be done here or on backend
   */
  private mapCompanyAuditLogDtoToModel(dto: CompanyAuditLogDto): CompanyAuditLog {
    return {
      id: dto.id,
      companyId: dto.companyId,
      eventType: this.parseEventType(dto.eventType),
      eventDescription: dto.eventDescription,
      tableName: dto.tableName,
      recordId: dto.recordId,
      fieldName: dto.fieldName,
      oldValue: dto.oldValue,
      newValue: dto.newValue,
      oldValueId: dto.oldValueId,
      newValueId: dto.newValueId,
      createdAt: new Date(dto.createdAt),
      createdBy: dto.createdBy
      // createdByName and createdByRole should ideally come from backend
      // or be enriched via a separate user lookup call
    };
  }

  /**
   * Map employee audit log DTO to model
   */
  private mapEmployeeAuditLogDtoToModel(dto: EmployeeAuditLogDto): EmployeeAuditLog {
    return {
      id: dto.id,
      employeeId: dto.employeeId,
      eventType: this.parseEventType(dto.eventType),
      eventDescription: dto.eventDescription,
      tableName: dto.tableName,
      recordId: dto.recordId,
      fieldName: dto.fieldName,
      oldValue: dto.oldValue,
      newValue: dto.newValue,
      oldValueId: dto.oldValueId,
      newValueId: dto.newValueId,
      createdAt: new Date(dto.createdAt),
      createdBy: dto.createdBy
    };
  }

  /**
   * Parse event type string to enum
   * Falls back to OTHER if unknown
   */
  private parseEventType(eventType: string): AuditEventType {
    const normalizedType = eventType.toUpperCase().replace(/\s+/g, '_');
    return (AuditEventType as any)[normalizedType] || AuditEventType.OTHER;
  }

  /**
   * Convert audit log to display item with icon and severity
   * Used for timeline/feed views
   */
  convertToDisplayItem(
    log: CompanyAuditLog | EmployeeAuditLog,
    type: 'company' | 'employee',
    entityName: string
  ): AuditLogDisplayItem {
    const { icon, severity } = this.getEventMetadata(log.eventType);

    return {
      id: log.id,
      type,
      entityId: type === 'company' ? (log as CompanyAuditLog).companyId : (log as EmployeeAuditLog).employeeId,
      entityName,
      eventType: log.eventType,
      description: log.eventDescription,
      details: {
        fieldName: log.fieldName,
        oldValue: log.oldValue,
        newValue: log.newValue
      },
      timestamp: log.createdAt,
      actor: {
        id: log.createdBy,
        name: log.createdByName || `User #${log.createdBy}`,
        role: log.createdByRole
      },
      icon,
      severity
    };
  }

  /**
   * Get icon and severity based on event type
   * Used for visual representation in UI
   */
  private getEventMetadata(eventType: AuditEventType): { icon: string; severity: 'info' | 'success' | 'warn' | 'danger' } {
    switch (eventType) {
      case AuditEventType.COMPANY_CREATED:
      case AuditEventType.EMPLOYEE_CREATED:
      case AuditEventType.USER_CREATED:
      case AuditEventType.ROLE_CREATED:
      case AuditEventType.PERMISSION_CREATED:
        return { icon: 'pi-plus-circle', severity: 'success' };
      
      case AuditEventType.COMPANY_UPDATED:
      case AuditEventType.EMPLOYEE_UPDATED:
      case AuditEventType.USER_UPDATED:
      case AuditEventType.ROLE_UPDATED:
      case AuditEventType.PERMISSION_UPDATED:
        return { icon: 'pi-pencil', severity: 'info' };
      
      case AuditEventType.COMPANY_DELETED:
      case AuditEventType.EMPLOYEE_DELETED:
        return { icon: 'pi-trash', severity: 'danger' };
      
      case AuditEventType.USER_ROLE_ASSIGNED:
      case AuditEventType.COMPANY_DELEGATION_ADDED:
        return { icon: 'pi-check-circle', severity: 'success' };
      
      case AuditEventType.USER_ROLE_REVOKED:
      case AuditEventType.COMPANY_DELEGATION_REMOVED:
        return { icon: 'pi-ban', severity: 'warn' };
      
      case AuditEventType.PAYROLL_GENERATED:
        return { icon: 'pi-calculator', severity: 'info' };
      
      case AuditEventType.PAYROLL_VALIDATED:
        return { icon: 'pi-check-square', severity: 'success' };
      
      default:
        return { icon: 'pi-info-circle', severity: 'info' };
    }
  }

  /**
   * Format audit log for human-readable display
   */
  formatAuditDescription(log: CompanyAuditLog | EmployeeAuditLog): string {
    if (!log.fieldName || (!log.oldValue && !log.newValue)) {
      return log.eventDescription;
    }

    const field = this.formatFieldName(log.fieldName);
    const oldVal = log.oldValue || 'vide';
    const newVal = log.newValue || 'vide';
    
    return `${log.eventDescription}: ${field} modifié de "${oldVal}" à "${newVal}"`;
  }

  /**
   * Format field names to be more human-readable
   */
  private formatFieldName(fieldName: string): string {
    // Convert snake_case or camelCase to Title Case
    return fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }
}
