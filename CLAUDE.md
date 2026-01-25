# PayZen Frontend

## What & Why

PayZen is a payroll/HR management platform for Moroccan businesses supporting multi-tenancy, role-based access, and dual operation modes (Standard/Expert).

## Tech Stack

- **Framework**: Angular 20 (standalone components)
- **Language**: TypeScript 5.9 (strict)
- **UI**: PrimeNG 20.4 + TailwindCSS 4.1
- **State**: Angular Signals + RxJS
- **i18n**: ngx-translate (fr/en/ar)
- **Testing**: Karma + Jasmine

## Project Structure

```
src/app/
├── core/              # Guards, interceptors, models, services, utils
├── features/          # Domain features (auth, cabinet, company, employees, etc.)
├── layouts/           # auth-layout, main-layout
├── shared/            # Reusable components, directives, sidebar
└── app.config.ts      # Application providers

Key locations:
- Guards: src/app/core/guards/auth.guard.ts
- Services: src/app/core/services/
- Models: src/app/core/models/
- Form controls: src/app/shared/components/form-controls/
- Routes: src/app/app.routes.ts (organized by mode: /app, /expert, /cabinet)
```

## Key Directories

- **core/guards**: Authentication, context, role-based route protection → auth.guard.ts:8-179
- **core/interceptors**: Auth headers, camelCase transformation → auth.interceptor.ts, camelcase.interceptor.ts
- **core/services**: API layer (AuthService, CompanyService, CompanyContextService, EmployeeService)
- **core/models**: Type definitions (Company, Employee, User, AppContext, CompanyMembership)
- **features/**: Domain-specific features with lazy-loaded routes
- **shared/components/form-controls**: WCAG 2.1 AA compliant inputs/selects

## Essential Commands

```bash
# Development
npm start              # Dev server → http://localhost:4200

# Build
npm run build          # Production → dist/
ng build --watch       # Watch mode

# Test
npm test               # Karma + Jasmine

# Generate
ng generate component <name>
ng generate service <name>
ng generate --help
```

## Development Patterns

### 1. New Feature Workflow
1. Create in `src/app/features/<feature>/`
2. Add route to `app.routes.ts` (under /app, /expert, or /cabinet)
3. Create service in `core/services/` for API calls
4. Add models in `core/models/`
5. Add i18n keys to `src/assets/i18n/*.json`

### 2. Forms
- Use `ui-input-field`/`ui-select-field` from shared/components/form-controls
- WCAG 2.1 AA compliant, Reactive Forms integration
- See: FORM_CONTROLS_MIGRATION.md

### 3. API Integration
- All calls via services in core/services/
- HttpClient returns Observables
- Auto camelCase transformation
- Auto headers: Authorization, X-Company-Id, X-Role-Context
- Always map DTOs to models → company.service.ts:195-221

### 4. Route Protection
- Guards: authGuard, contextGuard, rhGuard, expertModeGuard
- Combine: `canActivate: [authGuard, contextGuard]`
- See: core/guards/auth.guard.ts

### 5. Multi-Tenancy
- Use CompanyContextService for context operations
- Subscribe to `contextChanged$` for updates
- Never manipulate context directly
- See: .claude/docs/architectural_patterns.md#4

## Path Aliases (tsconfig.json:18-22)

```typescript
import { AuthService } from '@app/core/services/auth.service';
import { environment } from '@environments/environment';
```

## Common Patterns (Enforced)

1. **DI**: Use `inject()` not constructor → auth.guard.ts:8-10
2. **State**: Use Signals → companyContext.service.ts:28-35
3. **Components**: Always standalone → input-field.ts:9-14
4. **Guards**: Functional `CanActivateFn` → auth.guard.ts:8
5. **Interceptors**: `HttpInterceptorFn` → auth.interceptor.ts:8
6. **DTO Mapping**: In services → company.service.ts:195-221
7. **Observables**: Use `takeUntilDestroyed()`, prefer async pipe
8. **i18n**: Translation keys only, no hardcoded strings

## Additional Documentation

**Architecture & Patterns** (Read first for changes):
- `.claude/docs/architectural_patterns.md` - All patterns, design decisions, conventions

**Feature Guides**:
- `FORM_CONTROLS_MIGRATION.md` - WCAG form controls API
- `DASHBOARD_API_INTEGRATION.md` - Dashboard API
- `IMPLEMENTATION_SUMMARY.md` - Implementation history
- `README.md` - Angular CLI basics

## Quick Reference

**Key Services**: AuthService, CompanyContextService, CompanyService, EmployeeService, DraftService  
**Key Guards**: authGuard, contextGuard, rhGuard, expertModeGuard  
**Form Controls**: ui-input-field, ui-select-field, table-component, empty-state  
**API**: http://localhost:5119/api (environment.ts:2-4)  
**Routes**: /app/* (standard), /expert/* (expert), /cabinet/* (cabinet)  
**Build Budgets**: 3MB initial max, 8kB component styles max

---
**Last Updated**: 2026-01-25 | **Angular**: 20.3.0
