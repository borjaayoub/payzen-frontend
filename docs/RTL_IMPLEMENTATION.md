# RTL (Right-to-Left) Implementation Guide

## Overview

The PayZen application automatically switches to RTL layout when Arabic is selected. This is handled automatically by the language service.

## How It Works

### Automatic Detection

When a user selects Arabic (`ar`), the language service automatically:

1. Sets `dir="rtl"` on the `<html>` element
2. Adds `rtl` class to the `<body>` element
3. Updates the `isRTL` signal to `true`

```typescript
// In language.service.ts
if (lang === 'ar') {
  document.documentElement.dir = 'rtl';
  document.body.classList.add('rtl');
  this.isRTL.set(true);
} else {
  document.documentElement.dir = 'ltr';
  document.body.classList.remove('rtl');
  this.isRTL.set(false);
}
```

### CSS Handling

All RTL-specific styles are in `src/styles.css` under the section:
```css
/* RTL Support for Arabic */
[dir="rtl"] { ... }
```

The CSS automatically:
- Flips text direction
- Mirrors margins and paddings
- Repositions the sidebar to the right
- Reverses flex layouts where appropriate
- Adjusts PrimeNG components

## Using RTL in Components

### Method 1: Check RTL State (Reactive)

```typescript
import { LanguageService } from '@shared/utils/language.service';

export class MyComponent {
  private languageService = inject(LanguageService);
  
  // Use the signal
  isRtl = this.languageService.isRTL;
  
  // In template
  // <div [class.rtl-specific]="isRtl()">
}
```

### Method 2: Check Current Language

```typescript
import { LanguageService } from '@shared/utils/language.service';

export class MyComponent {
  private languageService = inject(LanguageService);
  
  get isArabic(): boolean {
    return this.languageService.getCurrentLanguage() === 'ar';
  }
}
```

### Method 3: Use CSS Only

Most of the time, you don't need to check in TypeScript. Just use CSS:

```css
/* Normal LTR styles */
.my-element {
  margin-left: 1rem;
  text-align: left;
}

/* RTL overrides */
[dir="rtl"] .my-element {
  margin-left: 0;
  margin-right: 1rem;
  text-align: right;
}
```

## RTL-Friendly Guidelines

### DO ✅

1. **Use logical properties when possible:**
   ```css
   /* Good - automatically flips in RTL */
   margin-inline-start: 1rem;
   padding-inline-end: 0.5rem;
   ```

2. **Use Tailwind's RTL-aware classes:**
   ```html
   <!-- These automatically flip in RTL -->
   <div class="ms-4 me-2">  <!-- margin-start, margin-end -->
   <div class="ps-4 pe-2">  <!-- padding-start, padding-end -->
   ```

3. **Let CSS handle the flipping:**
   ```css
   [dir="rtl"] .my-class {
     /* Override specific styles */
   }
   ```

4. **Use flex-direction carefully:**
   ```css
   /* Keep vertical layouts as-is */
   [dir="rtl"] .flex-col {
     flex-direction: column !important;
   }
   ```

### DON'T ❌

1. **Don't hardcode left/right in critical layouts:**
   ```css
   /* Bad */
   position: absolute;
   left: 0;
   
   /* Good */
   position: absolute;
   inset-inline-start: 0;
   ```

2. **Don't reverse everything:**
   ```css
   /* Bad - reverses too much */
   [dir="rtl"] * {
     flex-direction: row-reverse;
   }
   ```

3. **Don't forget icon spacing:**
   ```html
   <!-- Bad - icon spacing won't flip -->
   <button class="flex items-center">
     <i class="pi pi-user"></i>
     <span class="ml-2">Text</span>
   </button>
   
   <!-- Good - handled by CSS -->
   <button class="flex items-center">
     <i class="pi pi-user"></i>
     <span>Text</span>
   </button>
   ```

## Common RTL Issues & Fixes

### Issue 1: Sidebar on Wrong Side

**Problem:** Sidebar stays on left in RTL

**Fix:** Already handled in CSS:
```css
[dir="rtl"] .sidebar {
  right: 0;
  left: auto;
}
```

### Issue 2: Icons Not Spacing Correctly

**Problem:** Icons too close to text in RTL

**Fix:** CSS handles this:
```css
[dir="rtl"] button i,
[dir="rtl"] button .pi {
  margin-right: 0;
  margin-left: 0.5rem;
}
```

### Issue 3: Forms Look Broken

**Problem:** Input fields not aligned in RTL

**Fix:** Already handled:
```css
[dir="rtl"] input,
[dir="rtl"] textarea {
  text-align: right;
}
```

### Issue 4: Flex Layouts Reversed Incorrectly

**Problem:** Vertical layouts are reversed

**Fix:** Explicitly preserve column direction:
```css
[dir="rtl"] .flex-col {
  flex-direction: column !important;
}
```

## Testing RTL

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Switch to Arabic:**
   - Click language dropdown
   - Select "العربية"

3. **Check these elements:**
   - ✅ Sidebar moves to right
   - ✅ Text aligns right
   - ✅ Icons on correct side
   - ✅ Forms work properly
   - ✅ Buttons look correct
   - ✅ Navigation flows right-to-left

4. **Switch back to English/French:**
   - Everything should return to LTR

## Adding New RTL-Specific Styles

When adding new components, follow this pattern:

```css
/* Component styles (LTR default) */
.my-new-component {
  margin-left: 1rem;
  padding-right: 0.5rem;
  text-align: left;
}

/* RTL overrides */
[dir="rtl"] .my-new-component {
  margin-left: 0;
  margin-right: 1rem;
  padding-right: 0;
  padding-left: 0.5rem;
  text-align: right;
}
```

## Language Service API

```typescript
// Check if RTL (reactive signal)
languageService.isRTL()  // returns boolean

// Check if RTL (method)
languageService.isRtlLanguage()  // returns boolean

// Get current language
languageService.getCurrentLanguage()  // returns 'en' | 'ar' | 'fr'

// Set language (automatically handles RTL)
languageService.setLanguage('ar')
```

## Browser Support

RTL is supported in all modern browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Future Enhancements

- [ ] Add more RTL languages (Hebrew, Urdu, Persian)
- [ ] Fine-tune complex component layouts
- [ ] Add RTL-specific animations
- [ ] Optimize PrimeNG component RTL support
- [ ] Add RTL unit tests

## Resources

- [MDN: CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [RTL Styling Best Practices](https://rtlstyling.com/)
- [Tailwind RTL Plugin](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)

---

**Last Updated:** December 1, 2025  
**Status:** ✅ Fully Implemented

