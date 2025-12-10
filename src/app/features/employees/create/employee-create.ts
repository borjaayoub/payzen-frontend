import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import {
  CityLookupOption,
  CreateEmployeeRequest,
  EmployeeFormData,
  EmployeeService,
  ManagerLookupOption
} from '@app/core/services/employee.service';

@Component({
  selector: 'app-employee-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    SelectModule
  ],
  templateUrl: './employee-create.html',
  styleUrl: './employee-create.css'
})
export class EmployeeCreatePage implements OnInit {
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  private readonly emptyFormData: EmployeeFormData = {
    statuses: [],
    genders: [],
    educationLevels: [],
    maritalStatuses: [],
    nationalities: [],
    countries: [],
    cities: [],
    departements: [],
    jobPositions: [],
    contractTypes: [],
    potentialManagers: []
  };
  readonly formData = signal<EmployeeFormData>(this.emptyFormData);
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  readonly employeeForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    statusId: [null, Validators.required],
    genderId: [null],
    educationLevelId: [null],
    maritalStatusId: [null],
    nationalityId: [null],
    countryId: [null],
    cityId: [null],
    addressLine1: [''],
    addressLine2: [''],
    zipCode: [''],
    departementId: [null, Validators.required],
    jobPositionId: [null, Validators.required],
    contractTypeId: [null, Validators.required],
    managerId: [null],
    startDate: ['', Validators.required],
    salary: [null, Validators.min(0)]
  });

  readonly phoneCode = computed(() => {
    const countryId = this.employeeForm.controls.countryId.value;
    return this.formData().countries.find(country => country.id === countryId)?.phoneCode ?? '';
  });

  readonly cityOptions = computed<CityLookupOption[]>(() => {
    const countryId = this.employeeForm.controls.countryId.value;
    const cities = this.formData().cities;
    if (!countryId) {
      return cities;
    }
    return cities.filter(city => city.countryId === Number(countryId));
  });

  ngOnInit(): void {
    this.loadFormData();
  }

  loadFormData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.employeeService.getEmployeeFormData().subscribe({
      next: (data) => {
        this.formData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading employee form data', err);
        this.errorMessage.set(err.error?.message || this.translate.instant('employees.create.error'));
        this.isLoading.set(false);
      }
    });
  }

  submit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const value = this.employeeForm.value;
    const selectedPhoneCode = this.phoneCode();
    const payload: CreateEmployeeRequest = {
      FirstName: value.firstName ?? '',
      LastName: value.lastName ?? '',
      Email: value.email ?? '',
      Phone: [selectedPhoneCode, value.phone].filter(Boolean).join(' ').trim(),
      StatusId: Number(value.statusId),
      GenderId: value.genderId ? Number(value.genderId) : null,
      EducationLevelId: value.educationLevelId ? Number(value.educationLevelId) : null,
      MaritalStatusId: value.maritalStatusId ? Number(value.maritalStatusId) : null,
      NationalityId: value.nationalityId ? Number(value.nationalityId) : null,
      CountryId: value.countryId ? Number(value.countryId) : null,
      CityId: value.cityId ? Number(value.cityId) : null,
      CountryPhoneCode: selectedPhoneCode || null,
      AddressLine1: value.addressLine1 || null,
      AddressLine2: value.addressLine2 || null,
      ZipCode: value.zipCode || null,
      DepartementId: value.departementId ? Number(value.departementId) : null,
      JobPositionId: value.jobPositionId ? Number(value.jobPositionId) : null,
      ContractTypeId: value.contractTypeId ? Number(value.contractTypeId) : null,
      ManagerId: value.managerId ? Number(value.managerId) : null,
      StartDate: value.startDate || null,
      Salary: value.salary != null ? Number(value.salary) : null
    };

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.employeeService.createEmployeeRecord(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(this.translate.instant('employees.create.success'));
        this.employeeForm.reset();
        setTimeout(() => this.router.navigate(['/employees']), 800);
      },
      error: (err) => {
        console.error('Error creating employee', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || this.translate.instant('employees.create.error'));
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }

  retryLoad(): void {
    this.loadFormData();
  }

  isInvalid(controlName: string): boolean {
    const control = this.employeeForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  trackByOption(_: number, option: { id: number }): number {
    return option.id;
  }

  trackByManager(_: number, manager: ManagerLookupOption): number {
    return manager.id;
  }
}
