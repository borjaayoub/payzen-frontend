import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

interface CompanyInfo {
  raisonSociale: string;
  ice: string;
  cnss: string;
  address: string;
  email: string;
  phone: string;
  regimeFiscal: string;
  cabinetComptable: string;
}

@Component({
  selector: 'app-company-info-tab',
  imports: [
    FormsModule,
    TranslateModule,
    InputTextModule,
    ButtonModule,
    SelectModule,
    TagModule
  ],
  templateUrl: './company-info-tab.html'
})
export class CompanyInfoTab {
  readonly isEditMode = signal(false);

  readonly companyInfo = signal<CompanyInfo>({
    raisonSociale: 'PayZen SaaS',
    ice: '000000000000000',
    cnss: '1234567',
    address: '123 Avenue Mohammed V, Casablanca',
    email: 'contact@payzen.ma',
    phone: '+212 6XX XXX XXX',
    regimeFiscal: 'normal',
    cabinetComptable: ''
  });

  readonly regimeFiscalOptions = [
    { label: 'Régime Normal', value: 'normal' },
    { label: 'Impôt sur les Sociétés (IS)', value: 'IS' },
    { label: 'Impôt sur le Revenu (IR)', value: 'IR' },
    { label: 'Auto-Entrepreneur', value: 'AE' }
  ];

  getRegimeFiscalLabel(): string {
    const option = this.regimeFiscalOptions.find(o => o.value === this.companyInfo().regimeFiscal);
    return option?.label || '';
  }

  toggleEditMode() {
    this.isEditMode.update(v => !v);
  }

  save() {
    // TODO: Call API to save company info
    this.isEditMode.set(false);
  }

  cancel() {
    // TODO: Reset form to original values
    this.isEditMode.set(false);
  }
}
