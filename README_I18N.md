# 🌍 PayZen i18n Implementation

## Overview

PayZen now supports **3 languages** with a complete internationalization (i18n) system:

| Language | Code | Status |
|----------|------|--------|
| 🇬🇧 English | `en` | ✅ Active |
| 🇲🇦 Arabic | `ar` | ✅ Active (RTL) |
| 🇫🇷 French | `fr` | ✅ Active (Default) |

## 🚀 Quick Start

### For Users

1. **Find the Language Switcher**
   - Located in the header (top-right on desktop)
   - Click the dropdown to see available languages

2. **Select Your Language**
   - Choose from English, Arabic, or French
   - The entire app updates instantly
   - Your choice is saved automatically

3. **Persistent Selection**
   - Your language preference is remembered
   - Works across browser sessions
   - Stored securely in your browser

### For Developers

#### Add Translation to a Component

1. **Import the module:**
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [TranslateModule],
  // ...
})
```

2. **Use in template:**
```html
<h1>{{ 'myKey.title' | translate }}</h1>
```

3. **Add to translation files:**
```json
// en.json, es.json, fr.json
{
  "myKey": {
    "title": "My Title"
  }
}
```

## 📁 Project Structure

```
payzen-frontend/
├── src/
│   ├── app/
│   │   ├── shared/
│   │   │   └── utils/
│   │   │       ├── translation.config.ts    # Config & constants
│   │   │       └── language.service.ts      # Language management
│   │   └── ...
│   └── assets/
│       └── i18n/
│           ├── en.json                      # English translations
│           ├── es.json                      # Spanish translations
│           └── fr.json                      # French translations
└── docs/
    ├── I18N_IMPLEMENTATION.md               # Full documentation
    ├── I18N_QUICK_START.md                  # Quick reference
    └── I18N_MIGRATION_CHECKLIST.md          # Migration guide
```

## 🎯 Features

### ✅ Implemented
- [x] Multi-language support (EN, AR, FR)
- [x] Dynamic language switching
- [x] Persistent language selection
- [x] Browser language detection
- [x] RTL support for Arabic
- [x] Language switcher UI component
- [x] Translation service
- [x] Sidebar translations
- [x] Login page translations
- [x] Header with language dropdown
- [x] Comprehensive documentation

### 🔄 Components with i18n
- [x] Sidebar navigation
- [x] Login page
- [x] Header component
- [x] Main layout
- [ ] Dashboard (pending)
- [ ] Company pages (pending)
- [ ] Employee pages (pending)
- [ ] Payroll pages (pending)
- [ ] Reports pages (pending)

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [I18N_IMPLEMENTATION.md](docs/I18N_IMPLEMENTATION.md) | Complete technical guide | Developers |
| [I18N_QUICK_START.md](docs/I18N_QUICK_START.md) | Quick reference | All developers |
| [I18N_MIGRATION_CHECKLIST.md](docs/I18N_MIGRATION_CHECKLIST.md) | Step-by-step migration | Developers |
| [I18N_SUMMARY.md](I18N_SUMMARY.md) | Implementation summary | Project managers |

## 🔧 Technical Details

### Dependencies
```json
{
  "@ngx-translate/core": "^17.0.0",
  "@ngx-translate/http-loader": "^17.0.0"
}
```

### Configuration
- **Default Language**: French (`fr`)
- **Supported Languages**: English (`en`), Arabic (`ar`), French (`fr`)
- **RTL Support**: Enabled for Arabic
- **Storage Key**: `payzen_language`
- **Translation Path**: `./assets/i18n/{lang}.json`

### Language Service API

```typescript
import { LanguageService } from '@shared/utils/language.service';

// Inject the service
private languageService = inject(LanguageService);

// Change language
this.languageService.setLanguage('en');

// Get current language
const current = this.languageService.getCurrentLanguage();

// Get instant translation
const text = this.languageService.instant('key.path');

// Get observable translation
this.languageService.translate$('key.path').subscribe(text => {
  console.log(text);
});
```

## 🎨 Usage Examples

### Simple Text
```html
<h1>{{ 'nav.dashboard' | translate }}</h1>
```

### With Parameters
```html
<p>{{ 'welcome.message' | translate: {name: userName} }}</p>
```

### In Attributes
```html
<input [placeholder]="'auth.login.username' | translate">
<button [attr.aria-label]="'common.save' | translate">
  {{ 'common.save' | translate }}
</button>
```

### In TypeScript
```typescript
showMessage() {
  const msg = this.languageService.instant('common.success');
  alert(msg);
}
```

## 📝 Available Translation Keys

### Navigation
- `nav.mainMenu` - Main Menu
- `nav.dashboard` - Dashboard
- `nav.company` - Company
- `nav.employees` - Employees
- `nav.payroll` - Payroll
- `nav.reports` - Reports

### Authentication
- `auth.login.title` - Login
- `auth.login.username` - Username
- `auth.login.password` - Password
- `auth.login.submit` - Sign In
- `auth.logout` - Logout

### Common Actions
- `common.save` - Save
- `common.cancel` - Cancel
- `common.delete` - Delete
- `common.edit` - Edit
- `common.add` - Add
- `common.search` - Search
- `common.loading` - Loading...
- `common.error` - Error
- `common.success` - Success

*See translation files for complete list*

## 🧪 Testing

### Manual Testing
```bash
# Start the dev server
npm start

# Test each language:
# 1. Switch to English - verify all text
# 2. Switch to Spanish - verify all text
# 3. Switch to French - verify all text
# 4. Refresh page - verify language persists
```

### Validate JSON Files
```powershell
# PowerShell
Get-ChildItem -Path src/assets/i18n -Filter *.json | ForEach-Object { 
  Write-Host "Validating $($_.Name)"; 
  Get-Content $_.FullName | ConvertFrom-Json | Out-Null 
}
```

## 🚧 Adding New Languages

### Step 1: Create Translation File
Create `src/assets/i18n/de.json` for German:
```json
{
  "app": {
    "name": "PayZen",
    "country": "MAROKKO"
  },
  // ... copy structure from en.json
}
```

### Step 2: Update Configuration
Edit `src/app/shared/utils/translation.config.ts`:
```typescript
export const AVAILABLE_LANGUAGES = ['en', 'es', 'fr', 'de'] as const;
```

### Step 3: Update Language Switcher
Edit `src/app/shared/components/header/header.ts`:
```typescript
languages: LanguageOption[] = [
  { label: 'English', value: 'en', flag: '🇬🇧' },
  { label: 'العربية', value: 'ar', flag: '🇲🇦' },
  { label: 'Français', value: 'fr', flag: '🇫🇷' },
  { label: 'Deutsch', value: 'de', flag: '🇩🇪' }
];
```

## 🐛 Troubleshooting

### Translations Not Showing
- Check browser console for errors
- Verify JSON files are valid
- Ensure translation keys exist in all files

### Language Not Persisting
- Check browser localStorage
- Verify `payzen_language` key exists
- Clear cache and try again

### Missing Translations
- Keys will display as-is if translation missing
- Add missing keys to all language files
- Validate JSON syntax

## 📊 Translation Coverage

### Current Status
- **Sidebar**: 100% ✅
- **Login**: 100% ✅
- **Header**: 100% ✅
- **Dashboard**: 0% ⏳
- **Company**: 0% ⏳
- **Employees**: 0% ⏳
- **Payroll**: 0% ⏳
- **Reports**: 0% ⏳

## 🎯 Next Steps

1. **Translate Remaining Pages**
   - Dashboard components
   - Company management
   - Employee management
   - Payroll processing
   - Reports

2. **Add More Languages**
   - German
   - Portuguese
   - Italian

3. **Advanced Features**
   - Pluralization rules
   - Date/number formatting
   - Translation management UI
   - Professional translation service integration

## 🤝 Contributing

When adding new features:

1. ✅ Always use translation keys (never hardcode text)
2. ✅ Add keys to ALL language files
3. ✅ Follow existing naming conventions
4. ✅ Test in all languages
5. ✅ Update documentation

## 📞 Support

- **Documentation**: See `docs/` folder
- **Examples**: Check existing components
- **Issues**: Create a GitHub issue
- **Questions**: Contact the development team

## 📄 License

Same as PayZen project license

---

**Implementation Date**: December 1, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Maintained By**: PayZen Development Team

