import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CompanyService } from '@app/core/services/company.service';
import { Company, CompanyDocuments } from '@app/core/models/company.model';

interface DocumentRow {
  name: string;
  type: string;
  url: string | null;
  status: 'uploaded' | 'missing';
  date?: Date;
}

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    FileUploadModule,
    InputTextModule,
    ToastModule,
    TagModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './documents-tab.component.html'
})
export class DocumentsTabComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private messageService = inject(MessageService);

  signatoryForm!: FormGroup;
  documents = signal<DocumentRow[]>([]);
  loading = signal<boolean>(false);
  signatureUrl = signal<string | null>(null);
  stampUrl = signal<string | null>(null);
  selectedDocType = signal<string | null>(null);

  ngOnInit() {
    this.initForm();
    this.loadData();
  }

  private initForm() {
    this.signatoryForm = this.fb.group({
      signatoryName: ['', Validators.required],
      signatoryTitle: ['', Validators.required]
    });
  }

  loadData() {
    this.loading.set(true);
    this.companyService.getCompany().subscribe({
      next: (company) => {
        this.documents.set(this.mapDocuments(company.documents));
        
        // Mock signatory data loading (assuming it exists in company model or extended)
        if ((company as any).signatory) {
            this.signatoryForm.patchValue({
                signatoryName: (company as any).signatory.name,
                signatoryTitle: (company as any).signatory.title
            });
            this.signatureUrl.set((company as any).signatory.signatureUrl);
            this.stampUrl.set((company as any).signatory.stampUrl);
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private mapDocuments(docs: CompanyDocuments): DocumentRow[] {
    // Define expected documents
    const expectedDocs = [
      { key: 'cnss_attestation', label: 'Attestation CNSS' },
      { key: 'amo', label: 'Attestation AMO' },
      { key: 'rib', label: 'RIB Bancaire' },
      { key: 'rc', label: 'Registre de Commerce' }, // Assuming these might exist in 'other' or extended model
      { key: 'patente', label: 'Patente' }
    ];

    return expectedDocs.map(doc => {
      // Check if document exists in the typed object or in 'other' (simplified logic)
      // In a real app, we'd have a more robust mapping or list from backend
      const url = (docs as any)[doc.key]; 
      return {
        name: doc.label,
        type: doc.key,
        url: url || null,
        status: url ? 'uploaded' : 'missing',
        date: url ? new Date() : undefined // Mock date
      };
    });
  }

  onUploadSignature(event: any) {
    const file = event.files[0];
    // Mock upload
    const reader = new FileReader();
    reader.onload = (e: any) => this.signatureUrl.set(e.target.result);
    reader.readAsDataURL(file);
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Signature uploaded' });
  }

  onUploadStamp(event: any) {
    const file = event.files[0];
    // Mock upload
    const reader = new FileReader();
    reader.onload = (e: any) => this.stampUrl.set(e.target.result);
    reader.readAsDataURL(file);
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Stamp uploaded' });
  }

  onSubmit() {
    if (this.signatoryForm.invalid) return;
    this.loading.set(true);
    // Mock save
    setTimeout(() => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Signatory info saved' });
    }, 1000);
  }

  onDocumentUpload(event: any) {
    this.documents.update(docs => {
      return docs.map(d => {
        if (d.type === this.selectedDocType()) {
          return { ...d, status: 'uploaded', url: 'mock-url.pdf', date: new Date() };
        }
        return d;
      });
    });
  }

  download(doc: DocumentRow) {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  }
}

