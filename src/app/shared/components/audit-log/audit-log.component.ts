import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { AuditLogService } from '@app/core/services/audit-log.service';
import { CompanyService } from '@app/core/services/company.service';
import { 
  AuditLogDisplayItem, 
  AuditLogFilter, 
  AuditEventType
} from '@app/core/models/audit-log.model';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TimelineModule,
    CardModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    SkeletonModule,
    TooltipModule,
    ChipModule
  ],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.css'
})
export class AuditLogComponent implements OnInit, OnChanges {
  private auditLogService = inject(AuditLogService);
  private companyService = inject(CompanyService);

  // Inputs
  @Input() companyId?: number;
  @Input() employeeId?: number;
  @Input() maxItems?: number;

  // Signals
  readonly auditLogs = signal<AuditLogDisplayItem[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly selectedEventTypes = signal<AuditEventType[]>([]);
  readonly startDate = signal<string | null>(null);
  readonly endDate = signal<string | null>(null);
  readonly filtersExpanded = signal(false);

  // Computed
  readonly filteredLogs = computed(() => {
    let logs = this.auditLogs();
    const query = this.searchQuery().toLowerCase();
    const eventTypes = this.selectedEventTypes();
    const startDateStr = this.startDate();
    const endDateStr = this.endDate();

    // Text search
    if (query) {
      logs = logs.filter(log =>
        log.description.toLowerCase().includes(query) ||
        log.entityName.toLowerCase().includes(query) ||
        log.actor.name.toLowerCase().includes(query)
      );
    }

    // Event type filter
    if (eventTypes.length > 0) {
      logs = logs.filter(log => eventTypes.includes(log.eventType));
    }

    // Date range filter
    if (startDateStr || endDateStr) {
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const start = startDateStr ? new Date(startDateStr) : null;
        const end = endDateStr ? new Date(endDateStr) : null;
        
        if (start && end) {
          return logDate >= start && logDate <= end;
        } else if (start) {
          return logDate >= start;
        } else if (end) {
          return logDate <= end;
        }
        return true;
      });
    }

    // Limit items if maxItems is set
    if (this.maxItems) {
      logs = logs.slice(0, this.maxItems);
    }

    return logs;
  });

  readonly hasActiveFilters = computed(() => {
    return this.searchQuery().length > 0 || 
           this.selectedEventTypes().length > 0 || 
           this.startDate() !== null || 
           this.endDate() !== null;
  });

  readonly resultCount = computed(() => this.filteredLogs().length);
  readonly totalCount = computed(() => this.auditLogs().length);

  // Event type options for filter dropdown
  readonly eventTypeOptions = [
    { label: 'Created', value: AuditEventType.COMPANY_CREATED },
    { label: 'Updated', value: AuditEventType.COMPANY_UPDATED },
    { label: 'Deleted', value: AuditEventType.COMPANY_DELETED },
    { label: 'Employee Created', value: AuditEventType.EMPLOYEE_CREATED },
    { label: 'Employee Updated', value: AuditEventType.EMPLOYEE_UPDATED },
    { label: 'User Role Assigned', value: AuditEventType.USER_ROLE_ASSIGNED },
    { label: 'User Role Revoked', value: AuditEventType.USER_ROLE_REVOKED }
  ];

  getEventTypeLabel(type: AuditEventType): string {
    return this.eventTypeOptions.find(opt => opt.value === type)?.label || type;
  }

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['companyId'] && !changes['companyId'].isFirstChange()) || 
        (changes['employeeId'] && !changes['employeeId'].isFirstChange())) {
      this.loadAuditLogs();
    }
  }

  loadAuditLogs(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set(null);

    const filter: AuditLogFilter = {
      searchQuery: this.searchQuery() || undefined,
      eventTypes: this.selectedEventTypes().length > 0 ? this.selectedEventTypes() : undefined
    };

    if (this.companyId) {
      // Load company history/audit logs and attach company name for clarity
      const companyIdNum = Number(this.companyId);
      this.companyService.getManagedCompanies().subscribe({
        next: (companies) => {
          const company = companies.find(c => Number(c.id) === companyIdNum);
          const companyName = company?.legalName || String(companyIdNum);

          this.auditLogService.getCompanyAuditLogs(companyIdNum, filter).subscribe({
            next: (logs: AuditLogDisplayItem[]) => {
              const withNames = logs.map(l => ({ ...l, entityName: companyName }));
              this.auditLogs.set(withNames);
              this.isLoading.set(false);
              this.hasError.set(false);
            },
            error: (err) => {
              console.error('Failed to load company audit logs', err);
              this.auditLogs.set([]);
              this.isLoading.set(false);
              this.hasError.set(true);
              this.errorMessage.set(err.message || 'Failed to load audit logs');
            }
          });
        },
        error: (err) => {
          // Fallback: still load logs without company name
          this.auditLogService.getCompanyAuditLogs(companyIdNum, filter).subscribe({
            next: (logs: AuditLogDisplayItem[]) => {
              this.auditLogs.set(logs);
              this.isLoading.set(false);
              this.hasError.set(false);
            },
            error: (err2) => {
              console.error('Failed to load company audit logs', err2);
              this.auditLogs.set([]);
              this.isLoading.set(false);
              this.hasError.set(true);
              this.errorMessage.set(err2.message || 'Failed to load audit logs');
            }
          });
        }
      });
    } else if (this.employeeId) {
      // Load employee audit logs
      this.auditLogService.getEmployeeAuditLogs(this.employeeId, filter).subscribe({
        next: (logs) => {
          const displayItems = logs.map((log, index) => 
            this.auditLogService.convertToDisplayItem(log, 'employee', log.employeeName || 'Unknown')
          );
          this.auditLogs.set(displayItems);
          this.isLoading.set(false);
          this.hasError.set(false);
        },
        error: (err) => {
          console.error('Failed to load employee audit logs', err);
          this.auditLogs.set([]);
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(err.message || 'Failed to load audit logs');
        }
      });
    } else {
      // Load cabinet-wide audit logs if no specific ID
      this.auditLogService.getCabinetAuditLogs(filter).subscribe({
        next: (logs) => {
          this.auditLogs.set(logs);
          this.isLoading.set(false);
          this.hasError.set(false);
        },
        error: (err) => {
          console.error('Failed to load cabinet audit logs', err);
          this.auditLogs.set([]);
          this.isLoading.set(false);
          this.hasError.set(true);
          this.errorMessage.set(err.message || 'Failed to load audit logs');
        }
      });
    }
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onEventTypeChange(types: AuditEventType[]): void {
    this.selectedEventTypes.set(types);
  }

  onStartDateChange(date: string): void {
    this.startDate.set(date);
    this.loadAuditLogs();
  }

  onEndDateChange(date: string): void {
    this.endDate.set(date);
    this.loadAuditLogs();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedEventTypes.set([]);
    this.startDate.set(null);
    this.endDate.set(null);
    this.loadAuditLogs();
  }

  refresh(): void {
    this.loadAuditLogs();
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date));
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return this.formatDate(date);
  }

  toggleFilters(): void {
    this.filtersExpanded.update(v => !v);
  }

  removeFilter(type: 'search' | 'eventType' | 'startDate' | 'endDate', value?: any): void {
    switch (type) {
      case 'search':
        this.searchQuery.set('');
        break;
      case 'eventType':
        this.selectedEventTypes.set([]);
        break;
      case 'startDate':
        this.startDate.set(null);
        this.loadAuditLogs();
        break;
      case 'endDate':
        this.endDate.set(null);
        this.loadAuditLogs();
        break;
    }
  }

  getSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
      success: 'text-green-600 bg-green-50 border-green-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200',
      warn: 'text-amber-600 bg-amber-50 border-amber-200',
      danger: 'text-red-600 bg-red-50 border-red-200'
    };
    return classes[severity] || classes['info'];
  }
}
