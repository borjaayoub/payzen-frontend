// Primary exports
export { InputFieldComponent } from './input-field';
export { SelectFieldComponent } from './select-field';
export { UiFieldShellComponent } from './ui-field-shell.component';

// Type exports
export type { UiOption } from './select-field';

// Backwards compatibility exports (ui- prefix)
export { InputFieldComponent as UiInputFieldComponent } from './input-field';
export { SelectFieldComponent as UiSelectFieldComponent } from './select-field';

// Also export with app- prefix for existing code
export { InputFieldComponent as AppInputFieldComponent } from './input-field';
export { SelectFieldComponent as AppSelectFieldComponent } from './select-field';
