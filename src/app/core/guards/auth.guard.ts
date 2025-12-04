import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes requiring authentication
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Guest Guard - Redirects authenticated users away from auth pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect to appropriate dashboard based on role
  const user = authService.getCurrentUser();
  if (user) {
    router.navigate([getRoleDefaultRoute(user.role)]);
  }
  return false;
};

/**
 * Role Guard Factory - Creates guards for specific roles
 */
export const createRoleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    const user = authService.getCurrentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    // Redirect to access denied or appropriate page
    router.navigate(['/access-denied']);
    return false;
  };
};

/**
 * Admin Guard - Only Admin and Admin PayZen
 */
export const adminGuard: CanActivateFn = createRoleGuard(['admin', 'admin_payzen']);

/**
 * RH Guard - Admin, RH, and Admin PayZen
 */
export const rhGuard: CanActivateFn = createRoleGuard(['admin', 'rh', 'admin_payzen']);

/**
 * Manager Guard - Admin, RH, Manager, and Admin PayZen
 */
export const managerGuard: CanActivateFn = createRoleGuard(['admin', 'rh', 'manager', 'admin_payzen']);

/**
 * Cabinet Guard - Cabinet and Admin PayZen
 */
export const cabinetGuard: CanActivateFn = createRoleGuard(['cabinet', 'admin_payzen']);

/**
 * Get default route based on user role
 */
export function getRoleDefaultRoute(role: string): string {
  const roleRoutes: Record<string, string> = {
    'admin': '/dashboard',
    'rh': '/dashboard',
    'manager': '/employees',
    'employee': '/my-profile',
    'cabinet': '/companies',
    'admin_payzen': '/admin/dashboard'
  };
  return roleRoutes[role] || '/dashboard';
}
