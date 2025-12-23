import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { EmployeesPage } from './features/employees/employees';
import { EmployeeProfile } from './features/employees/profile/employee-profile';
import { EmployeeCreatePage } from './features/employees/create/employee-create';
import { LoginPage } from './features/auth/login/login';
import { 
  authGuard, 
  guestGuard, 
  rhGuard, 
  contextGuard, 
  contextSelectionGuard,
  expertModeGuard,
  standardModeGuard 
} from '@app/core/guards/auth.guard';
import { unsavedChangesGuard } from '@app/core/guards/unsaved-changes.guard';

export const routes: Routes = [
  // ============================================
  // AUTH ROUTES (Public)
  // ============================================
  {
    path: 'login',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        component: LoginPage
      }
    ]
  },

  // ============================================
  // CONTEXT SELECTION (Post-login, pre-dashboard)
  // ============================================
  {
    path: 'select-context',
    canActivate: [authGuard, contextSelectionGuard],
    loadComponent: () => 
      import('./features/auth/context-selection/context-selection')
        .then(m => m.ContextSelectionPage),
    title: 'Select Workspace - PayZen'
  },

  // ============================================
  // STANDARD MODE ROUTES (/app/*)
  // ============================================
  {
    path: 'app',
    component: MainLayout,
    canActivate: [authGuard, contextGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'company',
        loadComponent: () => import('./features/company/company.component').then(m => m.CompanyComponent),
        canActivate: [rhGuard]
      },
      {
        path: 'employees',
        component: EmployeesPage,
        canActivate: [rhGuard]
      },
      {
        path: 'employees/create',
        component: EmployeeCreatePage,
        canActivate: [rhGuard]
      },
      {
        path: 'employees/:id',
        component: EmployeeProfile,
        canActivate: [rhGuard],
        canDeactivate: [unsavedChangesGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent)
      }
    ]
  },

  // ============================================
  // EXPERT MODE ROUTES (/expert/*)
  // ============================================
  {
    path: 'expert',
    component: MainLayout,
    canActivate: [authGuard, contextGuard, expertModeGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: Dashboard, // Can be replaced with ExpertDashboard later
        data: { expertMode: true }
      },
      {
        path: 'companies',
        loadComponent: () => import('./features/company/company.component').then(m => m.CompanyComponent),
        data: { expertMode: true }
      },
      {
        path: 'employees',
        component: EmployeesPage,
        data: { expertMode: true }
      },
      {
        path: 'employees/:id',
        component: EmployeeProfile,
        canDeactivate: [unsavedChangesGuard],
        data: { expertMode: true }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent)
      }
    ]
  },

  // ============================================
  // LEGACY ROUTES (Backwards compatibility)
  // Redirect old routes to new structure
  // ============================================
  {
    path: 'dashboard',
    redirectTo: '/app/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'company',
    redirectTo: '/app/company',
    pathMatch: 'full'
  },
  {
    path: 'employees',
    redirectTo: '/app/employees',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    redirectTo: '/app/profile',
    pathMatch: 'full'
  },

  // ============================================
  // FALLBACK
  // ============================================
  {
    path: '**',
    redirectTo: 'login'
  }
];
