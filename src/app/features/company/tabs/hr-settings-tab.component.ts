import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CompanyService } from '@app/core/services/company.service';
import { Company, HRParameters } from '@app/core/models/company.model';

@Component({
  selector: 'app-hr-settings-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SelectButtonModule,
    SelectModule,
    ButtonModule,
    InputNumberModule,
    RadioButtonModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './hr-settings-tab.component.html'
})
export class HrSettingsTabComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private messageService = inject(MessageService);

  hrForm!: FormGroup;
  loading = signal<boolean>(false);
  company = signal<Company | null>(null);

  workingDaysOptions = [
    { label: 'Mon', value: 'monday' },
    { label: 'Tue', value: 'tuesday' },
    { label: 'Wed', value: 'wednesday' },
    { label: 'Thu', value: 'thursday' },
    { label: 'Fri', value: 'friday' },
    { label: 'Sat', value: 'saturday' },
    { label: 'Sun', value: 'sunday' }
  ];

  leaveRateOptions = [
    { label: '1.5 days/month', value: 1.5 },
    { label: '2.0 days/month', value: 2.0 }
  ];

  paymentModeOptions = [
    { label: 'Virement', value: 'virement' },
    { label: 'Chèque', value: 'cheque' },
    { label: 'Espèces', value: 'especes' }
  ];

  ngOnInit() {
    this.initForm();
    this.loadCompanyData();
  }

  private initForm() {
    this.hrForm = this.fb.group({
      workingDays: [[], Validators.required],
      standardHoursPerDay: [8, [Validators.required, Validators.min(0), Validators.max(24)]],
      leaveAccrualRate: [1.5, Validators.required],
      includeSaturdays: [false, Validators.required],
      defaultPaymentMode: ['virement', Validators.required],
      rib: ['', [Validators.pattern(/^\d{24}$/)]]
    });
  }

  private loadCompanyData() {
    this.loading.set(true);
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company.set(data);
        if (data.hrParameters) {
          this.hrForm.patchValue({
            workingDays: data.hrParameters.workingDays || [],
            standardHoursPerDay: data.hrParameters.standardHoursPerDay || 8,
            leaveAccrualRate: data.hrParameters.leaveAccrualRate || 1.5,
            includeSaturdays: data.hrParameters.includeSaturdays || false,
            defaultPaymentMode: data.hrParameters.defaultPaymentMode || 'virement',
            rib: data.hrParameters.rib || ''
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading company data', err);
        this.loading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.hrForm.invalid) return;

    this.loading.set(true);
    const formValues = this.hrForm.value;
    
    const currentCompany = this.company();
    if (!currentCompany) return;

    const updatedHrParams: HRParameters = {
      ...currentCompany.hrParameters,
      workingDays: formValues.workingDays,
      leaveAccrualRate: formValues.leaveAccrualRate,
      defaultPaymentMode: formValues.defaultPaymentMode,
      workingHoursPerWeek: formValues.workingHoursPerWeek,
      // Recalculate annual leave days based on rate
      annualLeaveDays: formValues.leaveAccrualRate * 12
    };

    const updateData: Partial<Company> = {
      hrParameters: updatedHrParams
    };

    this.companyService.updateCompany(updateData).subscribe({
      next: (updatedCompany) => {
        this.company.set(updatedCompany);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'HR Settings updated' });
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update HR settings' });
        this.loading.set(false);
      }
    });
  }
}
