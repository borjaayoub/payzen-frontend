import { Component, signal, OnInit, inject, computed, HostListener, DestroyRef, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import {
  EmployeeService,
  EmployeeFormData,
  LookupOption
} from '@app/core/services/employee.service';
import { Employee as EmployeeProfileModel } from '@app/core/models/employee.model';
import { DraftService } from '@app/core/services/draft.service';
import { ChangeTracker, ChangeSet } from '@app/core/utils/change-tracker.util';
import { ChangeConfirmationDialog } from '@app/shared/components/change-confirmation-dialog/change-confirmation-dialog';
import { UnsavedChangesDialog } from '@app/shared/components/unsaved-changes-dialog/unsaved-changes-dialog';
import { CanComponentDeactivate } from '@app/core/guards/unsaved-changes.guard';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';

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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    TimelineModule,
    ChangeConfirmationDialog,
    UnsavedChangesDialog
  ],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.css'
})
export class EmployeeProfile implements OnInit, CanComponentDeactivate {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private employeeService = inject(EmployeeService);
  private draftService = inject(DraftService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private readonly AUTO_SAVE_DEBOUNCE = 800; // 800ms debounce for better UX
  private readonly ENTITY_TYPE = 'employee_profile';
  
  private isRestoringDraft = false;
  private lastSerializedEmployee = '';
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private originalEmployee: EmployeeProfileModel | null = null;
  private pendingNavigationResolver: ((result: boolean) => void) | null = null;
  private pendingCancel = false;

  private pendingTabTarget: string | null = null;
  private pendingDraftData: Partial<EmployeeProfileModel> | null = null;
  private pendingDraftTimestamp: Date | null = null;

  private readonly TAB_IDS = ['0', '1', '2', '3', '4', '5', '6'] as const;
  private readonly TAB_FIELD_MAP: Record<string, (keyof EmployeeProfileModel)[]> = {
    '0': ['firstName', 'lastName', 'cin', 'maritalStatus', 'dateOfBirth', 'birthPlace'],
    '1': ['professionalEmail', 'personalEmail', 'phone', 'address', 'countryId', 'countryName', 'city', 'addressLine1', 'addressLine2', 'zipCode'],
    '2': ['position', 'department', 'manager', 'contractType', 'startDate', 'endDate', 'probationPeriod'],
    '3': ['baseSalary', 'transportAllowance', 'mealAllowance', 'seniorityBonus', 'benefitsInKind', 'paymentMethod'],
    '4': ['cnss', 'amo', 'cimr', 'annualLeave'],
    '5': [],
    '6': []
  };

  // UI State
  readonly activeTab = signal('0');
  readonly isEditMode = signal(false);
  readonly employeeId = signal<string | null>(null);
  readonly isLoadingProfile = signal(false);
  readonly isLoadingFormData = signal(false);
  readonly isSaving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  
  // Draft & Change Tracking State
  readonly lastAutoSave = signal<Date | null>(null);
  readonly draftRestored = signal(false);
  readonly changeSet = signal<ChangeSet>(this.createEmptyChangeSet());
  readonly tabChangeSets = signal<Record<string, ChangeSet>>(this.createEmptyTabChangeSets());
  readonly unsavedTabs = computed(() =>
    Object.entries(this.tabChangeSets())
      .filter(([_, set]) => set.hasChanges)
      .map(([tab]) => tab)
  );
  
  // Dialog State
  readonly showConfirmDialog = signal(false);
  readonly showUnsavedDialog = signal(false);

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.changeSet().hasChanges) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  readonly saveSuccess = signal<string | null>(null);
  readonly ariaMessage = signal('');

  readonly employee = signal<EmployeeProfileModel>(this.createEmptyEmployee());

  // Field labels for change tracking
  private readonly FIELD_LABELS: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    cin: 'National ID',
    maritalStatus: 'Marital Status',
    dateOfBirth: 'Date of Birth',
    birthPlace: 'Place of Birth',
    professionalEmail: 'Professional Email',
    personalEmail: 'Personal Email',
    phone: 'Phone',
    address: 'Address',
    countryId: 'Country',
    countryName: 'Country',
    city: 'City',
    addressLine1: 'Address Line 1',
    addressLine2: 'Address Line 2',
    zipCode: 'Zip Code',
    position: 'Position',
    department: 'Department',
    manager: 'Manager',
    contractType: 'Contract Type',
    startDate: 'Start Date',
    endDate: 'End Date',
    probationPeriod: 'Probation Period',
    baseSalary: 'Base Salary',
    transportAllowance: 'Transport Allowance',
    mealAllowance: 'Meal Allowance',
    seniorityBonus: 'Seniority Bonus',
    benefitsInKind: 'Benefits in Kind',
    paymentMethod: 'Payment Method',
    cnss: 'CNSS',
    amo: 'AMO',
    cimr: 'CIMR',
    annualLeave: 'Annual Leave'
  };

  private readonly emptyFormData: EmployeeFormData = {
    statuses: [],
    genders: [],
    educationLevels: [],
    maritalStatuses: [],
    nationalities: [],
    countries: [],
    cities: [],
    departments: [],
    jobPositions: [],
    contractTypes: [],
    potentialManagers: []
  };
  readonly formData = signal<EmployeeFormData>(this.emptyFormData);

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

  readonly maritalStatusOptions: Array<{ id: number; label: string; value: EmployeeProfileModel['maritalStatus'] }> = [
    { id: 1, label: 'Célibataire', value: 'single' },
    { id: 2, label: 'Marié(e)', value: 'married' },
    { id: 3, label: 'Divorcé(e)', value: 'divorced' },
    { id: 4, label: 'Veuf(ve)', value: 'widowed' }
  ];
  readonly maritalStatusMap: Record<string, string> = {
    'single': 'Célibataire',
    'married': 'Marié(e)',
    'divorced': 'Divorcé(e)',
    'widowed': 'Veuf(ve)'
  };

  readonly contractTypeOptions: Array<{ id: number; label: string; value: EmployeeProfileModel['contractType'] }> = [
    { id: 1, label: 'CDI', value: 'CDI' },
    { id: 2, label: 'CDD', value: 'CDD' },
    { id: 3, label: 'Stage', value: 'Stage' }
  ];

  readonly paymentMethodOptions: Array<{ id: number; label: string; value: EmployeeProfileModel['paymentMethod'] }> = [
    { id: 1, label: 'Virement bancaire', value: 'bank_transfer' },
    { id: 2, label: 'Chèque', value: 'check' },
    { id: 3, label: 'Espèces', value: 'cash' }
  ];
  readonly paymentMethodMap: Record<string, string> = {
    'bank_transfer': 'Virement bancaire',
    'check': 'Chèque',
    'cash': 'Espèces'
  };

  readonly totalSalary = computed(() => {
    const emp = this.employee();
    return (emp.baseSalary || 0) + (emp.transportAllowance || 0) + (emp.mealAllowance || 0) + (emp.seniorityBonus || 0);
  });

  constructor() {
    // Setup effect to track employee signal changes for auto-save and change detection
    effect(() => {
      const currentEmployee = this.employee();
      const isEdit = this.isEditMode();
      
      if (!isEdit || this.isRestoringDraft) {
        return;
      }
      
      const serialized = JSON.stringify(currentEmployee);
      
      // Track changes for confirmation dialog and per-tab state
      if (this.originalEmployee) {
        const changes = ChangeTracker.trackChanges(
          this.originalEmployee,
          currentEmployee,
          this.FIELD_LABELS,
          ['id', 'photo', 'status', 'missingDocuments']
        );
        this.changeSet.set(changes);
        this.updateTabChangeSets(changes);
      }

      if (!this.lastSerializedEmployee) {
        this.lastSerializedEmployee = serialized;
        return;
      }

      if (serialized === this.lastSerializedEmployee) {
        return;
      }

      this.lastSerializedEmployee = serialized;
      
      // Debounced auto-save
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
      }
      
      this.autoSaveTimer = setTimeout(() => {
        if (this.isEditMode() && !this.isRestoringDraft && this.employeeId()) {
          this.saveDraftForTab(this.activeTab());
          const savedAt = new Date();
          this.lastAutoSave.set(savedAt);
          this.announce(`Draft saved at ${savedAt.toLocaleTimeString()}`);
        }
      }, this.AUTO_SAVE_DEBOUNCE);
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.employeeId.set(params['id']);
        this.loadEmployeeDetails(params['id']);
      }
    });

    this.draftService
      .onDraftUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ key, draft }) => {
        const id = this.employeeId();
        if (!id || !draft || !this.isDraftForCurrentEntity(key, id)) {
          return;
        }

        // Ignore updates originating from the same browser tab
        if (draft.metadata.tabId === this.draftService.getTabId()) {
          return;
        }

        this.pendingDraftData = { ...(this.pendingDraftData ?? {}), ...(draft.data as Partial<EmployeeProfileModel>) };
        const savedAt = new Date(draft.metadata.savedAt);
        this.pendingDraftTimestamp = savedAt;
        this.lastAutoSave.set(savedAt);
        this.draftRestored.set(true);
        this.announce('A newer draft is available from another tab.');
      });
  }

  private loadEmployeeDetails(id: string): void {
    this.isLoadingProfile.set(true);
    this.loadError.set(null);
    this.employeeService.getEmployeeDetails(id).subscribe({
      next: (employee) => {
        this.isRestoringDraft = true;
        this.employee.set(employee);
        this.originalEmployee = { ...employee };
        this.lastSerializedEmployee = JSON.stringify(employee);
        this.resetChangeTracking();
        
        // Check for existing draft
        this.restoreDraftIfAvailable();
        
        this.isLoadingProfile.set(false);
        
        setTimeout(() => {
          this.isRestoringDraft = false;
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load employee details', err);
        this.loadError.set(this.translate.instant('employees.profile.loadError'));
        this.isLoadingProfile.set(false);
      }
    });
  }

  getFullName(): string {
    return `${this.employee().firstName} ${this.employee().lastName}`.trim();
  }

  getInitials(): string {
    const emp = this.employee();
    const firstInitial = emp.firstName?.charAt(0) || '';
    const lastInitial = emp.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
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
    if (status === 'on_leave') return 'En congé';
    return 'Inactif';
  }

  getMaritalStatusLabel(): string {
    return this.maritalStatusMap[this.employee().maritalStatus] || '';
  }

  getPaymentMethodLabel(): string {
    return this.paymentMethodMap[this.employee().paymentMethod] || '';
  }

  getCountryLabel(): string {
    const countryId = this.employee().countryId;
    if (!countryId) return '-';
    const country = this.formData().countries.find(c => c.id === countryId);
    return country?.label || '-';
  }

  // Helper to update employee signal (triggers effect)
  updateField<K extends keyof EmployeeProfileModel>(field: K, value: EmployeeProfileModel[K]): void {
    this.saveError.set(null);
    this.employee.set({ ...this.employee(), [field]: value });
  }

  toggleEditMode(): void {
    if (!this.isEditMode()) {
      // Entering edit mode
      this.loadFormData();
      this.lastSerializedEmployee = JSON.stringify(this.employee());
      this.resetChangeTracking();
    } else {
      // Exiting edit mode - cancel changes
      this.cancel();
      return;
    }
    this.isEditMode.update(v => !v);
    this.saveError.set(null);
    this.saveSuccess.set(null);
  }

  loadFormData(): void {
    if (this.formData().statuses.length > 0) {
      return;
    }
    this.isLoadingFormData.set(true);
    this.employeeService.getEmployeeFormData().subscribe({
      next: (data) => {
        this.formData.set(data);
        this.isLoadingFormData.set(false);
      },
      error: (err) => {
        console.error('Error loading form data', err);
        this.isLoadingFormData.set(false);
      }
    })
  }



  private restoreDraftIfAvailable(): void {
    const latestDraft = this.getLatestDraft();
    if (!latestDraft) {
      return;
    }

    this.pendingDraftData = latestDraft.data;
    this.pendingDraftTimestamp = latestDraft.savedAt;
    this.draftRestored.set(true);
    this.lastAutoSave.set(latestDraft.savedAt);
  }

  applyDraft(): void {
    const draftData = this.pendingDraftData ?? this.getLatestDraft()?.data;
    if (!draftData) {
      return;
    }

    this.isRestoringDraft = true;
    this.employee.set({ ...this.employee(), ...draftData });
    this.lastSerializedEmployee = JSON.stringify(this.employee());
    this.draftRestored.set(false);
    this.pendingDraftData = null;
    if (this.pendingDraftTimestamp) {
      this.lastAutoSave.set(this.pendingDraftTimestamp);
    }
    this.pendingDraftTimestamp = null;
    
    setTimeout(() => {
      this.isRestoringDraft = false;
      this.recomputeChangeTracking();
    }, 150);
  }

  dismissDraft(): void {
    this.clearDraftsForAllTabs();
    this.draftRestored.set(false);
    this.pendingDraftData = null;
    this.pendingDraftTimestamp = null;
    this.lastAutoSave.set(null);
  }

  // Save workflow with confirmation
  saveWithConfirmation(): void {
    if (!this.changeSet().hasChanges) {
      this.saveSuccess.set(this.translate.instant('employees.profile.noChanges'));
      setTimeout(() => this.saveSuccess.set(null), 2000);
      return;
    }
    
    this.showConfirmDialog.set(true);
  }

  confirmSave(): void {
    this.showConfirmDialog.set(false);
    this.performSave();
  }

  private performSave(): void {
    if (!this.originalEmployee || !this.employeeId()) {
      return;
    }

    const patch = ChangeTracker.generatePatch(
      this.originalEmployee,
      this.employee(),
      ['id', 'photo', 'status', 'missingDocuments']
    );

    if (Object.keys(patch).length === 0) {
      this.saveSuccess.set(this.translate.instant('employees.profile.noChanges'));
      setTimeout(() => this.saveSuccess.set(null), 2000);
      this.resolveAfterSave(true);
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);

    this.employeeService.patchEmployeeProfile(this.employeeId()!, patch).subscribe({
      next: (response: EmployeeProfileModel) => {
        const merged = { ...this.originalEmployee!, ...patch, ...(response ?? {}) } as EmployeeProfileModel;
        this.handleSaveSuccess(merged);
      },
      error: (err: unknown) => {
        console.error('Failed to save employee', err);
        this.saveError.set(this.translate.instant('employees.profile.saveError') || 'Unable to save changes.');
        this.isSaving.set(false);
        this.announce('Save failed, draft preserved. You can retry.');
        this.resolveAfterSave(false);
      }
    });
  }

  // Navigation guard implementation
  canDeactivate(): Observable<boolean> {
    if (!this.changeSet().hasChanges) {
      return of(true);
    }
    
    return new Observable(observer => {
      this.pendingNavigationResolver = (result: boolean) => {
        observer.next(result);
        observer.complete();
      };
      this.showUnsavedDialog.set(true);
    });
  }

  // Unsaved changes dialog handlers
  onUnsavedDialogSave(): void {
    this.showUnsavedDialog.set(false);
    this.performSave();
  }

  onUnsavedDialogDiscard(): void {
    this.showUnsavedDialog.set(false);
    this.revertToOriginal();
    this.clearDraftsForAllTabs();
    this.resetChangeTracking();
    this.draftRestored.set(false);
    if (this.pendingCancel) {
      this.isEditMode.set(false);
    }
    this.resolveAfterSave(true);
  }

  onUnsavedDialogCancel(): void {
    this.showUnsavedDialog.set(false);
    this.resolveAfterSave(false);
  }

  cancel(): void {
    if (this.hasFormChanges()) {
      this.pendingCancel = true;
      this.showUnsavedDialog.set(true);
      return;
    }

    this.revertToOriginal();
    this.clearDraftsForAllTabs();
    this.resetChangeTracking();
    this.isEditMode.set(false);
    this.saveError.set(null);
    this.pendingTabTarget = null;
    this.pendingNavigationResolver = null;
    this.draftRestored.set(false);
    this.pendingCancel = false;
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  uploadDocument(event: any, documentType: string): void {
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

  hasFormChanges(): boolean {
    return this.changeSet().hasChanges;
  }

  onTabChange(nextTab: string | number | undefined): void {
    const targetTab = String(nextTab ?? this.activeTab());

    if (!this.isEditMode() || !this.hasFormChanges()) {
      this.activeTab.set(targetTab);
      return;
    }

    if (targetTab === this.activeTab()) {
      return;
    }

    this.pendingTabTarget = targetTab;
    this.showUnsavedDialog.set(true);
  }

  private handleSaveSuccess(updated: EmployeeProfileModel): void {
    this.originalEmployee = { ...updated };
    this.employee.set({ ...updated });
    this.lastSerializedEmployee = JSON.stringify(updated);
    this.resetChangeTracking();
    this.clearDraftsForAllTabs();
    this.isSaving.set(false);
    this.saveSuccess.set(this.translate.instant('employees.profile.saveSuccess'));
    this.isEditMode.set(false);
    this.draftRestored.set(false);
    this.pendingDraftData = null;
    this.pendingDraftTimestamp = null;
    this.announce('Profile saved successfully.');
    this.resolveAfterSave(true);

    setTimeout(() => this.saveSuccess.set(null), 3000);
  }

  private resolveAfterSave(success: boolean): void {
    if (success && this.pendingTabTarget) {
      this.activeTab.set(this.pendingTabTarget);
    }

    if (this.pendingNavigationResolver) {
      this.pendingNavigationResolver(success);
    }

    this.pendingTabTarget = null;
    this.pendingNavigationResolver = null;
    this.pendingCancel = false;
  }

  private revertToOriginal(): void {
    if (!this.originalEmployee) {
      return;
    }

    this.isRestoringDraft = true;
    this.employee.set({ ...this.originalEmployee });
    this.lastSerializedEmployee = JSON.stringify(this.originalEmployee);
    setTimeout(() => {
      this.isRestoringDraft = false;
    }, 100);
  }

  private resetChangeTracking(): void {
    this.changeSet.set(this.createEmptyChangeSet());
    this.tabChangeSets.set(this.createEmptyTabChangeSets());
  }

  private recomputeChangeTracking(): void {
    if (!this.originalEmployee || !this.isEditMode()) {
      return;
    }

    const changes = ChangeTracker.trackChanges(
      this.originalEmployee,
      this.employee(),
      this.FIELD_LABELS,
      ['id', 'photo', 'status', 'missingDocuments']
    );

    this.changeSet.set(changes);
    this.updateTabChangeSets(changes);
  }

  private updateTabChangeSets(changeSet: ChangeSet): void {
    const perTab = this.createEmptyTabChangeSets();

    changeSet.changes.forEach(change => {
      const tabId = this.getTabForField(change.field);
      const target = perTab[tabId];

      target.changes.push(change);
      target.modifiedFields.push(change.field);
      target.changeCount = target.changes.length;
      target.hasChanges = target.changeCount > 0;
    });

    this.tabChangeSets.set(perTab);
  }

  private getTabForField(field: string): string {
    return this.TAB_IDS.find(tabId => this.TAB_FIELD_MAP[tabId].includes(field as keyof EmployeeProfileModel)) ?? '0';
  }

  private createEmptyChangeSet(): ChangeSet {
    return { changes: [], hasChanges: false, modifiedFields: [], changeCount: 0 };
  }

  private createEmptyTabChangeSets(): Record<string, ChangeSet> {
    return this.TAB_IDS.reduce((acc, tabId) => {
      acc[tabId] = this.createEmptyChangeSet();
      return acc;
    }, {} as Record<string, ChangeSet>);
  }

  private saveDraftForTab(tabId: string): void {
    const id = this.employeeId();
    if (!id) {
      return;
    }

    const draftKey = this.getDraftKeyForTab(tabId);
    this.draftService.saveDraft(draftKey, id, this.employee());
  }

  private getDraftKeyForTab(tabId: string): string {
    return `${this.ENTITY_TYPE}_tab_${tabId}`;
  }

  private getLatestDraft(): { data: EmployeeProfileModel; savedAt: Date } | null {
    const id = this.employeeId();
    if (!id) {
      return null;
    }

    let latest: { data: EmployeeProfileModel; savedAt: Date } | null = null;

    this.TAB_IDS.forEach(tabId => {
      const draft = this.draftService.loadDraft<EmployeeProfileModel>(this.getDraftKeyForTab(tabId), id);
      if (draft) {
        const savedAt = new Date(draft.metadata.savedAt);
        if (!latest || savedAt > latest.savedAt) {
          latest = { data: draft.data, savedAt };
        }
      }
    });

    return latest;
  }

  private clearDraftsForAllTabs(): void {
    const id = this.employeeId();
    if (!id) {
      return;
    }

    this.TAB_IDS.forEach(tabId => {
      this.draftService.clearDraft(this.getDraftKeyForTab(tabId), id);
    });
  }

  private isDraftForCurrentEntity(key: string, id: string): boolean {
    return key.includes(`${this.ENTITY_TYPE}_tab_`) && key.endsWith(`_${id}`);
  }

  private announce(message: string): void {
    this.ariaMessage.set(message);
  }

  private createEmptyEmployee(): EmployeeProfileModel {
    return {
      id: '',
      firstName: '',
      lastName: '',
      photo: undefined,
      cin: '',
      maritalStatus: 'single',
      dateOfBirth: '',
      birthPlace: '',
      professionalEmail: '',
      personalEmail: '',
      phone: '',
      address: '',
      countryId: undefined,
      countryName: '',
      city: '',
      addressLine1: '',
      addressLine2: '',
      zipCode: '',
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
