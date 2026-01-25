# AGENTS.md - PayZen Frontend

## Overview

**PayZen** is a SaaS HR/Payroll management platform for the Moroccan market. This Angular frontend provides dashboards and management interfaces for companies, employees, payroll, and accounting firms (cabinets).

### Key User Roles
- **ADMIN/RH** - Company administrators managing employees and payroll
- **CABINET** - Accounting firms managing multiple client companies (expert mode)
- **EMPLOYEE** - Self-service access to personal info and payslips
- **ADMIN_PAYZEN** - Platform-level administration

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Angular 20+ (standalone components) |
| UI Library | PrimeNG v20 |
| Styling | TailwindCSS v4 |
| State | Angular Signals |
| HTTP | HttpClient with functional interceptors |
| i18n | ngx-translate (fr/en/ar) |
| Charts | Chart.js |
| Testing | Jasmine + Karma |

---

## Project Structure

```
src/app/
├── core/           → Singletons: services, guards, interceptors, models
├── features/       → Feature pages (dashboard, employees, company, auth)
├── shared/         → Reusable components, directives, utilities
├── layouts/        → Page layouts (main-layout, auth-layout)
├── app.routes.ts   → Route definitions
└── app.config.ts   → App providers configuration
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `core/services/` | API services, auth, company context management |
| `core/guards/` | Route guards (auth, role-based, unsaved changes) |
| `core/interceptors/` | HTTP interceptors (auth headers, camelCase transform) |
| `core/models/` | TypeScript interfaces and enums |
| `features/` | Page-level components organized by domain |
| `shared/components/` | Reusable UI components (form controls, table, tag) |
| `assets/i18n/` | Translation JSON files |

---

## Essential Commands

```bash
# Development
npm start              # Start dev server at localhost:4200

# Build
npm run build          # Production build to dist/

# Testing
npm test               # Run unit tests with Karma

# Generate
ng generate component features/<name>  # New feature component
```

---

## Environment Configuration

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Dev config (apiUrl: localhost:5119) |
| `src/environments/environment.prod.ts` | Production config |

---

## API Integration

- **Base URL:** Configured in environment files (`environment.apiUrl`)
- **Auth:** JWT Bearer token via `authInterceptor` (see `core/interceptors/auth.interceptor.ts:9-51`)
- **Multi-tenant:** `X-Company-Id` header added automatically based on selected context
- **Response Transform:** Backend PascalCase → Frontend camelCase via `camelCaseInterceptor`

---

## Additional Documentation

Agents should consult these files when working on related features:

| Topic | File |
|-------|------|
| **Architectural Patterns** | `.agents/docs/architectural_patterns.md` |
| **Form Controls API** | `FORM_CONTROLS_MIGRATION.md` |
| **Dashboard Integration** | `DASHBOARD_API_INTEGRATION.md` |
| **Implementation Details** | `IMPLEMENTATION_SUMMARY.md` |
| **Theme Configuration** | `src/assets/themes/README.md` |

---

## Quick Reference

### Creating a New Feature Component

1. Place in `src/app/features/<domain>/`
2. Use standalone component pattern
3. Add route in `app.routes.ts` with appropriate guards
4. Inject `CompanyContextService` if data is company-scoped
5. Subscribe to `contextChanged$` for context-aware reloading

### Creating a New Service

1. Place in `src/app/core/services/`
2. Use `@Injectable({ providedIn: 'root' })`
3. Use `inject()` for dependencies
4. Return `Observable` from API methods
5. Map backend responses to frontend models

### Adding Route Guards

1. Use functional guard pattern (`CanActivateFn`)
2. Common guards: `authGuard`, `contextGuard`, `rhGuard`
3. Combine guards: `canActivate: [authGuard, contextGuard, rhGuard]`

### Translation Keys

- Add keys to all three files: `src/assets/i18n/{fr,en,ar}.json`
- Use in templates: `{{ 'key.path' | translate }}`
- Default language: French (`fr`)
