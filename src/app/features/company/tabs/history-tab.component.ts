import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { CompanyService } from '@app/core/services/company.service';
import { CompanyEvent } from '@app/core/models/company.model';

@Component({
  selector: 'app-history-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TimelineModule,
    ButtonModule
  ],
  templateUrl: './history-tab.component.html'
})
export class HistoryTabComponent implements OnInit {
  private readonly companyService = inject(CompanyService);

  // State
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly history = signal<CompanyEvent[]>([]);

  // Computed properties
  readonly hasHistory = computed(() => this.history().length > 0);

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    this.companyService.getCompanyHistory().subscribe({
      next: (events) => {
        this.history.set(events);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load company history:', err);
        this.error.set('Failed to load history');
        this.loading.set(false);
      }
    });
  }

  getEventIcon(type: string): string {
    const iconMap: Record<string, string> = {
      company_created: 'pi pi-building',
      settings_updated: 'pi pi-cog',
      document_uploaded: 'pi pi-file',
      user_added: 'pi pi-user-plus',
      user_removed: 'pi pi-user-minus',
      info_updated: 'pi pi-pencil',
      logo_changed: 'pi pi-image',
      payment_settings: 'pi pi-credit-card'
    };
    return iconMap[type] || 'pi pi-circle';
  }

  getEventColor(type: string): string {
    const colorMap: Record<string, string> = {
      company_created: 'text-blue-600',
      settings_updated: 'text-purple-600',
      document_uploaded: 'text-green-600',
      user_added: 'text-teal-600',
      user_removed: 'text-red-600',
      info_updated: 'text-orange-600',
      logo_changed: 'text-pink-600',
      payment_settings: 'text-indigo-600'
    };
    return colorMap[type] || 'text-gray-600';
  }
}
