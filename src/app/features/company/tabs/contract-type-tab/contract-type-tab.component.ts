import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContractTypeService } from '../../../../core/services/contract-type.service';
import { CompanyContextService } from '../../../../core/services/companyContext.service';
import { ContractType } from '../../../../core/models/contract-type.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-contract-type-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './contract-type-tab.component.html',
})
export class ContractTypeTabComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contractTypeService = inject(ContractTypeService);
  private contextService = inject(CompanyContextService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  // Signals
  contractTypes = signal<ContractType[]>([]);
  loading = signal(false);
  dialogVisible = signal(false);
  submitLoading = signal(false);
  
  // Form
  contractTypeForm!: FormGroup;
  isEditMode = false;
  currentContractTypeId: number | null = null;

  ngOnInit() {
    this.initForm();
    this.loadContractTypes();
  }

  private initForm() {
    this.contractTypeForm = this.fb.group({
      contractTypeName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  loadContractTypes() {
    const companyId = this.contextService.companyId();
    if (!companyId) return;

    this.loading.set(true);
    this.contractTypeService.getByCompany(Number(companyId)).subscribe({
      next: (data) => {
        this.contractTypes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading contract types', err);
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load contract types' });
      }
    });
  }

  openCreateDialog() {
    this.isEditMode = false;
    this.currentContractTypeId = null;
    this.contractTypeForm.reset();
    this.dialogVisible.set(true);
  }

  openEditDialog(contractType: ContractType) {
    this.isEditMode = true;
    this.currentContractTypeId = contractType.id;
    this.contractTypeForm.patchValue({
      contractTypeName: contractType.contractTypeName
    });
    this.dialogVisible.set(true);
  }

  saveContractType() {
    if (this.contractTypeForm.invalid) {
      this.contractTypeForm.markAllAsTouched();
      return;
    }

    const companyId = this.contextService.companyId();
    if (!companyId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Company ID not found' });
      return;
    }

    this.submitLoading.set(true);

    if (this.isEditMode && this.currentContractTypeId) {
      // Update only needs the name
      const updatePayload = {
        ContractTypeName: this.contractTypeForm.value.contractTypeName
      };

      this.contractTypeService.update(this.currentContractTypeId, updatePayload).subscribe({
        next: () => {
          this.submitLoading.set(false);
          this.dialogVisible.set(false);
          this.loadContractTypes();
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Contract type updated' 
          });
        },
        error: (err: HttpErrorResponse) => {
          this.submitLoading.set(false);
          this.handleError(err);
        }
      });
    } else {
      // Create needs name and company ID
      const createPayload = {
        ContractTypeName: this.contractTypeForm.value.contractTypeName,
        CompanyId: Number(companyId)
      };

      this.contractTypeService.create(createPayload).subscribe({
        next: () => {
          this.submitLoading.set(false);
          this.dialogVisible.set(false);
          this.loadContractTypes();
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Contract type created' 
          });
        },
        error: (err: HttpErrorResponse) => {
          this.submitLoading.set(false);
          this.handleError(err);
        }
      });
    }
  }

  confirmDelete(contractType: ContractType) {
    this.confirmationService.confirm({
      message: this.translate.instant('company.contractTypes.deleteConfirm'),
      header: this.translate.instant('common.confirmation'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteContractType(contractType.id);
      }
    });
  }

  private deleteContractType(id: number) {
    this.contractTypeService.delete(id).subscribe({
      next: () => {
        this.loadContractTypes();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Contract type deleted' });
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err);
      }
    });
  }

  private handleError(err: HttpErrorResponse) {
    let detail = 'An error occurred';
    
    if (err.status === 409) {
      detail = 'Contract type name already exists in this company';
    } else if (err.status === 400) {
      // Often used for validation or "cannot delete because used"
      detail = err.error?.message || err.error?.title || 'Invalid request or contract type is in use by employees';
    } else if (err.status === 403) {
      detail = 'Access denied';
    } else if (err.status === 404) {
      detail = 'Resource not found';
    }

    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
