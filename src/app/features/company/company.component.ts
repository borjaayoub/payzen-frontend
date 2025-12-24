import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'primeng/tabs';
import { CompanyInfoTabComponent } from './tabs/company-info-tab.component';
import { HrSettingsTabComponent } from './tabs/hr-settings-tab.component';
import { DocumentsTabComponent } from './tabs/documents-tab.component';
import { UsersTabComponent } from './tabs/users-tab.component';
import { HistoryTabComponent } from './tabs/history-tab.component';
import { DepartmentTabComponent } from './tabs/department-tab.component';
import { JobPositionTabComponent } from './tabs/job-position-tab.component';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TabsModule,
    CompanyInfoTabComponent,
    HrSettingsTabComponent,
    DocumentsTabComponent,
    UsersTabComponent,
    HistoryTabComponent,
    DepartmentTabComponent,
    JobPositionTabComponent
  ],
  templateUrl: './company.html',
})
export class CompanyComponent {
  // activeIndex is not strictly needed for p-tabs if we use value="0" but let's keep it simple
}
