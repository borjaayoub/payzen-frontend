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
import { PopoverModule } from 'primeng/popover';
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
    ToastModule,
    PopoverModule
  ],
  providers: [MessageService],
  templateUrl: './hr-settings-tab.component.html'
})
export class HrSettingsTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly messageService = inject(MessageService);

  // Form state
  hrForm!: FormGroup;
  loading = signal(false);
  company = signal<Company | null>(null);
  formSubmitted = false;

  // Help popover content
  readonly helpPoints = [
    'company.hrSettings.helpPoint1',
    'company.hrSettings.helpPoint2',
    'company.hrSettings.helpPoint3'
  ];

  // Form options
  readonly workingDaysOptions = [
    { label: 'Mon', value: 'monday' },
    { label: 'Tue', value: 'tuesday' },
    { label: 'Wed', value: 'wednesday' },
    { label: 'Thu', value: 'thursday' },
    { label: 'Fri', value: 'friday' },
    { label: 'Sat', value: 'saturday' },
    { label: 'Sun', value: 'sunday' }
  ];

  readonly leaveRateOptions = [
    { label: '1.5 days/month', value: 1.5 },
    { label: '2.0 days/month', value: 2.0 }
  ];

  readonly paymentModeOptions = [
    { label: 'Virement', value: 'virement' },
    { label: 'Chèque', value: 'cheque' },
    { label: 'Espèces', value: 'especes' }
  ];

  // Default form values
  private readonly defaultValues = {
    workingDays: [] as string[],
    standardHoursPerDay: 8,
    leaveAccrualRate: 1.5,
    includeSaturdays: false,
    defaultPaymentMode: 'virement',
    rib: ''
  };

  ngOnInit() {
    this.initForm();
    this.loadCompanyData();
  }

  /** Check if a form field is invalid and should show error */
  isFieldInvalid(fieldName: string): boolean {
    const control = this.hrForm.get(fieldName);
    return !!(control?.invalid && (control.touched || this.formSubmitted));
  }

  private initForm() {
    this.hrForm = this.fb.group({
      workingDays: [this.defaultValues.workingDays, Validators.required],
      standardHoursPerDay: [this.defaultValues.standardHoursPerDay, [Validators.required, Validators.min(0), Validators.max(24)]],
      leaveAccrualRate: [this.defaultValues.leaveAccrualRate, Validators.required],
      includeSaturdays: [this.defaultValues.includeSaturdays, Validators.required],
      defaultPaymentMode: [this.defaultValues.defaultPaymentMode, Validators.required],
      rib: [this.defaultValues.rib, Validators.pattern(/^\d{24}$/)]
    });
  }

  private loadCompanyData() {
    this.loading.set(true);
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company.set(data);
        this.patchFormWithCompanyData(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading company data:', err);
        this.loading.set(false);
      }
    });
  }

  private patchFormWithCompanyData(data: Company) {
    if (!data.hrParameters) return;
    
    const hr = data.hrParameters;
    this.hrForm.patchValue({
      workingDays: hr.workingDays ?? this.defaultValues.workingDays,
      standardHoursPerDay: hr.standardHoursPerDay ?? this.defaultValues.standardHoursPerDay,
      leaveAccrualRate: hr.leaveAccrualRate ?? this.defaultValues.leaveAccrualRate,
      includeSaturdays: hr.includeSaturdays ?? this.defaultValues.includeSaturdays,
      defaultPaymentMode: hr.defaultPaymentMode ?? this.defaultValues.defaultPaymentMode,
      rib: hr.rib ?? this.defaultValues.rib
    });
  }

  private resetFormToCompanyData() {
    const data = this.company();
    if (data) {
      this.patchFormWithCompanyData(data);
      this.hrForm.markAsPristine();
      this.formSubmitted = false;
    }
  }

  onSubmit() {
    this.formSubmitted = true;
    this.hrForm.markAllAsTouched();

    if (this.hrForm.invalid) {
      this.showToast('error', 'Validation Error', 'Please fix the errors in the form before saving');
      this.scrollToFirstError();
      return;
    }

    const currentCompany = this.company();
    if (!currentCompany) return;

    this.loading.set(true);
    const formValues = this.hrForm.value;

    const updatedHrParams: HRParameters = {
      ...currentCompany.hrParameters,
      ...formValues,
      annualLeaveDays: formValues.leaveAccrualRate * 12
    };

    this.companyService.updateCompany({ hrParameters: updatedHrParams }).subscribe({
      next: (updatedCompany) => {
        this.company.set(updatedCompany);
        this.formSubmitted = false;
        this.hrForm.markAsPristine();
        this.showToast('success', 'Success', 'HR Settings have been successfully updated');
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating HR settings:', error);
        this.showToast('error', 'Error', 'Failed to update HR settings. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onCancel() {
    if (!this.hrForm.dirty) return;
    
    this.resetFormToCompanyData();
    this.showToast('info', 'Changes Discarded', 'Your changes have been discarded');
  }

  private showToast(severity: 'success' | 'error' | 'info', summary: string, detail: string) {
    this.messageService.add({ 
      severity, 
      summary, 
      detail,
      life: severity === 'error' ? 5000 : 4000
    });
  }

  private scrollToFirstError() {
    setTimeout(() => {
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstError as HTMLElement).focus();
      }
    }, 100);
  }
}
