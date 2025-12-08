import { Component, signal, input, computed, output, effect, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarGroupComponent } from './sidebar-group/sidebar-group.component';
import { SidebarGroupLabelComponent } from './sidebar-group/sidebar-group-label.component';
import { AuthService } from '@app/core/services/auth.service';
import { UserRole } from '@app/core/models/user.model';

interface MenuItemConfig extends MenuItem {
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
}

@Component({
  selector: 'app-sidebar',
  imports: [
    NgClass,
    RouterLink,
    RouterLinkActive,
    AvatarModule,
    ButtonModule,
    TranslateModule,
    TooltipModule,
    SidebarGroupComponent,
    SidebarGroupLabelComponent
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  // === Inputs ===
  readonly Width = input<number>(240);
  readonly CollapsedWidth = input<number>(70);
  readonly Collapsible = input<boolean>(false);
  readonly Collapsed = input<boolean>(false);
  readonly CollapsedChange = output<boolean>();
  readonly className = input<string | string[] | Record<string, boolean> | null>(null);

  // === Internal state ===
  private readonly isCollapsedSignal = signal(this.Collapsed());
  private readonly authService = inject(AuthService);

  constructor() {
    // Sync internal state when input changes externally
    effect(() => this.isCollapsedSignal.set(this.Collapsed()));
  }

  // === Exposed collapsed state for templates ===
  readonly isSidebarCollapsed = computed(() => this.isCollapsedSignal());

  // === Current user info ===
  readonly currentUser = this.authService.currentUser;
  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return user.username || user.email;
  });
  
  readonly userRoleLabel = computed(() => {
    const role = this.currentUser()?.role;
    const roleLabels: Record<string, string> = {
      [UserRole.ADMIN]: 'Admin Société',
      [UserRole.RH]: 'RH',
      [UserRole.MANAGER]: 'Manager',
      [UserRole.EMPLOYEE]: 'Employé',
      [UserRole.CABINET]: 'Cabinet',
      [UserRole.ADMIN_PAYZEN]: 'Admin PayZen'
    };
    return role ? roleLabels[role] || role : '';
  });

  // === Computed width ===
  readonly currentWidth = computed(() =>
    this.isCollapsedSignal() ? this.CollapsedWidth() : this.Width()
  );

  // === Behavior ===
  toggle() {
    if (!this.Collapsible()) return;

    const next = !this.isCollapsedSignal();
    this.isCollapsedSignal.set(next);
    this.CollapsedChange.emit(next);
  }

  // === All Navigation Items with Permission Config ===
  private readonly allMenuItems: MenuItemConfig[] = [
    { 
      label: 'nav.dashboard', 
      icon: 'pi pi-home', 
      routerLink: '/dashboard',
      requiredRoles: [UserRole.ADMIN, UserRole.RH, UserRole.ADMIN_PAYZEN]
    },
    { 
      label: 'nav.company', 
      icon: 'pi pi-building', 
      routerLink: '/company',
      requiredRoles: [UserRole.ADMIN, UserRole.RH, UserRole.ADMIN_PAYZEN]
    },
    { 
      label: 'nav.employees', 
      icon: 'pi pi-users', 
      routerLink: '/employees',
      requiredRoles: [UserRole.ADMIN, UserRole.RH, UserRole.CABINET, UserRole.ADMIN_PAYZEN]
    },
    { 
      label: 'nav.payroll', 
      icon: 'pi pi-wallet', 
      routerLink: '/payroll',
      requiredRoles: [UserRole.ADMIN, UserRole.RH, UserRole.CABINET, UserRole.ADMIN_PAYZEN]
    },
    { 
      label: 'nav.reports', 
      icon: 'pi pi-chart-bar', 
      routerLink: '/reports',
      requiredRoles: [UserRole.ADMIN, UserRole.RH, UserRole.CABINET, UserRole.ADMIN_PAYZEN]
    },
  ];

  // === Filtered menu items based on user role ===
  readonly menuItems = computed(() => {
    const user = this.currentUser();
    if (!user) return [];

    return this.allMenuItems.filter(item => {
      // If no role restrictions, show to everyone
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true;
      }
      // Check if user's role is in the required roles
      return item.requiredRoles.includes(user.role as UserRole);
    });
  });

  // === Methods ===
  logout(): void {
    this.authService.logout();
  }
}
