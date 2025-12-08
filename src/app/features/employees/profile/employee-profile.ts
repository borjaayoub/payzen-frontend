import { Component, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule } from 'primeng/fileupload';
import { TimelineModule } from 'primeng/timeline';
import { EmployeeService } from '@app/core/services/employee.service';
import { Employee as EmployeeProfileModel } from '@app/core/models/employee.model';

interface Document {
  type: string;
  name: string;
  uploadDate: string;
  status: 'uploaded' | 'missing';
  url?: string;
}

interface HistoryEvent {
  date: string;
  type: 'salary_change' | 'position_change' | 'note';
  title: string;
  description: string;
  author: string;
}

@Component({
  selector: 'app-employee-profile',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    TagModule,
    AvatarModule,
    FileUploadModule,
    TimelineModule
  ],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.css'
})
export class EmployeeProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);

  readonly activeTab = signal('0');
  readonly isEditMode = signal(false);
  readonly employeeId = signal<string | null>(null);
  readonly isLoadingProfile = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly employee = signal<EmployeeProfileModel>(this.createEmptyEmployee());

  readonly documents = signal<Document[]>([
    {
      type: 'cin',
      name: 'CIN - Youssef Amrani.pdf',
      uploadDate: '2022-01-10',
      status: 'uploaded',
      url: '#'
    },
    {
      type: 'contract',
      name: 'Contrat CDI - Youssef Amrani.pdf',
      uploadDate: '2022-01-10',
      status: 'uploaded',
      url: '#'
    },
    {
      type: 'rib',
      name: 'RIB - Youssef Amrani.pdf',
      uploadDate: '2022-01-10',
      status: 'uploaded',
      url: '#'
    },
    {
      type: 'job_description',
      name: 'Fiche de poste',
      uploadDate: '',
      status: 'missing'
    }
  ]);

  readonly history = signal<HistoryEvent[]>([
    {
      date: '2024-01-01',
      type: 'salary_change',
      title: 'Augmentation de salaire',
      description: 'Salaire de base: 13000 MAD → 15000 MAD',
      author: 'Fatima Zahra (RH)'
    },
    {
      date: '2023-06-15',
      type: 'position_change',
      title: 'Promotion',
      description: 'Développeur → Développeur Senior',
      author: 'Ahmed Bennani (Manager)'
    },
    {
      date: '2023-01-15',
      type: 'note',
      title: 'Fin de période d\'essai',
      description: 'Période d\'essai validée avec succès',
      author: 'Fatima Zahra (RH)'
    }
  ]);

  readonly maritalStatusOptions = [
    { label: 'Célibataire', value: 'single' },
    { label: 'Marié(e)', value: 'married' },
    { label: 'Divorcé(e)', value: 'divorced' },
    { label: 'Veuf(ve)', value: 'widowed' }
  ];

  readonly contractTypeOptions = [
    { label: 'CDI', value: 'CDI' },
    { label: 'CDD', value: 'CDD' },
    { label: 'Stage', value: 'Stage' }
  ];

  readonly paymentMethodOptions = [
    { label: 'Virement bancaire', value: 'bank_transfer' },
    { label: 'Chèque', value: 'check' },
    { label: 'Espèces', value: 'cash' }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.employeeId.set(params['id']);
        this.loadEmployeeDetails(params['id']);
      }
    });
  }

  private loadEmployeeDetails(id: string): void {
    this.isLoadingProfile.set(true);
    this.loadError.set(null);

    this.employeeService.getEmployeeDetails(id).subscribe({
      next: (employee) => {
        this.employee.set(employee);
        this.isLoadingProfile.set(false);
      },
      error: (err) => {
        console.error('Failed to load employee details', err);
        this.loadError.set('Impossible de charger le profil employé.');
        this.isLoadingProfile.set(false);
      }
    });
  }

  getFullName(): string {
    return `${this.employee().firstName} ${this.employee().lastName}`;
  }

  getInitials(): string {
    return `${this.employee().firstName.charAt(0)}${this.employee().lastName.charAt(0)}`;
  }

  getStatusSeverity(): 'success' | 'warn' | 'danger' {
    const status = this.employee().status;
    if (status === 'active') return 'success';
    if (status === 'on_leave') return 'warn';
    return 'danger';
  }

  getStatusLabel(): string {
    const status = this.employee().status;
    if (status === 'active') return 'Actif';
    if (status === 'on_leave') return 'En cong�';
    return 'Inactif';
  }

  getMaritalStatusLabel(): string {
    const option = this.maritalStatusOptions.find(o => o.value === this.employee().maritalStatus);
    return option?.label || '';
  }

  getPaymentMethodLabel(): string {
    const option = this.paymentMethodOptions.find(o => o.value === this.employee().paymentMethod);
    return option?.label || '';
  }

  getTotalSalary(): number {
    const emp = this.employee();
    return (emp.baseSalary || 0) + (emp.transportAllowance || 0) + (emp.mealAllowance || 0) + (emp.seniorityBonus || 0);
  }

  toggleEditMode() {
    this.isEditMode.update(v => !v);
  }

  save() {
    // TODO: Call API to save employee data
    console.log('Saving employee:', this.employee());
    this.isEditMode.set(false);
  }

  cancel() {
    // TODO: Reset to original values
    this.isEditMode.set(false);
  }

  goBack() {
    this.router.navigate(['/employees']);
  }

  uploadDocument(event: any, documentType: string) {
    // TODO: Handle document upload
    console.log('Uploading document:', documentType, event.files);
  }

  downloadDocument(doc: Document) {
    // TODO: Download document
    console.log('Downloading:', doc);
  }

  deleteDocument(doc: Document) {
    // TODO: Delete document
    console.log('Deleting:', doc);
  }

  getEventIcon(type: string): string {
    const iconMap: Record<string, string> = {
      salary_change: 'pi pi-dollar',
      position_change: 'pi pi-briefcase',
      note: 'pi pi-file-edit'
    };
    return iconMap[type] || 'pi pi-circle';
  }

  getEventColor(type: string): string {
    const colorMap: Record<string, string> = {
      salary_change: 'text-green-600',
      position_change: 'text-blue-600',
      note: 'text-gray-600'
    };
    return colorMap[type] || 'text-gray-600';
  }

  private createEmptyEmployee(): EmployeeProfileModel {
    return {
      id: '',
      firstName: '',
      lastName: '',
      photo: undefined,
      cin: '',
      maritalStatus: 'single',
      birthDate: '',
      birthPlace: '',
      professionalEmail: '',
      personalEmail: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      manager: '',
      contractType: 'CDI',
      startDate: '',
      endDate: undefined,
      probationPeriod: '',
      exitReason: undefined,
      baseSalary: 0,
      transportAllowance: 0,
      mealAllowance: 0,
      seniorityBonus: 0,
      benefitsInKind: undefined,
      paymentMethod: 'bank_transfer',
      cnss: '',
      amo: '',
      cimr: undefined,
      annualLeave: 0,
      status: 'active',
      missingDocuments: 0
    };
  }
}
