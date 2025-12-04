# 🔐 Authentication System Implementation Guide

## Overview

Complete authentication system for PayZen with login, guards, and user management.

## 📁 Folder Structure

```
src/app/features/auth/
├── models/
│   └── user.model.ts          # User interfaces & types
├── services/
│   └── auth.service.ts        # Authentication service
├── guards/
│   └── auth.guard.ts          # Route guards
└── login/
    ├── login.ts               # Login component
    ├── login.html             # Login template
    └── login.css              # Login styles
```

## 📋 What Each File Does

### 1. **models/user.model.ts**
**Purpose**: Define data structures for authentication

**Contains**:
- `User` interface - User data structure
- `UserRole` enum - User roles (admin, manager, user, employee)
- `LoginRequest` - Login credentials
- `LoginResponse` - API response after login
- `RegisterRequest` - Registration data
- `AuthState` - Application auth state

**Usage**:
```typescript
import { User, UserRole } from '../models/user.model';

const user: User = {
  id: '1',
  email: 'user@example.com',
  username: 'john',
  role: UserRole.ADMIN
};
```

---

### 2. **services/auth.service.ts**
**Purpose**: Handle all authentication logic

**Key Features**:
- ✅ Login/Logout functionality
- ✅ Token management (localStorage)
- ✅ User state management (signals)
- ✅ Auth state observables
- ✅ Token refresh
- ✅ Role-based access

**Key Methods**:

```typescript
// Login user
login(credentials: LoginRequest): Observable<LoginResponse>

// Logout user
logout(): void

// Check if authenticated
isUserAuthenticated(): boolean

// Get current user
getCurrentUser(): User | null

// Get auth token
getToken(): string | null

// Get auth headers for API calls
getAuthHeaders(): HttpHeaders
```

**Signals** (Reactive):
```typescript
currentUser = signal<User | null>(null)
isAuthenticated = signal<boolean>(false)
isLoading = signal<boolean>(false)
userRole = computed(() => this.currentUser()?.role)
isAdmin = computed(() => this.currentUser()?.role === 'admin')
```

**Usage in Components**:
```typescript
export class MyComponent {
  private authService = inject(AuthService);
  
  // Use signals
  user = this.authService.currentUser;
  isAuth = this.authService.isAuthenticated;
  
  // Or use methods
  logout() {
    this.authService.logout();
  }
}
```

---

### 3. **guards/auth.guard.ts**
**Purpose**: Protect routes from unauthorized access

**Guards Available**:

#### `authGuard` - Require Authentication
Redirects to login if not authenticated
```typescript
// In routes
{
  path: 'dashboard',
  component: Dashboard,
  canActivate: [authGuard]
}
```

#### `guestGuard` - For Auth Pages Only
Redirects to dashboard if already authenticated
```typescript
{
  path: 'auth/login',
  component: Login,
  canActivate: [guestGuard]
}
```

#### `adminGuard` - Admin Only
Only allows admin users
```typescript
{
  path: 'admin',
  component: AdminPanel,
  canActivate: [adminGuard]
}
```

#### `managerGuard` - Admin & Manager
Allows admin and manager users
```typescript
{
  path: 'reports',
  component: Reports,
  canActivate: [managerGuard]
}
```

#### `roleGuard` - Custom Roles
Create custom role-based guards
```typescript
{
  path: 'special',
  component: SpecialPage,
  canActivate: [roleGuard(['admin', 'special-user'])]
}
```

---

### 4. **login/** (Component)
**Purpose**: Login page with form validation

**Features**:
- ✅ Email/password form
- ✅ Form validation
- ✅ Error handling
- ✅ Loading states
- ✅ Remember me checkbox
- ✅ Password visibility toggle
- ✅ Multi-language support
- ✅ RTL support for Arabic

**Form Fields**:
- Email (required, valid email)
- Password (required, min 6 characters)
- Remember Me (optional)

---

## 🚀 How to Use

### Step 1: Update Routes

Update `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  // Auth routes (guest only)
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayout),
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  
  // Protected routes (auth required)
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      // ... other protected routes
    ]
  },
  
  // Default redirect
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
```

### Step 2: Use Auth Service in Components

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@features/auth/services/auth.service';

export class MyComponent {
  private authService = inject(AuthService);
  
  // Get user info
  user = this.authService.currentUser;
  isAdmin = this.authService.isAdmin;
  
  // Logout
  logout() {
    this.authService.logout();
  }
}
```

### Step 3: Make Authenticated API Calls

```typescript
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@features/auth/services/auth.service';

export class DataService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  getData() {
    const headers = this.authService.getAuthHeaders();
    return this.http.get('/api/data', { headers });
  }
}
```

### Step 4: Show/Hide Based on Auth

```html
<!-- Show only if authenticated -->
@if (authService.isAuthenticated()) {
  <button (click)="logout()">Logout</button>
}

<!-- Show only if admin -->
@if (authService.isAdmin()) {
  <a routerLink="/admin">Admin Panel</a>
}

<!-- Show user info -->
@if (authService.currentUser(); as user) {
  <p>Welcome, {{ user.firstName }}!</p>
}
```

---

## 🔧 Configuration

### Update API URL

In `auth.service.ts`, change the API endpoint:

```typescript
private readonly API_URL = 'https://your-api.com/api/auth';
```

### Mock Authentication (Development)

The service includes mock authentication for development. To use real API:

1. Replace `mockLogin()` with actual HTTP call:

```typescript
login(credentials: LoginRequest): Observable<LoginResponse> {
  this.isLoading.set(true);
  
  return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
    tap(response => this.handleLoginSuccess(response)),
    catchError(error => {
      this.handleAuthError(error);
      return throwError(() => error);
    })
  );
}
```

### Storage Keys

Change storage keys if needed:

```typescript
private readonly TOKEN_KEY = 'your_app_token';
private readonly USER_KEY = 'your_app_user';
```

---

## 🧪 Testing

### Test Login

1. Navigate to `/auth/login`
2. Enter any email and password (mock auth accepts anything)
3. Click "Sign In"
4. Should redirect to `/dashboard`

### Test Guards

1. Try accessing `/dashboard` without login → redirects to `/auth/login`
2. Login successfully → can access `/dashboard`
3. Try accessing `/auth/login` while logged in → redirects to `/dashboard`

### Test Logout

1. Click logout button
2. Should redirect to `/auth/login`
3. Token and user data cleared from localStorage

---

## 🎨 Customization

### Add More User Fields

Update `user.model.ts`:

```typescript
export interface User {
  // ... existing fields
  phone?: string;
  department?: string;
  // Add your fields
}
```

### Add More Roles

Update `user.model.ts`:

```typescript
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  EMPLOYEE = 'employee',
  ACCOUNTANT = 'accountant',  // Add new role
  HR = 'hr'                    // Add new role
}
```

Create custom guard:

```typescript
export const accountantGuard: CanActivateFn = roleGuard(['admin', 'accountant']);
```

### Customize Login Page

Edit `login.html` and `login.css` to match your design.

---

## 🔒 Security Best Practices

### ✅ DO:
1. Use HTTPS in production
2. Store tokens securely
3. Implement token refresh
4. Add CSRF protection
5. Validate on backend
6. Use strong passwords
7. Implement rate limiting
8. Log auth attempts

### ❌ DON'T:
1. Store passwords in localStorage
2. Send tokens in URL
3. Trust client-side validation only
4. Use weak JWT secrets
5. Expose sensitive user data

---

## 📊 Auth Flow Diagram

```
User Visits App
      ↓
Check if Token Exists
      ↓
   ┌──────┴──────┐
   │             │
  YES           NO
   │             │
   ↓             ↓
Validate    Redirect to
 Token         Login
   │             │
   ↓             ↓
Dashboard    Enter Credentials
              ↓
           Submit Form
              ↓
           API Call
              ↓
        ┌─────┴─────┐
        │           │
     Success      Error
        │           │
        ↓           ↓
   Store Token  Show Error
        │
        ↓
   Redirect to
    Dashboard
```

---

## 🐛 Troubleshooting

### Issue: "Token expired" error
**Solution**: Implement token refresh or re-login

### Issue: Guards not working
**Solution**: Check route configuration and guard imports

### Issue: User data not persisting
**Solution**: Check localStorage and browser settings

### Issue: Can't access protected routes
**Solution**: Verify token is stored and valid

---

## 📚 Next Steps

1. ✅ Implement registration page
2. ✅ Add forgot password functionality
3. ✅ Implement email verification
4. ✅ Add 2FA (Two-Factor Authentication)
5. ✅ Add social login (Google, Facebook)
6. ✅ Implement password strength meter
7. ✅ Add session timeout
8. ✅ Implement refresh token rotation

---

**Last Updated**: December 1, 2025  
**Status**: ✅ Fully Implemented  
**Version**: 1.0.0

