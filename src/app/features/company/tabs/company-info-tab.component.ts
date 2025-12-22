import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CompanyService } from '@app/core/services/company.service';
import { Company } from '@app/core/models/company.model';
import { EditableFieldComponent } from '@app/shared/components/editable-field/editable-field.component';
import { ReadonlyFieldComponent } from '@app/shared/components/readonly-field/readonly-field.component';

interface FieldConfig {
  id: string;
  key: keyof Company;
  label: string;
  fullWidth?: boolean;
  type?: string;
}

@Component({
  selector: 'app-company-info-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    ButtonModule,
    FileUploadModule,
    ToastModule,
    TooltipModule,
    EditableFieldComponent,
    ReadonlyFieldComponent
  ],
  providers: [MessageService],
  templateUrl: './company-info-tab.component.html'
})
export class CompanyInfoTabComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly messageService = inject(MessageService);

  // State
  loading = signal(false);
  company = signal<Company | null>(null);
  infoExpanded = signal(false);
  citySuggestions = signal<string[]>([]);

  // Field configurations for DRY template
  readonly legalFields: FieldConfig[] = [
    { id: 'legalName', key: 'legalName', label: 'company.info.raisonSociale' },
    { id: 'ice', key: 'ice', label: 'company.info.ice' },
    { id: 'rc', key: 'rc', label: 'company.info.rc' },
    { id: 'patente', key: 'patente', label: 'company.info.patente' },
    { id: 'cnss', key: 'cnss', label: 'company.info.cnss' },
    { id: 'taxRegime', key: 'taxRegime', label: 'company.info.regimeFiscal' }
  ];

  readonly editableFields: FieldConfig[] = [
    { id: 'email', key: 'email', label: 'company.info.email' },
    { id: 'phone', key: 'phone', label: 'company.info.phone' },
    { id: 'address', key: 'address', label: 'company.info.address', fullWidth: true },
    { id: 'city', key: 'city', label: 'company.info.city', type: 'autocomplete' },
    { id: 'website', key: 'website', label: 'company.info.website' }
  ];

  ngOnInit() {
    this.loadCompanyData();
  }

  toggleInfoBanner() {
    this.infoExpanded.update((v) => !v);
  }

  searchCities(event: any) {
    this.companyService.searchCities(event.query).subscribe(suggestions => {
      this.citySuggestions.set(suggestions);
    });
  }

  /** Get field value from company object */
  getFieldValue(key: keyof Company): string {
    return (this.company()?.[key] as string) ?? '';
  }

  private loadCompanyData() {
    this.loading.set(true);
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading company data:', err);
        this.showToast('error', 'Error', 'Failed to load company data');
        this.loading.set(false);
      }
    });
  }

  onUpload(event: { files: File[] }) {
    const file = event.files[0];
    if (!file) return;

    this.companyService.updateLogo(file).subscribe({
      next: () => {
        this.showToast('success', 'Success', 'Logo updated successfully');
        this.loadCompanyData(); // Refresh to get new logo URL
      },
      error: () => {
        this.showToast('error', 'Error', 'Failed to update logo');
      }
    });
  }

  updateField(field: keyof Company, value: string) {
    this.loading.set(true);
    
    const currentCompany = this.company();
    if (!currentCompany) {
      this.loading.set(false);
      return;
    }

    // Create a partial update object but include the ID from the current company
    // We also include the changed field
    const updatePayload: Partial<Company> = {
      id: currentCompany.id,
      [field]: value
    };

    this.companyService.updateCompany(updatePayload).subscribe({
      next: (updatedCompany) => {
        this.company.set(updatedCompany);
        this.showToast('success', 'Success', 'Field updated successfully');
        this.loading.set(false);
      },
      error: () => {
        this.showToast('error', 'Error', 'Failed to update field');
        this.loading.set(false);
      }
    });
  }

  private showToast(severity: 'success' | 'error' | 'info', summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
