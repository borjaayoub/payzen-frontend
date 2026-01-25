import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-field-shell',
  standalone: true,
  template: `
    <div class="w-full">
      <div class="flex items-baseline justify-between gap-2">
        <label
          class="text-sm font-medium"
          [attr.for]="controlId"
          [attr.id]="labelId"
        >
          {{ label }}
          @if (required) {
            <span class="ml-1 text-sm" aria-hidden="true">*</span>
            <span class="sr-only">Required</span>
          }
        </label>

        @if (optionalText && !required) {
          <span class="text-xs opacity-70">{{ optionalText }}</span>
        }
      </div>

      <div class="mt-1">
        <ng-content />
      </div>

      @if (hint) {
        <p class="mt-1 text-xs opacity-70" [id]="hintId">
          {{ hint }}
        </p>
      }

      @if (error) {
        <p class="mt-1 text-xs text-red-600" [id]="errorId" role="alert">
          {{ error }}
        </p>
      }
    </div>
  `,
})
export class UiFieldShellComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) controlId!: string;

  @Input() required = false;
  @Input() optionalText: string | null = 'Optional';

  @Input() hint: string | null = null;
  @Input() error: string | null = null;

  get labelId() {
    return `${this.controlId}-label`;
  }
  get hintId() {
    return `${this.controlId}-hint`;
  }
  get errorId() {
    return `${this.controlId}-error`;
  }
}
