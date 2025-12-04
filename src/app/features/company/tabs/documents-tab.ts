import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

interface CompanyDocument {
  id: string;
  name: string;
  type: 'cnss' | 'amo' | 'logo' | 'rib';
  fileName?: string;
  uploadDate?: string;
  fileSize?: number;
  url?: string;
  versions?: DocumentVersion[];
}

interface DocumentVersion {
  id: string;
  fileName: string;
  uploadDate: string;
  fileSize: number;
  url: string;
}

@Component({
  selector: 'app-documents-tab',
  imports: [
    TranslateModule,
    FileUploadModule,
    ButtonModule,
    TagModule,
    DialogModule
  ],
  templateUrl: './documents-tab.html'
})
export class DocumentsTab {
  readonly showPreviewDialog = signal(false);
  readonly selectedDocument = signal<CompanyDocument | null>(null);

  readonly documents = signal<CompanyDocument[]>([
    {
      id: '1',
      name: 'Attestation CNSS',
      type: 'cnss',
      fileName: 'attestation-cnss-2025.pdf',
      uploadDate: '2025-01-15',
      fileSize: 245000,
      url: '/documents/attestation-cnss-2025.pdf',
      versions: [
        {
          id: 'v1',
          fileName: 'attestation-cnss-2024.pdf',
          uploadDate: '2024-01-10',
          fileSize: 230000,
          url: '/documents/attestation-cnss-2024.pdf'
        }
      ]
    },
    {
      id: '2',
      name: 'Attestation AMO',
      type: 'amo',
      fileName: 'attestation-amo-2025.pdf',
      uploadDate: '2025-01-15',
      fileSize: 180000,
      url: '/documents/attestation-amo-2025.pdf'
    },
    {
      id: '3',
      name: 'Logo Entreprise',
      type: 'logo',
      fileName: 'logo.png',
      uploadDate: '2024-12-01',
      fileSize: 45000,
      url: '/documents/logo.png'
    },
    {
      id: '4',
      name: 'RIB Entreprise',
      type: 'rib'
    }
  ]);

  onUpload(event: any, docType: string) {
    // TODO: Handle file upload to server
    console.log('Upload for:', docType, event.files);
  }

  downloadDocument(doc: CompanyDocument) {
    if (doc.url) {
      // TODO: Download file
      console.log('Download:', doc.url);
    }
  }

  viewDocument(doc: CompanyDocument) {
    if (doc.url) {
      this.selectedDocument.set(doc);
      this.showPreviewDialog.set(true);
    }
  }

  deleteVersion(doc: CompanyDocument, versionId: string) {
    // TODO: Delete old version
    console.log('Delete version:', versionId, 'from', doc.id);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-MA');
  }

  getDocumentIcon(type: string): string {
    const iconMap: Record<string, string> = {
      cnss: 'pi-file-pdf',
      amo: 'pi-file-pdf',
      logo: 'pi-image',
      rib: 'pi-file'
    };
    return iconMap[type] || 'pi-file';
  }
}
