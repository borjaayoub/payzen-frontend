import { Component, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { CompanyInfoTab } from './tabs/company-info-tab';
import { HrSettingsTab } from './tabs/hr-settings-tab';
import { UsersTab } from './tabs/users-tab';
import { DocumentsTab } from './tabs/documents-tab';

interface Tab {
  label: string;
  icon: string;
  value: string;
  route: string;
}

@Component({
  selector: 'app-company',
  imports: [
    TabsModule,
    ButtonModule,
    TranslateModule,
    CompanyInfoTab,
    HrSettingsTab,
    UsersTab,
    DocumentsTab
  ],
  templateUrl: './company.html',
  styleUrl: './company.css'
})
export class CompanyPage {
  readonly activeTabIndex = signal('0');

  readonly tabs: Tab[] = [
    {
      label: 'company.tabs.info',
      icon: 'pi pi-info-circle',
      value: '0',
      route: '/company'
    },
    {
      label: 'company.tabs.hrSettings',
      icon: 'pi pi-cog',
      value: '1',
      route: '/company/hr-settings'
    },
    {
      label: 'company.tabs.users',
      icon: 'pi pi-users',
      value: '2',
      route: '/company/users'
    },
    {
      label: 'company.tabs.documents',
      icon: 'pi pi-file',
      value: '3',
      route: '/company/documents'
    }
  ];
}
