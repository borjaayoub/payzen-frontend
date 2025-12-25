import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { PopoverModule } from 'primeng/popover';
import { MessageService } from 'primeng/api';
import { CompanyService } from '@app/core/services/company.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';
import { Company, HRParameters } from '@app/core/models/company.model';
import { Subscription } from 'rxjs';

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
    TextareaModule,
    ToastModule,
    PopoverModule
  ],
  providers: [MessageService],
  templateUrl: './hr-settings-tab.component.html'
})
export class HrSettingsTabComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly companyService = inject(CompanyService);
  private readonly messageService = inject(MessageService);
  private readonly contextService = inject(CompanyContextService);
  private contextSub?: Subscription;

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

  readonly currencyOptions = [
    { label: 'company.hrSettings.currencies.mad', value: 'MAD' },
    { label: 'company.hrSettings.currencies.eur', value: 'EUR' },
    { label: 'company.hrSettings.currencies.usd', value: 'USD' }
  ];

  readonly paymentFrequencyOptions = [
    { label: 'company.hrSettings.frequencies.monthly', value: 'monthly' },
    { label: 'company.hrSettings.frequencies.bimonthly', value: 'bimonthly' },
    { label: 'company.hrSettings.frequencies.weekly', value: 'weekly' }
  ];

  readonly fiscalMonthOptions = [
    { label: 'company.hrSettings.months.january', value: 1 },
    { label: 'company.hrSettings.months.february', value: 2 },
    { label: 'company.hrSettings.months.march', value: 3 },
    { label: 'company.hrSettings.months.april', value: 4 },
    { label: 'company.hrSettings.months.may', value: 5 },
    { label: 'company.hrSettings.months.june', value: 6 },
    { label: 'company.hrSettings.months.july', value: 7 },
    { label: 'company.hrSettings.months.august', value: 8 },
    { label: 'company.hrSettings.months.september', value: 9 },
    { label: 'company.hrSettings.months.october', value: 10 },
    { label: 'company.hrSettings.months.november', value: 11 },
    { label: 'company.hrSettings.months.december', value: 12 }
  ];

  readonly paymentModeOptions = [
    { label: 'company.hrSettings.selectPaymentMode', value: null },
    { label: 'company.hrSettings.paymentModes.bankTransfer', value: 'virement' },
    { label: 'company.hrSettings.paymentModes.check', value: 'cheque' },
    { label: 'company.hrSettings.paymentModes.cash', value: 'especes' }
  ];

  readonly sectorOptions = [
    { label: 'company.hrSettings.selectSector', value: null },
    { label: 'company.hrSettings.sectors.agriculture', value: 'agriculture' },
    { label: 'company.hrSettings.sectors.industry', value: 'industry' },
    { label: 'company.hrSettings.sectors.commerce', value: 'commerce' },
    { label: 'company.hrSettings.sectors.services', value: 'services' },
    { label: 'company.hrSettings.sectors.tech', value: 'tech' },
    { label: 'company.hrSettings.sectors.construction', value: 'construction' },
    { label: 'company.hrSettings.sectors.transport', value: 'transport' },
    { label: 'company.hrSettings.sectors.tourism', value: 'tourism' },
    { label: 'company.hrSettings.sectors.health', value: 'health' },
    { label: 'company.hrSettings.sectors.education', value: 'education' },
    { label: 'company.hrSettings.sectors.finance', value: 'finance' },
    { label: 'company.hrSettings.sectors.other', value: 'other' }
  ];

  // Default form values
  private readonly defaultValues = {
    workingDays: [] as string[],
    standardHoursPerDay: 8,
    leaveAccrualRate: 1.5,
    includeSaturdays: false,
    currency: 'MAD',
    paymentFrequency: 'monthly',
    fiscalYearStartMonth: 1,
    defaultPaymentMode: null,
    sector: null,
    collectiveAgreement: '',
    cnssSpecificParameters: '',
    irSpecificParameters: ''
  };

  ngOnInit() {
    this.initForm();
    this.loadCompanyData();
    
    // Subscribe to context changes
    this.contextSub = this.contextService.contextChanged$.subscribe(() => {
      this.loadCompanyData();
    });
  }

  ngOnDestroy() {
    if (this.contextSub) {
      this.contextSub.unsubscribe();
    }
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
      currency: [this.defaultValues.currency, Validators.required],
      paymentFrequency: [this.defaultValues.paymentFrequency, Validators.required],
      fiscalYearStartMonth: [this.defaultValues.fiscalYearStartMonth, Validators.required],
      defaultPaymentMode: [this.defaultValues.defaultPaymentMode],
      sector: [this.defaultValues.sector],
      collectiveAgreement: [this.defaultValues.collectiveAgreement, Validators.maxLength(200)],
      cnssSpecificParameters: [this.defaultValues.cnssSpecificParameters, Validators.maxLength(500)],
      irSpecificParameters: [this.defaultValues.irSpecificParameters, Validators.maxLength(500)]
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
    
    const hr = data.hrParameters as any;
    this.hrForm.patchValue({
      workingDays: hr.workingDays ?? this.defaultValues.workingDays,
      standardHoursPerDay: hr.standardHoursPerDay ?? this.defaultValues.standardHoursPerDay,
      leaveAccrualRate: hr.leaveAccrualRate ?? this.defaultValues.leaveAccrualRate,
      includeSaturdays: hr.includeSaturdays ?? this.defaultValues.includeSaturdays,
      currency: hr.currency ?? this.defaultValues.currency,
      paymentFrequency: hr.paymentFrequency ?? this.defaultValues.paymentFrequency,
      fiscalYearStartMonth: hr.fiscalYearStartMonth ?? this.defaultValues.fiscalYearStartMonth,
      defaultPaymentMode: hr.defaultPaymentMode ?? this.defaultValues.defaultPaymentMode,
      sector: hr.sector ?? this.defaultValues.sector,
      collectiveAgreement: hr.collectiveAgreement ?? this.defaultValues.collectiveAgreement,
      cnssSpecificParameters: hr.cnssSpecificParameters ?? this.defaultValues.cnssSpecificParameters,
      irSpecificParameters: hr.irSpecificParameters ?? this.defaultValues.irSpecificParameters
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
