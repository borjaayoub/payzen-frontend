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
import { JobPositionService } from '../../../core/services/job-position.service';
import { CompanyContextService } from '../../../core/services/companyContext.service';
import { JobPosition } from '../../../core/models/job-position.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-job-position-tab',
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
  templateUrl: './job-position-tab.component.html',
})
export class JobPositionTabComponent implements OnInit {
  private fb = inject(FormBuilder);
  private jobPositionService = inject(JobPositionService);
  private contextService = inject(CompanyContextService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  // Signals
  jobPositions = signal<JobPosition[]>([]);
  loading = signal(false);
  dialogVisible = signal(false);
  submitLoading = signal(false);
  
  // Form
  jobPositionForm!: FormGroup;
  isEditMode = false;
  currentJobPositionId: number | null = null;

  ngOnInit() {
    this.initForm();
    this.loadJobPositions();
  }

  private initForm() {
    this.jobPositionForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]]
    });
  }

  loadJobPositions() {
    const companyId = this.contextService.companyId();
    if (!companyId) return;

    this.loading.set(true);
    this.jobPositionService.getByCompany(Number(companyId)).subscribe({
      next: (data) => {
        this.jobPositions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading job positions', err);
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load job positions' });
      }
    });
  }

  openCreateDialog() {
    this.isEditMode = false;
    this.currentJobPositionId = null;
    this.jobPositionForm.reset();
    this.dialogVisible.set(true);
  }

  openEditDialog(jobPosition: JobPosition) {
    this.isEditMode = true;
    this.currentJobPositionId = jobPosition.id;
    this.jobPositionForm.patchValue({
      name: jobPosition.name
    });
    this.dialogVisible.set(true);
  }

  saveJobPosition() {
    if (this.jobPositionForm.invalid) {
      this.jobPositionForm.markAllAsTouched();
      return;
    }

    const companyId = this.contextService.companyId();
    if (!companyId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Company ID not found' });
      return;
    }

    this.submitLoading.set(true);
    const payload = {
      Name: this.jobPositionForm.value.name,
      CompanyId: this.isEditMode ? undefined : Number(companyId)
    };

    const request = this.isEditMode && this.currentJobPositionId
      ? this.jobPositionService.update(this.currentJobPositionId, payload)
      : this.jobPositionService.create({ ...payload, CompanyId: Number(companyId) });

    request.subscribe({
      next: (res) => {
        this.submitLoading.set(false);
        this.dialogVisible.set(false);
        this.loadJobPositions();
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: this.isEditMode ? 'Job position updated' : 'Job position created' 
        });
      },
      error: (err: HttpErrorResponse) => {
        this.submitLoading.set(false);
        this.handleError(err);
      }
    });
  }

  confirmDelete(jobPosition: JobPosition) {
    this.confirmationService.confirm({
      message: this.translate.instant('Are you sure you want to delete this job position?'),
      header: this.translate.instant('Confirmation'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteJobPosition(jobPosition.id);
      }
    });
  }

  private deleteJobPosition(id: number) {
    this.jobPositionService.delete(id).subscribe({
      next: () => {
        this.loadJobPositions();
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Job position deleted' });
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err);
      }
    });
  }

  private handleError(err: HttpErrorResponse) {
    let detail = 'An error occurred';
    
    if (err.status === 409) {
      detail = 'Job position name already exists in this company';
    } else if (err.status === 400) {
      detail = err.error?.title || err.error?.message || 'Invalid request or resource in use';
    } else if (err.status === 403) {
      detail = 'Access denied';
    } else if (err.status === 404) {
      detail = 'Resource not found';
    }

    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
