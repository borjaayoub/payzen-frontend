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
        path: 'company/salary-packages/new',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-editor/template-editor.component')
            .then(m => m.TemplateEditorComponent),
        canActivate: [rhGuard],
        canDeactivate: [unsavedChangesGuard],
        title: 'New Salary Template - PayZen'
      },
      {
        path: 'company/salary-packages/official/:id',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-detail/template-detail.component')
            .then(m => m.TemplateDetailComponent),
        canActivate: [rhGuard],
        title: 'Official Template - PayZen'
      },
      {
        path: 'company/salary-packages/:id',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-detail/template-detail.component')
            .then(m => m.TemplateDetailComponent),
        canActivate: [rhGuard],
        title: 'Salary Template - PayZen'
      },
      {
        path: 'company/salary-packages/:id/edit',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-editor/template-editor.component')
            .then(m => m.TemplateEditorComponent),
        canActivate: [rhGuard],
        canDeactivate: [unsavedChangesGuard],
        title: 'Edit Salary Template - PayZen'
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
      },
      {
        path: 'permissions',
        loadComponent: () => 
          import('./features/permissions/permission-management.component')
            .then(m => m.PermissionManagementComponent),
        canActivate: [rhGuard],
        title: 'Permission Management - PayZen'
      }
    ]
  },

  // ============================================
  // CABINET ROUTES (/cabinet/*)
  // ============================================
  {
    path: 'cabinet',
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
        loadComponent: () => 
          import('./features/cabinet/portfolio/cabinet-dashboard')
            .then(m => m.CabinetDashboard),
        title: 'Cabinet Dashboard - PayZen'
      },
      {
        path: 'permissions',
        loadComponent: () => 
          import('./features/cabinet/permissions/cabinet-permissions')
            .then(m => m.CabinetPermissionsComponent),
        title: 'Cabinet Permissions - PayZen'
      },
      {
        path: 'audit-log',
        loadComponent: () => 
          import('./features/cabinet/audit-log/cabinet-audit-log')
            .then(m => m.CabinetAuditLogComponent),
        title: 'Audit Log - PayZen'
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
        loadComponent: () => 
          import('./features/expert/dashboard/expert-dashboard')
            .then(m => m.ExpertDashboard),
        title: 'Expert Dashboard - PayZen'
      },
      {
        path: 'client-view',
        component: Dashboard,
        data: { expertMode: true }
      },
      {
        path: 'company',
        loadComponent: () => import('./features/company/company.component').then(m => m.CompanyComponent),
        data: { expertMode: true }
      },
      {
        path: 'company/salary-packages/new',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-editor/template-editor.component')
            .then(m => m.TemplateEditorComponent),
        canDeactivate: [unsavedChangesGuard],
        data: { expertMode: true },
        title: 'New Salary Template - PayZen'
      },
      {
        path: 'company/salary-packages/official/:id',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-detail/template-detail.component')
            .then(m => m.TemplateDetailComponent),
        data: { expertMode: true },
        title: 'Official Template - PayZen'
      },
      {
        path: 'company/salary-packages/:id',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-detail/template-detail.component')
            .then(m => m.TemplateDetailComponent),
        data: { expertMode: true },
        title: 'Salary Template - PayZen'
      },
      {
        path: 'company/salary-packages/:id/edit',
        loadComponent: () => 
          import('./features/company/tabs/salary-packages-tab/components/template-editor/template-editor.component')
            .then(m => m.TemplateEditorComponent),
        canDeactivate: [unsavedChangesGuard],
        data: { expertMode: true },
        title: 'Edit Salary Template - PayZen'
      },
      {
        path: 'employees',
        component: EmployeesPage,
        data: { expertMode: true }
      },
      {
        path: 'employees/create',
        component: EmployeeCreatePage,
        data: { expertMode: true }
      },
      {
        path: 'employees/:id',
        component: EmployeeProfile,
        canDeactivate: [unsavedChangesGuard],
        data: { expertMode: true }
      },
      {
        path: 'payroll/generate',
        component: Dashboard, // Placeholder
        data: { expertMode: true }
      },
      {
        path: 'reports',
        component: Dashboard, // Placeholder
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
