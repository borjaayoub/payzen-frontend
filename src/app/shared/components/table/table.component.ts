import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { EmptyState } from '../empty-state/empty-state';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  customTemplate?: boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, TableModule, EmptyState],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() isLoading: boolean = false;
  @Input() loadingMessage: string = 'Loading data...';
  @Input() emptyTitle: string = 'No data';
  @Input() emptyDescription: string = 'There is no data to display';
  @Input() emptyIcon: string = 'pi pi-inbox';
  @Input() minWidth: string = '50rem';
  @Input() styleClass: string = 'p-datatable-sm';
  
  @Output() rowClick = new EventEmitter<any>();
  
  // Content child for custom cell templates
  @ContentChild('cellTemplate', { static: false }) cellTemplate?: TemplateRef<any>;
  @ContentChild('emptyStateActions', { static: false }) emptyStateActions?: TemplateRef<any>;

  onRowClick(rowData: any): void {
    this.rowClick.emit(rowData);
  }

  getCellValue(rowData: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], rowData);
  }
}
