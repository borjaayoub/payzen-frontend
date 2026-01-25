import { Component, Input, Optional, Self, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';

export type UiOption<T = any> = { label: string; value: T; disabled?: boolean };

@Component({
  selector: 'app-select-field, ui-select-field',
  standalone: true,
  imports: [CommonModule, SelectModule, FormsModule, AutoCompleteModule],
  templateUrl: './select-field.html',
  styleUrls: ['./select-field.css'],
})
export class SelectFieldComponent implements ControlValueAccessor {
  // New API (preferred)
  @Input() id?: string;
  @Input() label = '';
  @Input() hint: string | null = null;
  @Input() error: string | null = null;
  @Input() required = false;
  @Input() optionalText: string | null = null;

  // Old API (backward compatibility)
  @Input() inputId?: string;
  @Input() requiredMark = false;
  @Input() hideLabel = false;
  @Input() description?: string;
  @Input() showErrors = true;
  @Input() errorMessages?: Record<string, any>;
  @Input() ariaLabel?: string;
  @Input() variant: 'select' | 'autocomplete' = 'select';
  @Input() appendTo: any = 'body';
  @Input() creatable = false;
  @Input() createLabel = 'Create';

  // Common
  @Input() options: any[] = [];
  @Input() optionLabel = 'label';
  @Input() optionValue: string | null = 'value';
  @Input() optionDisabled?: string;
  @Input() placeholder = '';
  @Input() disabled = false;

  // New API naming
  @Input() filterable = false;
  @Input() clearable = true;

  // Old API naming (aliases)
  @Input() 
  set filter(val: boolean) { this.filterable = val; }
  get filter() { return this.filterable; }

  @Input()
  set showClear(val: boolean) { this.clearable = val; }
  get showClear() { return this.clearable; }

  // Advanced features
  @Input() filterBy: string | undefined = undefined;
  @Input() filterAriaLabel: string | null = null;
  @Input() loading = false;
  @Input() virtualScroll = false;
  @Input() virtualScrollItemSize = 32;

  @Output() create = new EventEmitter<string>();
  @Output() searchQuery = new EventEmitter<string>();

  // State
  value: any = null;
  filteredOptions: any[] = [];
  private readonly uid = `select-${Math.random().toString(36).slice(2, 8)}`;

  // CVA
  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // Computed properties for backward compatibility
  get resolvedId(): string {
    return this.id || this.inputId || this.uid;
  }

  get resolvedInputId(): string {
    return this.resolvedId;
  }

  get ariaInvalid(): string | null {
    return this.invalid ? 'true' : null;
  }

  get errorList(): string[] {
    const err = this.computedError;
    return err ? [err] : [];
  }

  get resolvedRequired(): boolean {
    return this.required || this.requiredMark;
  }

  get resolvedHint(): string | null {
    return this.hint || this.description || null;
  }

  get resolvedPlaceholder(): string {
    return this.placeholder || 'Select…';
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
    if (!this.showErrors || !this.invalid || !this.control?.errors) return null;
    
    const errors = this.control.errors;
    const errorKey = Object.keys(errors)[0];
    const errorMap: Record<string, string> = {
      required: 'This field is required',
      ...this.errorMessages
    };
    
    return errorMap[errorKey] || 'Invalid value';
  }

  writeValue(v: any): void {
    this.value = v ?? null;
  }

  registerOnChange(fn: (v: any) => void): void {
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

  onPrimeChange(v: any): void {
    this.value = v;
    this.onChange(v);
  }

  search(event: any): void {
    const query = event.query.toLowerCase().trim();
    this.searchQuery.emit(query);
    
    this.filteredOptions = this.options.filter((option) => {
      const label = option[this.optionLabel];
      return label && label.toString().toLowerCase().includes(query);
    });
  }

  onSelect(event: any): void {
    const selected = event.value;
    let val = selected;
    if (this.optionValue) {
      val = selected[this.optionValue];
    }
    this.onChange(val);
  }

  onClear(): void {
    this.value = null;
    this.onChange(null);
  }
}
