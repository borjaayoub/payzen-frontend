# i18n Migration Checklist

Use this checklist when adding i18n support to existing or new components.

## Component Migration Steps

### ☐ Step 1: Import TranslateModule

In your component TypeScript file:

```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-your-component',
  imports: [
    // ... other imports
    TranslateModule  // Add this
  ],
  // ...
})
```

### ☐ Step 2: Identify Hardcoded Text

Review your template and identify all hardcoded text strings:
- Button labels
- Headers and titles
- Form labels
- Placeholders
- Error messages
- Success messages
- ARIA labels
- Tooltips

### ☐ Step 3: Create Translation Keys

Add translation keys to all three language files:

**Pattern**: Use dot notation to organize keys hierarchically

```
feature.component.element
```

**Examples**:
- `employees.list.title`
- `employees.form.firstName`
- `employees.actions.delete`

### ☐ Step 4: Add Translations

Add the same keys to all three files:

**`src/assets/i18n/en.json`**
```json
{
  "employees": {
    "list": {
      "title": "Employee List"
    },
    "form": {
      "firstName": "First Name"
    }
  }
}
```

**`src/assets/i18n/ar.json`**
```json
{
  "employees": {
    "list": {
      "title": "قائمة الموظفين"
    },
    "form": {
      "firstName": "الاسم الأول"
    }
  }
}
```

**`src/assets/i18n/fr.json`**
```json
{
  "employees": {
    "list": {
      "title": "Liste des Employés"
    },
    "form": {
      "firstName": "Prénom"
    }
  }
}
```

### ☐ Step 5: Update Template

Replace hardcoded text with translation pipe:

**Before:**
```html
<h1>Employee List</h1>
<label>First Name</label>
<button>Save</button>
```

**After:**
```html
<h1>{{ 'employees.list.title' | translate }}</h1>
<label>{{ 'employees.form.firstName' | translate }}</label>
<button>{{ 'common.save' | translate }}</button>
```

### ☐ Step 6: Update Attributes

Don't forget attributes like placeholders and ARIA labels:

```html
<input 
  [placeholder]="'employees.form.firstName' | translate"
  [attr.aria-label]="'employees.form.firstName' | translate"
/>
```

### ☐ Step 7: Test All Languages

1. Start the dev server: `npm start`
2. Switch to English - verify all text displays correctly
3. Switch to Arabic - verify all text displays correctly and RTL layout works
4. Switch to French - verify all text displays correctly
5. Check for any missing translations (they'll show as the key itself)

### ☐ Step 8: Validate JSON Files

Run validation to ensure no JSON syntax errors:

```powershell
Get-ChildItem -Path src/assets/i18n -Filter *.json | ForEach-Object { 
  Write-Host "Validating $($_.Name)"; 
  Get-Content $_.FullName | ConvertFrom-Json | Out-Null 
}
```

## Common Patterns

### Pattern 1: Simple Text

```html
<!-- Before -->
<p>Loading...</p>

<!-- After -->
<p>{{ 'common.loading' | translate }}</p>
```

### Pattern 2: Dynamic Content with Parameters

```html
<!-- Template -->
<p>{{ 'welcome.message' | translate: {name: userName} }}</p>

<!-- Translation -->
{
  "welcome": {
    "message": "Welcome, {{name}}!"
  }
}
```

### Pattern 3: Conditional Text

```html
<!-- Before -->
<span>{{ isActive ? 'Active' : 'Inactive' }}</span>

<!-- After -->
<span>{{ (isActive ? 'status.active' : 'status.inactive') | translate }}</span>
```

### Pattern 4: Lists/Arrays

```typescript
// Before
menuItems = [
  { label: 'Dashboard', icon: 'pi-home' },
  { label: 'Settings', icon: 'pi-cog' }
];

// After
menuItems = [
  { label: 'nav.dashboard', icon: 'pi-home' },
  { label: 'nav.settings', icon: 'pi-cog' }
];
```

```html
<!-- Template -->
@for (item of menuItems; track item.label) {
  <a>{{ item.label | translate }}</a>
}
```

### Pattern 5: TypeScript Code

```typescript
import { LanguageService } from '@shared/utils/language.service';

export class MyComponent {
  private languageService = inject(LanguageService);

  showAlert(): void {
    const message = this.languageService.instant('alerts.success');
    alert(message);
  }
}
```

## Reusable Translation Keys

Before creating new keys, check if these common ones already exist:

### Common Actions
- `common.save`
- `common.cancel`
- `common.delete`
- `common.edit`
- `common.add`
- `common.search`
- `common.filter`
- `common.export`
- `common.import`
- `common.actions`
- `common.confirm`
- `common.close`

### Common Messages
- `common.loading`
- `common.noData`
- `common.error`
- `common.success`

### Common Responses
- `common.yes`
- `common.no`

## Checklist Summary

- [ ] Import TranslateModule in component
- [ ] Identify all hardcoded text
- [ ] Create organized translation keys
- [ ] Add translations to en.json
- [ ] Add translations to ar.json
- [ ] Add translations to fr.json
- [ ] Update template with translate pipe
- [ ] Update attributes (placeholder, aria-label, etc.)
- [ ] Test in all three languages
- [ ] Test RTL layout with Arabic
- [ ] Validate JSON files
- [ ] Check for linter errors
- [ ] Commit changes

## Tips

✅ **Use existing keys** - Check `common.*` keys before creating new ones
✅ **Be consistent** - Follow the existing naming conventions
✅ **Group logically** - Keep related translations together
✅ **Test thoroughly** - Switch languages and verify everything works
✅ **Keep it simple** - Don't over-nest translation keys

## Need Help?

- **Full Guide**: `docs/I18N_IMPLEMENTATION.md`
- **Quick Start**: `docs/I18N_QUICK_START.md`
- **Examples**: Check `sidebar.html`, `login.html`, `header.html`

## Translation Resources

### Online Translators
- [Google Translate](https://translate.google.com/)
- [DeepL](https://www.deepl.com/) (More accurate for European languages)

### Professional Services
- [Lokalise](https://lokalise.com/)
- [Crowdin](https://crowdin.com/)
- [Phrase](https://phrase.com/)

### Language Validation
- Native speakers (preferred)
- Professional translation services
- Community review

