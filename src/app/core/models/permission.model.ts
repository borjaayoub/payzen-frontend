// Permission types based on backend RBAC
export type Permission =
  // User permissions
  | 'READ_USERS'
  | 'VIEW_USERS'
  | 'CREATE_USERS'
  | 'EDIT_USERS'
  | 'DELETE_USERS'
  // Role permissions
  | 'READ_ROLES'
  | 'VIEW_ROLES'
  | 'CREATE_ROLES'
  | 'EDIT_ROLES'
  | 'DELETE_ROLES'
  // Add more permissions as needed
  | 'READ_COMPANIES'
  | 'EDIT_COMPANIES'
  | 'READ_EMPLOYEES'
  | 'EDIT_EMPLOYEES'
  | 'READ_PAYROLL'
  | 'EDIT_PAYROLL';

// Permission check helper type
export interface PermissionCheck {
  hasPermission: boolean;
  message?: string;
}
