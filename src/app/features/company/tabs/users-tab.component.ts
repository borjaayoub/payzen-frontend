import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MessageService, MenuItem } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { CompanyContextService } from '../../../core/services/companyContext.service';

interface UserDisplay {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
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
    TranslateModule,
    ButtonModule,
    TableModule,
    AvatarModule,
    TagModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    ToastModule,
    MenuModule
  ],
  providers: [MessageService],
  templateUrl: './users-tab.component.html'
})
export class UsersTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  private readonly userService = inject(UserService);
  private readonly contextService = inject(CompanyContextService);

  // State
  users = signal<UserDisplay[]>([]);
  loading = signal(false);
  inviteDialogVisible = signal(false);
  inviteLoading = signal(false);
  formSubmitted = false;

  // Forms
  inviteForm!: FormGroup;

  // Role options for select
  readonly roleOptions: RoleOption[] = [
    { label: 'HR Manager', value: 'rh' },
    { label: 'Manager', value: 'manager' },
    { label: 'Viewer', value: 'viewer' }
  ];

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
  getStatusClasses(status: UserDisplay['status']): string {
    const statusMap: Record<UserDisplay['status'], string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      inactive: 'bg-gray-100 text-gray-600'
    };
    return statusMap[status];
  }

  /** Get status dot color class */
  getStatusDotClass(status: UserDisplay['status']): string {
    const dotMap: Record<UserDisplay['status'], string> = {
      active: 'bg-green-500',
      pending: 'bg-amber-500',
      inactive: 'bg-gray-400'
    };
    return dotMap[status];
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

  openInviteDialog() {
    this.inviteForm.reset();
    this.formSubmitted = false;
    this.inviteDialogVisible.set(true);
  }

  closeInviteDialog() {
    this.inviteDialogVisible.set(false);
  }

  sendInvite() {
    this.formSubmitted = true;
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviteLoading.set(true);
    const { email, role } = this.inviteForm.value;
    const companyIdStr = this.contextService.companyId();
    const companyId = companyIdStr ? Number(companyIdStr) : 0;

    this.userService.inviteUser(email, role, companyId).subscribe({
      next: () => {
        this.inviteLoading.set(false);
        this.inviteDialogVisible.set(false);
        this.showToast('success', 'Invitation Sent', `Invite sent to ${email}`);
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
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  private loadUsers() {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        const displayUsers: UserDisplay[] = users.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`.trim() || u.username,
          email: u.email,
          role: `user.role.${u.role}`,
          status: 'active', // Assuming active for now, backend might provide status
          initials: this.getInitials(u.firstName ? `${u.firstName} ${u.lastName}` : u.username),
          avatarColor: 'blue' // Default, will be overridden by getAvatarBgColor
        }));
        this.users.set(displayUsers);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading.set(false);
        // Fallback to empty state or show error
        this.showToast('error', 'Error', 'Failed to load users');
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
