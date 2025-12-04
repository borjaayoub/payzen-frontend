import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
}

interface InviteForm {
  email: string;
  role: string;
}

@Component({
  selector: 'app-users-tab',
  imports: [
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TagModule,
    AvatarModule,
    TooltipModule
  ],
  templateUrl: './users-tab.html'
})
export class UsersTab {
  readonly showInviteDialog = signal(false);

  readonly users = signal<User[]>([
    {
      id: '1',
      name: 'Youssef Amrani',
      email: 'youssef@techcorp.ma',
      role: 'admin',
      status: 'active'
    },
    {
      id: '2',
      name: 'Fatima Zahra',
      email: 'fatima@techcorp.ma',
      role: 'rh',
      status: 'active'
    },
    {
      id: '3',
      name: 'Ahmed Bennani',
      email: 'ahmed@techcorp.ma',
      role: 'manager',
      status: 'active'
    },
    {
      id: '4',
      name: 'Sarah Cohen',
      email: 'sarah@cabinet-compta.ma',
      role: 'cabinet',
      status: 'pending'
    }
  ]);

  readonly inviteForm = signal<InviteForm>({
    email: '',
    role: ''
  });

  readonly roleOptions = [
    { label: 'Admin Société', value: 'admin' },
    { label: 'RH / Payroll', value: 'rh' },
    { label: 'Manager', value: 'manager' },
    { label: 'Cabinet Comptable', value: 'cabinet' }
  ];

  openInviteDialog() {
    this.showInviteDialog.set(true);
  }

  closeInviteDialog() {
    this.showInviteDialog.set(false);
    this.inviteForm.set({ email: '', role: '' });
  }

  sendInvite() {
    // TODO: Call API to send invite
    console.log('Sending invite:', this.inviteForm());
    this.closeInviteDialog();
  }

  getActiveUsersCount(): number {
    return this.users().filter(u => u.status === 'active').length;
  }

  getPendingUsersCount(): number {
    return this.users().filter(u => u.status === 'pending').length;
  }

  getRoleLabel(role: string): string {
    return this.roleOptions.find(r => r.value === role)?.label || role;
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' {
    const severityMap: Record<string, 'success' | 'warn' | 'danger'> = {
      active: 'success',
      pending: 'warn',
      inactive: 'danger'
    };
    return severityMap[status] || 'warn';
  }

  getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      active: 'Actif',
      pending: 'En attente',
      inactive: 'Inactif'
    };
    return labelMap[status] || status;
  }

  changeRole(user: User) {
    // TODO: Implement role change
    console.log('Change role for:', user);
  }

  removeUser(user: User) {
    // TODO: Implement user removal
    console.log('Remove user:', user);
  }
}
