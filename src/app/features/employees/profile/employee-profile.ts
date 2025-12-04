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

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  cin: string;
  maritalStatus: string;
  birthDate: string;
  birthPlace: string;
  professionalEmail: string;
  personalEmail: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  manager: string;
  contractType: 'CDI' | 'CDD' | 'Stage';
  startDate: string;
  endDate?: string;
  probationPeriod: string;
  exitReason?: string;
  baseSalary: number;
  transportAllowance: number;
  mealAllowance: number;
  seniorityBonus: number;
  benefitsInKind: string;
  paymentMethod: string;
  cnss: string;
  amo: string;
  cimr?: string;
  annualLeave: number;
  status: 'active' | 'on_leave' | 'inactive';
}

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

  readonly activeTab = signal('0');
  readonly isEditMode = signal(false);
  readonly employeeId = signal<string | null>(null);

  readonly employee = signal<EmployeeData>({
    id: '1',
    firstName: 'Youssef',
    lastName: 'Amrani',
    cin: 'AB123456',
    maritalStatus: 'married',
    birthDate: '1990-05-15',
    birthPlace: 'Casablanca',
    professionalEmail: 'youssef.amrani@payzen.ma',
    personalEmail: 'youssef@gmail.com',
    phone: '+212 6 12 34 56 78',
    address: '123 Rue Hassan II, Casablanca',
    position: 'D�veloppeur Senior',
    department: 'IT',
    manager: 'Ahmed Bennani',
    contractType: 'CDI',
    startDate: '2022-01-15',
    probationPeriod: '3 mois',
    baseSalary: 15000,
    transportAllowance: 500,
    mealAllowance: 300,
    seniorityBonus: 1000,
    benefitsInKind: 'V�hicule de fonction',
    paymentMethod: 'Virement bancaire',
    cnss: '123456789',
    amo: 'AMO123456',
    cimr: 'CIMR789',
    annualLeave: 22,
    status: 'active'
  });

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
      description: 'Salaire de base: 13000 MAD � 15000 MAD',
      author: 'Fatima Zahra (RH)'
    },
    {
      date: '2023-06-15',
      type: 'position_change',
      title: 'Promotion',
      description: 'D�veloppeur � D�veloppeur Senior',
      author: 'Ahmed Bennani (Manager)'
    },
    {
      date: '2023-01-15',
      type: 'note',
      title: 'Fin de p�riode d\'essai',
      description: 'P�riode d\'essai valid�e avec succ�s',
      author: 'Fatima Zahra (RH)'
    }
  ]);

  readonly maritalStatusOptions = [
    { label: 'C�libataire', value: 'single' },
    { label: 'Mari�(e)', value: 'married' },
    { label: 'Divorc�(e)', value: 'divorced' },
    { label: 'Veuf(ve)', value: 'widowed' }
  ];

  readonly contractTypeOptions = [
    { label: 'CDI', value: 'CDI' },
    { label: 'CDD', value: 'CDD' },
    { label: 'Stage', value: 'Stage' }
  ];

  readonly paymentMethodOptions = [
    { label: 'Virement bancaire', value: 'bank_transfer' },
    { label: 'Ch�que', value: 'check' },
    { label: 'Esp�ces', value: 'cash' }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.employeeId.set(params['id']);
        // TODO: Load employee data from API
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
    return emp.baseSalary + emp.transportAllowance + emp.mealAllowance + emp.seniorityBonus;
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
}
