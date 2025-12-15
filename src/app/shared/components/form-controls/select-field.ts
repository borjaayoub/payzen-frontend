import { CommonModule } from '@angular/common';
import { Component, Input, Optional, Self } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ErrorMessageResolver } from './input-field';

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SelectModule],
  templateUrl: './select-field.html',
  styleUrls: ['./select-field.css'],
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint?: string;
  @Input() description?: string;
  @Input() requiredMark = false;
  @Input() hideLabel = false;
  @Input() filter = true;
  @Input() showClear = true;
  @Input() appendTo: any = 'body';
  @Input() optionLabel = 'label';
  @Input() optionValue?: string;
  @Input() optionDisabled?: string;
  @Input() options: any[] = [];
  @Input() disabled = false;
  @Input() showErrors = true;
  @Input() errorMessages?: Record<string, ErrorMessageResolver>;
  @Input() inputId?: string;
  @Input() ariaLabel?: string;

  value: any = null;
  private readonly uid = `select-${Math.random().toString(36).slice(2, 8)}`;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  private readonly defaultErrorMap: Record<string, (error: any) => string> = {
    required: () => 'This field is required',
  };

  get control(): AbstractControl | null {
    return this.ngControl?.control ?? null;
  }

  get invalid(): boolean {
    const control = this.control;
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get ariaInvalid(): string | null {
    return this.invalid ? 'true' : null;
  }

  get errorList(): string[] {
    if (!this.showErrors || !this.invalid) {
      return [];
    }

    const control = this.control;
    if (!control?.errors) {
      return [];
    }

    const merged = { ...this.defaultErrorMap };
    if (this.errorMessages) {
      Object.entries(this.errorMessages).forEach(([key, resolver]) => {
        merged[key] = typeof resolver === 'function' ? resolver : () => resolver;
      });
    }

    return Object.keys(control.errors).map((key) => {
      const resolver = merged[key];
      if (resolver) {
        return resolver(control.errors?.[key]);
      }
      return 'Invalid value';
    });
  }

  writeValue(value: any): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(value: any): void {
    this.value = value;
    this.onChange(value);
  }

  handleBlur(): void {
    this.onTouched();
  }

  get resolvedInputId(): string {
    return this.inputId || this.uid;
  }
}
