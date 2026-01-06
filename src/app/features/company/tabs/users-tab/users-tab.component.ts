import { Component, OnInit, OnDestroy, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MessageModule } from 'primeng/message';
import { MessageService, MenuItem } from 'primeng/api';
import { UserService, AvailableEmployee } from '../../../../core/services/user.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { User, UserRole } from '../../../../core/models/user.model';
import { CompanyContextService } from '../../../../core/services/companyContext.service';
import { Subscription } from 'rxjs';

interface UserDisplay {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  initials: string;
  avatarColor: string;
}

interface RoleOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-users-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Needed for [(ngModel)] in assign role dialog
    FormsModule,
    TranslateModule,
    ButtonModule,
    TableModule,
    AvatarModule,
    TagModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    ToastModule,
    MenuModule,
    MessageModule
  ],
  providers: [MessageService],
  templateUrl: './users-tab.component.html'
})
export class UsersTabComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly userService = inject(UserService);
  private readonly employeeService = inject(EmployeeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly contextService = inject(CompanyContextService);
  private contextSub?: Subscription;
  private langChangeSub?: Subscription;

  // State
  users = signal<UserDisplay[]>([]);
  availableEmployees = signal<AvailableEmployee[]>([]);
  loading = signal(false);
  inviteDialogVisible = signal(false);
  inviteLoading = signal(false);
  loadingEmployees = signal(false);
  // Roles
  roles = signal<RoleOption[]>([]);
  roleLoadError = signal<string | null>(null);

  // Assign role dialog
  assignRoleDialogVisible = signal(false);
  assigningRoleLoading = signal(false);
  selectedUserForAssign: UserDisplay | null = null;
  selectedRoleForAssign: string | null = null;
  assignRoleForm!: FormGroup;
  formSubmitted = false;

  // Forms
  inviteForm!: FormGroup;

  // Role options for select
  readonly roleOptions: RoleOption[] = [
    // initial placeholder; will be replaced by loaded roles
  ];

  // Localized labels for Assign Role modal (populated on init)
  assignRoleTitle = '';
  assignRoleSubtitle = '';
  assignRoleUserLabel = '';
  assignRoleRoleLabel = '';
  assignRoleAssignLabel = '';
  

  // Avatar color palette
  private readonly avatarColors = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-green-100', text: 'text-green-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-amber-100', text: 'text-amber-700' },
    { bg: 'bg-rose-100', text: 'text-rose-700' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700' }
  ];

  ngOnInit() {
    this.initForm();
    this.loadUsers();
    this.loadRoles();
    
    // Subscribe to company context changes to refresh users
    this.contextSub = this.contextService.contextChanged$.subscribe(() => {
      this.loadUsers();
    });

    this.assignRoleForm = this.fb.group({
      role: [null, Validators.required]
    });

    // populate localized labels for the Assign Role modal and refresh on language change
    this.populateAssignRoleLabels();
    this.langChangeSub = this.translate.onLangChange.subscribe(() => this.populateAssignRoleLabels());
  }

  private populateAssignRoleLabels() {
    this.translate.get([
      'company.users.assignRole.title',
      'company.users.assignRole.subtitle',
      'company.users.assignRole.userLabel',
      'company.users.assignRole.roleLabel',
      'company.users.assignRole.assign'
    ]).subscribe(res => {
      this.assignRoleTitle = res['company.users.assignRole.title'] || this.assignRoleTitle;
      this.assignRoleSubtitle = res['company.users.assignRole.subtitle'] || this.assignRoleSubtitle;
      this.assignRoleUserLabel = res['company.users.assignRole.userLabel'] || this.assignRoleUserLabel;
      this.assignRoleRoleLabel = res['company.users.assignRole.roleLabel'] || this.assignRoleRoleLabel;
      this.assignRoleAssignLabel = res['company.users.assignRole.assign'] || this.assignRoleAssignLabel;
    });
  }

  private loadRoles() {
    this.userService.getRoles().subscribe({
      next: (items) => {
        const options = items
          .filter(r => {
            const name = (r.name || '').toLowerCase();
            const code = (r.code || '').toLowerCase();
            return !name.includes('admin payzen') && !code.includes('adminpayzen');
          })
          .map(r => ({ 
            label: r.name, 
            value: String(r.id)
          }));
        this.roles.set(options);
      },
      error: (err) => {
        console.error('Error loading roles', err);
        this.roleLoadError.set('Failed to load roles');
      }
    });
  }

  ngOnDestroy() {
    if (this.contextSub) {
      this.contextSub.unsubscribe();
    }
    if (this.langChangeSub) {
      this.langChangeSub.unsubscribe();
    }
  }

  /** Check if a form field is invalid and should show error */
  isFieldInvalid(fieldName: string): boolean {
    const control = this.inviteForm.get(fieldName);
    return !!(control?.invalid && (control.touched || this.formSubmitted));
  }

  /** Get avatar background color based on user name hash */
  getAvatarBgColor(user: UserDisplay): string {
    const index = this.getColorIndex(user.name);
    return this.avatarColors[index].bg;
  }

  /** Get avatar text color based on user name hash */
  getAvatarTextColor(user: UserDisplay): string {
    const index = this.getColorIndex(user.name);
    return this.avatarColors[index].text;
  }

  /** Get status badge classes */
  getStatusClasses(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      inactive: 'bg-gray-100 text-gray-600'
    };
    return statusMap[status] ?? 'bg-gray-100 text-gray-600';
  }

  /** Get status dot color class */
  getStatusDotClass(status: string): string {
    const dotMap: Record<string, string> = {
      active: 'bg-green-500',
      pending: 'bg-amber-500',
      inactive: 'bg-gray-400'
    };
    return dotMap[status] ?? 'bg-gray-400';
  }

  /** Get role badge classes */
  getRoleClasses(role: string): string {
    const roleMap: Record<string, string> = {
      'user.role.hr': 'bg-purple-100 text-purple-700',
      'user.role.manager': 'bg-blue-100 text-blue-700',
      'user.role.viewer': 'bg-gray-100 text-gray-600'
    };
    return roleMap[role] || 'bg-gray-100 text-gray-600';
  }

  /** Get menu items for a specific user */
  getUserMenuItems(user: UserDisplay): MenuItem[] {
    return [
      {
        label: 'Affecter rôle',
        icon: 'pi pi-user-edit',
        command: () => this.openAssignRoleDialog(user)
      },
      { separator: true },
      {
        label: this.translate.instant('company.users.actions.edit'),
        icon: 'pi pi-pencil',
        command: () => this.editUser(user)
      },
      {
        label: user.status === 'active'
          ? this.translate.instant('company.users.actions.deactivate')
          : this.translate.instant('company.users.actions.activate'),
        icon: user.status === 'active' ? 'pi pi-ban' : 'pi pi-check',
        command: () => this.toggleUserStatus(user)
      },
      { separator: true },
      {
        label: this.translate.instant('company.users.actions.remove'),
        icon: 'pi pi-trash',
        styleClass: 'text-red-600',
        command: () => this.removeUser(user)
      }
    ];
  }

  openAssignRoleDialog(user: UserDisplay) {
    this.selectedUserForAssign = user;

    // Try to preload assigned roles from server and select accordingly.
    const userIdNum = Number(user.id);
    if (!Number.isNaN(userIdNum)) {
      this.userService.getUserRoles(userIdNum).subscribe({
        next: (assignments) => {
          if (Array.isArray(assignments) && assignments.length > 0) {
            const first = assignments[0];
            const roleId = first?.RoleId ?? first?.roleId ?? first?.RoleID ?? first?.Role?.id ?? first?.role?.id ?? null;
            if (roleId != null) {
              const match = this.roles().find(o => String(o.value) === String(roleId));
              this.selectedRoleForAssign = match ? match.value : null;
              this.assignRoleForm.patchValue({ role: this.selectedRoleForAssign });
              this.assignRoleDialogVisible.set(true);
              return;
            }
          }

          // Fallback to local name-based matching
          this.selectInitialRoleFromDisplay(user);
          this.assignRoleDialogVisible.set(true);
        },
        error: (err) => {
          console.error('Error fetching user roles', err);
          this.selectInitialRoleFromDisplay(user);
          this.assignRoleDialogVisible.set(true);
        }
      });
    } else {
      this.selectInitialRoleFromDisplay(user);
      this.assignRoleDialogVisible.set(true);
    }
  }

  private selectInitialRoleFromDisplay(user: UserDisplay) {
    const currentRoleName = user.role?.replace('user.role.', '').toLowerCase() || null;
    const options = this.roles();
    const match = options.find(o => 
      String(o.label).toLowerCase().includes(currentRoleName || '') ||
      currentRoleName?.includes(String(o.label).toLowerCase())
    );
    this.selectedRoleForAssign = match ? match.value : null;
    this.assignRoleForm.patchValue({ role: this.selectedRoleForAssign });
  }

  onAssignRoleDialogVisibleChange(visible: boolean) {
    this.assignRoleDialogVisible.set(visible);
    if (!visible) {
      // reset temporary state when dialog is closed
      this.selectedUserForAssign = null;
      this.selectedRoleForAssign = null;
      this.assignRoleForm.reset();
      this.assigningRoleLoading.set(false);
    }
  }

  assignRole() {
    if (!this.selectedUserForAssign) return;
    const selectedRole = this.assignRoleForm?.value?.role ?? this.selectedRoleForAssign;
    if (!selectedRole) return;
    this.assigningRoleLoading.set(true);
    const userId = this.selectedUserForAssign.id;
    
    // Find the role ID from the selected role value
    const selectedRoleOption = this.roles().find(r => String(r.value) === String(selectedRole));
    if (!selectedRoleOption) {
      this.assigningRoleLoading.set(false);
      this.showToast('error', 'Error', 'Invalid role selected');
      return;
    }

    // Call api/users-roles/ POST endpoint with UserId and RoleId
    const payload = {
      UserId: Number(userId),
      RoleId: Number(selectedRoleOption.value)
    };

    this.userService.assignUserRole(payload.UserId, payload.RoleId).subscribe({
      next: () => {
        this.assigningRoleLoading.set(false);
        this.assignRoleDialogVisible.set(false);
        this.showToast('success', 'Success', 'Role assigned successfully');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error assigning role', err);
        this.assigningRoleLoading.set(false);
        
        // If 404, try to create user account first
        if (err?.status === 404) {
          const email = this.selectedUserForAssign?.email;
          const companyIdStr = this.contextService.companyId();
          const companyId = companyIdStr ? Number(companyIdStr) : 0;
          if (!email) {
            this.showToast('error', 'Error', 'No email available to create account');
            return;
          }
          this.userService.inviteUser(email, String(selectedRole), companyId).subscribe({
            next: () => {
              this.assigningRoleLoading.set(false);
              this.assignRoleDialogVisible.set(false);
              this.showToast('success', 'Success', 'Account created and role assigned');
              this.loadUsers();
            },
            error: (e2) => {
              console.error('Error inviting user after failed role assignment', e2);
              this.assigningRoleLoading.set(false);
              this.showToast('error', 'Error', 'Failed to create account and assign role');
            }
          });
          return;
        }

        this.showToast('error', 'Error', 'Failed to assign role');
      }
    });
  }

  selectRole(roleValue: string) {
    // Toggle selection: deselect if already selected
    const current = this.assignRoleForm?.value?.role ?? this.selectedRoleForAssign;
    if (String(current) === String(roleValue)) {
      this.selectedRoleForAssign = null;
      if (this.assignRoleForm) this.assignRoleForm.patchValue({ role: null });
    } else {
      this.selectedRoleForAssign = roleValue;
      if (this.assignRoleForm) this.assignRoleForm.patchValue({ role: roleValue });
    }
  }

  isRoleSelected(roleValue: string): boolean {
    const current = this.assignRoleForm?.value?.role ?? this.selectedRoleForAssign;
    return String(current) === String(roleValue);
  }

  openInviteDialog() {
    this.inviteForm.reset();
    this.formSubmitted = false;
    this.inviteDialogVisible.set(true);
    this.loadAvailableEmployees();
  }

  closeInviteDialog() {
    this.inviteDialogVisible.set(false);
  }

  /** Load employees without user accounts */
  private loadAvailableEmployees() {
    const companyId = this.contextService.companyId();
    if (!companyId) return;

    this.loadingEmployees.set(true);
    this.userService.getAvailableEmployees(Number(companyId)).subscribe({
      next: (employees) => {
        this.availableEmployees.set(employees);
        this.loadingEmployees.set(false);
      },
      error: (err) => {
        console.error('Error loading available employees:', err);
        this.loadingEmployees.set(false);
      }
    });
  }

  sendInvite() {
    this.formSubmitted = true;
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviteLoading.set(true);
    const { employee, role } = this.inviteForm.value;
    const companyIdStr = this.contextService.companyId();
    const companyId = companyIdStr ? Number(companyIdStr) : 0;

    // Use the selected employee's email
    const email = employee?.email;
    if (!email) {
      this.showToast('error', 'Error', 'Please select an employee');
      this.inviteLoading.set(false);
      return;
    }

    this.userService.inviteUser(email, role, companyId).subscribe({
      next: () => {
        this.inviteLoading.set(false);
        this.inviteDialogVisible.set(false);
        this.showToast('success', this.translate.instant('company.users.inviteSuccess'), 
          this.translate.instant('company.users.inviteSentTo', { name: employee.fullName }));
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error sending invite:', err);
        this.inviteLoading.set(false);
        this.showToast('error', 'Error', 'Failed to send invitation');
      }
    });
  }

  private initForm() {
    this.inviteForm = this.fb.group({
      employee: [null, Validators.required],
      role: ['', Validators.required]
    });

    // When employee is selected, auto-fill the email (for display purposes)
    this.inviteForm.get('employee')?.valueChanges.subscribe(employee => {
      // Employee object is selected directly
    });
  }

  private loadUsers() {
    const companyId = this.contextService.companyId();
    if (!companyId) {
      this.showToast('error', 'Error', 'Company not selected');
      return;
    }

    this.loading.set(true);
    // Prefer fetching company employees (includes linked users and role info)
    this.employeeService.getEmployees({ companyId: Number(companyId) }).subscribe({
      next: (resp) => {
        const beforeCount = (resp?.employees || []).length;
        const employees = resp.employees || [];
        console.debug('[UsersTab] employees fetched:', beforeCount);

        const displayUsers: UserDisplay[] = employees.map(e => {
          const email = (e as any).email ?? (e as any).Email ?? '';
          const roleRaw = (e as any).roleName ?? (e as any).RoleName ?? (e as any).role ?? null;
          const role = roleRaw ? `user.role.${roleRaw}` : 'user.role.viewer';
          const name = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || email || `#${e.id}`;
          return {
            id: String((e as any).id ?? (e as any).Id ?? ''),
            name,
            email,
            role,
            status: (e as any).statusRaw ?? (e as any).status ?? 'inactive',
            initials: this.getInitials(name || email || ''),
            avatarColor: 'blue'
          };
        });

        this.users.set(displayUsers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading employees for users tab:', err);
        this.loading.set(false);
        this.showToast('error', 'Error', 'Failed to load company employees');
      }
    });
  }

  private getColorIndex(name: string): number {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % this.avatarColors.length;
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /** Format a name into Proper Case (Title Case) for display */
  formatProperName(name?: string | null): string {
    if (!name) return '';
    return String(name)
      .split(' ')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private editUser(user: UserDisplay) {
    // TODO: Implement edit functionality
    console.log('Edit user:', user);
  }

  private toggleUserStatus(user: UserDisplay) {
    // TODO: Implement real API call
    this.showToast('info', 'Not Implemented', 'This feature is not yet available on the backend');
  }

  private removeUser(user: UserDisplay) {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(users => users.filter(u => u.id !== user.id));
        this.showToast('info', 'User Removed', `${user.name} has been removed`);
      },
      error: (err) => {
        console.error('Error removing user:', err);
        this.showToast('error', 'Error', 'Failed to remove user');
      }
    });
  }

  private showToast(severity: 'success' | 'error' | 'info', summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
