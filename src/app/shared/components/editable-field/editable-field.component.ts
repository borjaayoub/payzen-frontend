import { Component, EventEmitter, Input, Output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-editable-field',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    TooltipModule
  ],
  template: `
    <div class="editable-field-container group relative flex items-center gap-2 min-h-[40px]">
      <!-- View Mode -->
      <div *ngIf="!isEditing()" 
           (click)="startEditing()"
           class="flex-1 py-2 px-3 rounded cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors flex items-center justify-between">
        <span [class.text-gray-400]="!value" class="text-gray-900">
          {{ value || emptyPlaceholder }}
        </span>
        <i class="pi pi-pencil text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
      </div>

      <!-- Edit Mode -->
      <div *ngIf="isEditing()" class="flex-1 flex items-center gap-2 animate-fade-in">
        <input 
          pInputText 
          [type]="type" 
          [(ngModel)]="tempValue" 
          (keydown.enter)="onSave()"
          (keydown.escape)="onCancel()"
          class="w-full p-inputtext-sm"
          [placeholder]="label"
          autoFocus
        />
        <div class="flex items-center gap-1">
          <button 
            pButton 
            icon="pi pi-check" 
            class="p-button-rounded p-button-text p-button-success p-button-sm w-8 h-8"
            (click)="onSave()"
            pTooltip="Save"
            tooltipPosition="top">
          </button>
          <button 
            pButton 
            icon="pi pi-times" 
            class="p-button-rounded p-button-text p-button-secondary p-button-sm w-8 h-8"
            (click)="onCancel()"
            pTooltip="Cancel"
            tooltipPosition="top">
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-2px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class EditableFieldComponent {
  @Input() value: string | number | null | undefined = '';
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() emptyPlaceholder: string = 'Click to edit';
  
  @Output() save = new EventEmitter<string | number>();
  @Output() cancel = new EventEmitter<void>();

  isEditing = signal(false);
  tempValue: string | number | null | undefined = '';

  startEditing() {
    this.tempValue = this.value;
    this.isEditing.set(true);
  }

  onSave() {
    if (this.tempValue !== this.value) {
      this.save.emit(this.tempValue!);
    } else {
      this.cancel.emit();
    }
    this.isEditing.set(false);
  }

  onCancel() {
    this.isEditing.set(false);
    this.cancel.emit();
  }
}
