# PayZen i18n Implementation Guide

## Overview

This document describes the internationalization (i18n) implementation in the PayZen frontend application using `@ngx-translate/core`.

## Features

- ✅ Multi-language support (English, Spanish, French)
- ✅ Dynamic language switching without page reload
- ✅ Persistent language selection (localStorage)
- ✅ Browser language detection
- ✅ Language switcher component in header
- ✅ Translation pipe for templates
- ✅ Translation service for TypeScript code

## Supported Languages

| Language | Code | Flag |
|----------|------|------|
| English  | `en` | 🇬🇧   |
| Arabic   | `ar` | 🇲🇦   |
| French   | `fr` | 🇫🇷   |

**Default Language:** French (`fr`)

## File Structure

```
src/
├── app/
│   ├── app.config.ts                          # i18n configuration
│   ├── shared/
│   │   ├── utils/
│   │   │   ├── translation.config.ts          # Translation constants & factory
│   │   │   └── language.service.ts            # Language management service
│   │   └── components/
│   │       └── header/
│   │           ├── header.ts                  # Header with language switcher
│   │           └── header.html
└── assets/
    └── i18n/
        ├── en.json                            # English translations
        ├── ar.json                            # Arabic translations
        └── fr.json                            # French translations
```

## Installation

The following packages are already installed:

```bash
npm install @ngx-translate/core @ngx-translate/http-loader
```

## Configuration

### 1. App Configuration (`app.config.ts`)

The i18n module is configured in the application config:

```typescript
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from './shared/utils/translation.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'fr',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ],
};
```

### 2. Translation Configuration (`translation.config.ts`)

Contains the HTTP loader factory and language constants:

```typescript
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const AVAILABLE_LANGUAGES = ['en', 'ar', 'fr'] as const;
export const DEFAULT_LANGUAGE: Language = 'fr';
```

### 3. Language Service (`language.service.ts`)

Provides methods for language management:

- `setLanguage(lang: Language)` - Change the current language
- `getCurrentLanguage()` - Get the current language
- `translate$(key: string)` - Get observable translation
- `instant(key: string)` - Get instant translation

## Usage

### In Templates (HTML)

Use the `translate` pipe:

```html
<!-- Simple translation -->
<h1>{{ 'app.name' | translate }}</h1>

<!-- With parameters -->
<p>{{ 'welcome.message' | translate: {name: userName} }}</p>

<!-- In attributes -->
<button [attr.aria-label]="'common.save' | translate">
  {{ 'common.save' | translate }}
</button>
```

### In Components (TypeScript)

Import `TranslateModule` and use the service:

```typescript
import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from './shared/utils/language.service';

@Component({
  selector: 'app-example',
  imports: [TranslateModule],
  template: `<h1>{{ 'title' | translate }}</h1>`
})
export class ExampleComponent {
  private languageService = inject(LanguageService);

  // Get instant translation
  getTitle(): string {
    return this.languageService.instant('title');
  }

  // Change language
  switchToEnglish(): void {
    this.languageService.setLanguage('en');
  }
}
```

### Language Switcher Component

The header component includes a language switcher dropdown:

```typescript
// In header.ts
onLanguageChange(event: any): void {
  const newLang = event.value as Language;
  this.languageService.setLanguage(newLang);
}
```

## Translation Files

Translation files are located in `src/assets/i18n/` and follow a nested structure:

### Example Structure (`en.json`)

```json
{
  "app": {
    "name": "PayZen",
    "country": "MOROCCO"
  },
  "nav": {
    "mainMenu": "Main Menu",
    "dashboard": "Dashboard",
    "company": "Company",
    "employees": "Employees",
    "payroll": "Payroll",
    "reports": "Reports"
  },
  "auth": {
    "login": {
      "title": "Login",
      "username": "Username",
      "password": "Password",
      "submit": "Sign In"
    },
    "logout": "Logout"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

## Adding New Translations

### 1. Add Translation Keys

Add the new keys to all translation files (`en.json`, `ar.json`, `fr.json`):

```json
{
  "newFeature": {
    "title": "New Feature Title",
    "description": "Feature description"
  }
}
```

### 2. Use in Templates

```html
<h2>{{ 'newFeature.title' | translate }}</h2>
<p>{{ 'newFeature.description' | translate }}</p>
```

## Adding New Languages

### 1. Create Translation File

Create a new JSON file in `src/assets/i18n/` (e.g., `de.json` for German).

### 2. Update Configuration

Update `translation.config.ts`:

```typescript
export const AVAILABLE_LANGUAGES = ['en', 'ar', 'fr', 'de'] as const;
```

### 3. Update Language Switcher

Update the languages array in `header.ts`:

```typescript
languages: LanguageOption[] = [
  { label: 'English', value: 'en', flag: '🇬🇧' },
  { label: 'العربية', value: 'ar', flag: '🇲🇦' },
  { label: 'Français', value: 'fr', flag: '🇫🇷' },
  { label: 'Deutsch', value: 'de', flag: '🇩🇪' }
];
```

## Best Practices

1. **Consistent Key Naming**: Use dot notation for nested keys (e.g., `auth.login.title`)
2. **Avoid Hardcoded Text**: Always use translation keys instead of hardcoded strings
3. **Complete Translations**: Ensure all translation files have the same keys
4. **Contextual Keys**: Group related translations together (e.g., all auth-related keys under `auth`)
5. **Fallback**: The default language (French) will be used if a translation is missing

## Testing

To test the i18n implementation:

1. Start the development server: `npm start`
2. Navigate to the application
3. Use the language switcher in the header
4. Verify that all text changes to the selected language
5. Refresh the page - the selected language should persist

## Troubleshooting

### Translations Not Loading

- Check browser console for HTTP errors
- Verify translation files exist in `src/assets/i18n/`
- Ensure JSON files are valid (no syntax errors)

### Language Not Persisting

- Check browser localStorage for `payzen_language` key
- Verify localStorage is not disabled in browser

### Missing Translations

- Check all translation files have the same keys
- Use browser dev tools to see which keys are missing
- Add missing keys to the appropriate translation files

## Future Enhancements

- [x] Add RTL support for Arabic
- [ ] Add more languages (German, Portuguese, etc.)
- [ ] Implement lazy loading for translation files
- [ ] Add translation management UI for admins
- [ ] Integrate with translation management service (e.g., Lokalise, Crowdin)
- [ ] Implement pluralization rules
- [ ] Add date/number formatting per locale
- [ ] Fine-tune RTL layout for complex components

