# i18n Quick Start Guide

## For Developers: Adding Translations to Your Components

### Step 1: Import TranslateModule

In your component TypeScript file:

```typescript
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-my-component',
  imports: [TranslateModule],  // Add this
  templateUrl: './my-component.html',
})
export class MyComponent {}
```

### Step 2: Add Translation Keys

Add your keys to all three translation files:

**`src/assets/i18n/en.json`**
```json
{
  "myFeature": {
    "title": "My Feature",
    "button": "Click Me"
  }
}
```

**`src/assets/i18n/ar.json`**
```json
{
  "myFeature": {
    "title": "ميزتي",
    "button": "انقر هنا"
  }
}
```

**`src/assets/i18n/fr.json`**
```json
{
  "myFeature": {
    "title": "Ma Fonctionnalité",
    "button": "Cliquez Ici"
  }
}
```

### Step 3: Use in Template

In your HTML template:

```html
<h1>{{ 'myFeature.title' | translate }}</h1>
<button>{{ 'myFeature.button' | translate }}</button>
```

## Common Translation Patterns

### Basic Text

```html
<p>{{ 'common.loading' | translate }}</p>
```

### With Parameters

```html
<!-- In template -->
<p>{{ 'welcome.message' | translate: {name: userName} }}</p>

<!-- In translation file -->
{
  "welcome": {
    "message": "Welcome, {{name}}!"
  }
}
```

### In Attributes

```html
<input [placeholder]="'auth.login.username' | translate">
<button [attr.aria-label]="'common.save' | translate">
  {{ 'common.save' | translate }}
</button>
```

### Dynamic Content

```typescript
import { Component, inject } from '@angular/core';
import { LanguageService } from '@shared/utils/language.service';

export class MyComponent {
  private languageService = inject(LanguageService);

  showMessage(): void {
    const message = this.languageService.instant('common.success');
    alert(message);
  }
}
```

## Available Translation Keys

### App
- `app.name` - Application name
- `app.country` - Country name

### Navigation
- `nav.mainMenu` - Main menu
- `nav.dashboard` - Dashboard
- `nav.company` - Company
- `nav.employees` - Employees
- `nav.payroll` - Payroll
- `nav.reports` - Reports

### Authentication
- `auth.login.title` - Login title
- `auth.login.username` - Username label
- `auth.login.password` - Password label
- `auth.login.submit` - Submit button
- `auth.logout` - Logout button

### Common Actions
- `common.save` - Save
- `common.cancel` - Cancel
- `common.delete` - Delete
- `common.edit` - Edit
- `common.add` - Add
- `common.search` - Search
- `common.filter` - Filter
- `common.export` - Export
- `common.import` - Import
- `common.loading` - Loading message
- `common.noData` - No data message
- `common.error` - Error message
- `common.success` - Success message
- `common.confirm` - Confirm
- `common.close` - Close
- `common.yes` - Yes
- `common.no` - No
- `common.actions` - Actions

### Languages
- `language.select` - Select language label
- `language.en` - English
- `language.ar` - Arabic
- `language.fr` - French

## Changing Language Programmatically

```typescript
import { Component, inject } from '@angular/core';
import { LanguageService } from '@shared/utils/language.service';

export class MyComponent {
  private languageService = inject(LanguageService);

  switchToEnglish(): void {
    this.languageService.setLanguage('en');
  }

  switchToArabic(): void {
    this.languageService.setLanguage('ar');
  }

  switchToFrench(): void {
    this.languageService.setLanguage('fr');
  }

  getCurrentLanguage(): string {
    return this.languageService.getCurrentLanguage();
  }
}
```

## Tips

1. ✅ **Always use translation keys** - Never hardcode text in templates
2. ✅ **Keep keys organized** - Use dot notation to group related translations
3. ✅ **Add to all files** - Make sure all three language files have the same keys
4. ✅ **Test all languages** - Use the language switcher to verify translations
5. ✅ **Use meaningful names** - Make translation keys descriptive and clear

## Need Help?

- Check `docs/I18N_IMPLEMENTATION.md` for detailed documentation
- Look at existing components (sidebar, login) for examples
- All translation files are in `src/assets/i18n/`

