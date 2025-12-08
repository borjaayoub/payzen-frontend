import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { CompanyPage } from './features/company/company';
import { EmployeesPage } from './features/employees/employees';
import { EmployeeProfile } from './features/employees/profile/employee-profile';
import { LoginPage } from './features/auth/login/login';
import { authGuard, guestGuard, rhGuard } from '@app/core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes (guest only)
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

  // Protected routes
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
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
        component: CompanyPage
      },
      {
        path: 'employees',
        component: EmployeesPage,
        canActivate: [rhGuard]
      },
      {
        path: 'employees/:id',
        component: EmployeeProfile,
        canActivate: [rhGuard]
      }
    ]
  },

  // Redirect to login
  {
    path: '**',
    redirectTo: 'login'
  }
];
