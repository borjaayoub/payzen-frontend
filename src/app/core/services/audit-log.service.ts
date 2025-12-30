import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CompanyAuditLog,
  EmployeeAuditLog,
  CompanyAuditLogDto,
  EmployeeAuditLogDto,
  CompanyHistoryDto,
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
   * Fetch company history/audit logs
   * Backend endpoint: GET /api/companies/{companyId}/history
   */
  getCompanyAuditLogs(
    companyId: number,
    filter?: AuditLogFilter
  ): Observable<AuditLogDisplayItem[]> {
    return this.http
      .get<CompanyHistoryDto[]>(`${this.apiUrl}/companies/${companyId}/history`)
      .pipe(map(dtos => dtos.map((dto, index) => this.mapHistoryDtoToDisplayItem(dto, companyId, index))));
  }

  /**
   * Map backend history DTO to display item
   * Note: Properties are camelCase due to camelCaseInterceptor
   */
  private mapHistoryDtoToDisplayItem(dto: CompanyHistoryDto, companyId: number, index: number): AuditLogDisplayItem {
    const eventType = this.parseEventTypeFromTitle(dto.title);
    const { icon, severity } = this.getEventMetadata(eventType);

    // Format the field name for display (e.g., "Email_Changed" -> "Email")
    const fieldName = dto.title?.replace('_Changed', '').replace('Changed', '').replace(/_/g, ' ') || '';

    return {
      id: index, // Use index as ID since backend doesn't provide one
      type: dto.type === 'employee' ? 'employee' : 'company',
      entityId: companyId,
      entityName: fieldName, // The field that was changed
      eventType,
      description: dto.description || dto.title || 'Unknown event',
      details: {
        fieldName,
        oldValue: dto.details?.oldValue ?? undefined,
        newValue: dto.details?.newValue ?? undefined
      },
      timestamp: new Date(dto.timestamp),
      actor: {
        id: 0, // Backend doesn't provide user ID
        name: dto.modifiedBy?.name || 'Unknown',
        role: dto.modifiedBy?.role
      },
      icon: 'pi ' + icon, // Add 'pi ' prefix for PrimeNG icons
      severity
    };
  }

  /**
   * Parse event type from backend title (e.g., "Email_Changed" -> COMPANY_UPDATED)
   */
  private parseEventTypeFromTitle(title: string): AuditEventType {
    if (!title) return AuditEventType.OTHER;
    
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('created')) {
      return AuditEventType.COMPANY_CREATED;
    }
    if (lowerTitle.includes('deleted')) {
      return AuditEventType.COMPANY_DELETED;
    }
    if (lowerTitle.includes('changed') || lowerTitle.includes('updated')) {
      return AuditEventType.COMPANY_UPDATED;
    }
    
    return AuditEventType.OTHER;
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
    // Mock data for demonstration
    const mockLogs: AuditLogDisplayItem[] = [
      {
        id: 1,
        type: 'company',
        entityId: 101,
        entityName: 'TechCorp',
        eventType: AuditEventType.COMPANY_UPDATED,
        description: 'Company settings updated',
        details: { fieldName: 'Tax ID', oldValue: 'OLD-123', newValue: 'NEW-456' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        actor: { id: 1, name: 'John Doe', role: 'Admin' },
        icon: 'pi pi-pencil',
        severity: 'info'
      },
      {
        id: 2,
        type: 'employee',
        entityId: 205,
        entityName: 'Alice Smith',
        eventType: AuditEventType.EMPLOYEE_CREATED,
        description: 'New employee onboarded',
        details: { fieldName: 'Status', newValue: 'Active' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        actor: { id: 2, name: 'Jane Manager', role: 'HR' },
        icon: 'pi pi-plus-circle',
        severity: 'success'
      },
      {
        id: 3,
        type: 'company',
        entityId: 102,
        entityName: 'BizSolutions',
        eventType: AuditEventType.COMPANY_DELEGATION_ADDED,
        description: 'Access delegated to external accountant',
        details: { fieldName: 'Delegation', newValue: 'Accountant Access' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        actor: { id: 1, name: 'John Doe', role: 'Admin' },
        icon: 'pi pi-check-circle',
        severity: 'success'
      },
      {
        id: 4,
        type: 'employee',
        entityId: 206,
        entityName: 'Bob Jones',
        eventType: AuditEventType.PAYROLL_GENERATED,
        description: 'Payroll generated for March 2024',
        details: { fieldName: 'Period', newValue: '2024-03' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        actor: { id: 3, name: 'System', role: 'System' },
        icon: 'pi pi-calculator',
        severity: 'info'
      },
      {
        id: 5,
        type: 'company',
        entityId: 101,
        entityName: 'TechCorp',
        eventType: AuditEventType.COMPANY_DELETED,
        description: 'Old branch removed',
        details: { fieldName: 'Branch', oldValue: 'North Branch' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        actor: { id: 1, name: 'John Doe', role: 'Admin' },
        icon: 'pi pi-trash',
        severity: 'danger'
      }
    ];

    return new Observable(observer => {
      // Simulate network delay
      setTimeout(() => {
        let filtered = mockLogs;
        
        if (filter?.companyId) {
          filtered = filtered.filter(l => l.entityId === filter.companyId && l.type === 'company');
        }
        
        if (filter?.eventTypes?.length) {
          filtered = filtered.filter(l => filter.eventTypes!.includes(l.eventType));
        }

        if (filter?.startDate) {
          filtered = filtered.filter(l => l.timestamp >= filter.startDate!);
        }

        if (filter?.endDate) {
          filtered = filtered.filter(l => l.timestamp <= filter.endDate!);
        }

        observer.next(filtered);
        observer.complete();
      }, 800);
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
