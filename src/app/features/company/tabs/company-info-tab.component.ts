import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CompanyService } from '@app/core/services/company.service';
import { Company } from '@app/core/models/company.model';
import { EditableFieldComponent } from '@app/shared/components/editable-field/editable-field.component';

@Component({
  selector: 'app-company-info-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    InputTextModule,
    ButtonModule,
    FileUploadModule,
    ToastModule,
    EditableFieldComponent
  ],
  providers: [MessageService],
  templateUrl: './company-info-tab.component.html'
})
export class CompanyInfoTabComponent implements OnInit {
  private companyService = inject(CompanyService);
  private messageService = inject(MessageService);

  loading = signal<boolean>(false);
  company = signal<Company | null>(null);

  ngOnInit() {
    this.loadCompanyData();
  }

  private loadCompanyData() {
    this.loading.set(true);
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading company data', err);
        this.loading.set(false);
      }
    });
  }

  onUpload(event: any) {
    // Handle file upload
    const file = event.files[0];
    this.companyService.updateLogo(file).subscribe({
      next: (url) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Logo updated successfully' });
        // Update local state if needed
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update logo' });
      }
    });
  }

  updateField(field: keyof Company, value: any) {
    this.loading.set(true);
    const update = { [field]: value };
    
    this.companyService.updateCompany(update).subscribe({
      next: (updatedCompany) => {
        this.company.set(updatedCompany);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Field updated successfully' });
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update field' });
        this.loading.set(false);
      }
    });
  }
}
