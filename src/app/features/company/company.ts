import { Component, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { CompanyInfoTab } from './tabs/company-info-tab';
import { HrSettingsTab } from './tabs/hr-settings-tab';
import { UsersTab } from './tabs/users-tab';
import { DocumentsTab } from './tabs/documents-tab';
import { Button } from '../../design-system/button/button';

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
    TranslateModule,
    CompanyInfoTab,
    HrSettingsTab,
    UsersTab,
    DocumentsTab,
    Button
  ],
  templateUrl: './company.html',
  styleUrl: './company.css'
})
export class CompanyPage {
  readonly activeTabIndex = signal('0');

  readonly tabs: Tab[] = [
    {
      label: 'Informations',
      icon: 'pi pi-info-circle',
      value: '0',
      route: '/company'
    },
    {
      label: 'Paramètres RH',
      icon: 'pi pi-cog',
      value: '1',
      route: '/company/hr-settings'
    },
    {
      label: 'Utilisateurs',
      icon: 'pi pi-users',
      value: '2',
      route: '/company/users'
    },
    {
      label: 'Documents',
      icon: 'pi pi-file',
      value: '3',
      route: '/company/documents'
    }
  ];
}
