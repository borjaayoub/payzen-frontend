import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CompanyContextService } from '@app/core/services/companyContext.service';
import { AuditLogComponent } from '@app/shared/components/audit-log/audit-log.component';

@Component({
  selector: 'app-history-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    AuditLogComponent
  ],
  templateUrl: './history-tab.component.html'
})
export class HistoryTabComponent {
  private readonly companyContextService = inject(CompanyContextService);

  // Get current company ID from context
  readonly companyId = this.companyContextService.companyId;
  
  // Make Number available in template
  protected readonly Number = Number;
}
