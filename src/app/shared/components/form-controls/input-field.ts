import { Component, Input, Optional, Self, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
@Component({
  selector: 'app-input-field, ui-input-field',
  standalone: true,
  imports: [CommonModule, InputTextModule, IconFieldModule, InputIconModule],
  templateUrl: './input-field.html',
  styleUrls: ['./input-field.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent implements ControlValueAccessor {
  // New API (preferred)
  @Input() id?: string;
  @Input() label = '';
  @Input() hint: string | null = null;
  @Input() error: string | null = null;
  @Input() required = false;
  @Input() optionalText: string | null = null;
  @Input() ariaLabel?: string;
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() errorMessages?: Record<string, string>;

  // Common
  @Input() type: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'date' = 'text';
  @Input() placeholder = '';
  @Input() autocomplete?: string;
  @Input() disabled = false;

  // New API features
  @Input() inputMode: string | null = null;
  @Input() clearable = false;
  @Input() readonly = false;
  @Input() showCounter = false;
  @Input() maxLength: number | null = null;

  // State
  value: string | number | null = '';
  private readonly uid: string;

  // CVA
  private onChange: (v: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    this.uid = `input-${Math.random().toString(36).slice(2, 8)}`;
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // Computed properties
  get resolvedId(): string {
    return this.id || this.uid;
  }

  get resolvedInputId(): string {
    return this.resolvedId;
  }

  get ariaDescribedBy(): string | null {
    const ids: string[] = [];
    if (this.hint) ids.push(`${this.resolvedId}-hint`);
    if (this.computedError) ids.push(`${this.resolvedId}-error`);
    return ids.length > 0 ? ids.join(' ') : null;
  }

  get ariaInvalid(): string | null {
    return this.invalid ? 'true' : null;
  }

  get errorList(): string[] {
    const err = this.computedError;
    return err ? [err] : [];
  }

  get control() {
    return this.ngControl?.control ?? null;
  }

  get invalid(): boolean {
    const control = this.control;
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get computedError(): string | null {
    if (this.error) return this.error;
    if (!this.invalid || !this.control?.errors) return null;
    
    const errors = this.control.errors;
    const errorKey = Object.keys(errors)[0];
    const errorValue = errors[errorKey];
    
    // Check custom error messages first
    if (this.errorMessages?.[errorKey]) {
      return this.errorMessages[errorKey];
    }
    
    // Default error messages with dynamic values
    switch (errorKey) {
      case 'required':
        return 'This field is required';
      case 'email':
        return 'Enter a valid email address';
      case 'minlength':
        return `Minimum ${errorValue?.requiredLength || 0} characters required`;
      case 'maxlength':
        return `Maximum ${errorValue?.requiredLength || 0} characters allowed`;
      case 'min':
        return `Value must be at least ${errorValue?.min || 0}`;
      case 'max':
        return `Value must be at most ${errorValue?.max || 0}`;
      case 'pattern':
        return 'Invalid format';
      default:
        return 'Invalid value';
    }
  }

  writeValue(v: string | number | null): void {
    this.value = v ?? '';
  }

  registerOnChange(fn: (v: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(value: string): void {
    let parsed: string | number | null;
    if (this.type === 'number') {
      parsed = value === '' ? null : Number(value);
      // Keep NaN as null for cleaner handling
      if (Number.isNaN(parsed)) {
        parsed = null;
      }
    } else {
      parsed = value;
    }
    this.value = parsed ?? '';
    this.onChange(parsed);
  }

  handleBlur(): void {
    this.onTouched();
  }

  clear(): void {
    this.value = '';
    this.onChange('');
    this.onTouched();
  }
}
