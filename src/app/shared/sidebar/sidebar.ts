import { Component, signal, input, computed, output, effect, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarGroupComponent } from './sidebar-group/sidebar-group.component';
import { SidebarGroupLabelComponent } from './sidebar-group/sidebar-group-label.component';
import { AuthService } from '@app/core/services/auth.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';
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
    MenuModule,
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
  readonly showCloseButton = input<boolean>(false);
  readonly closeButtonClick = output<void>();
  readonly className = input<string | string[] | Record<string, boolean> | null>(null);

  // === Internal state ===
  private readonly isCollapsedSignal = signal(this.Collapsed());
  private readonly isContentCollapsedSignal = signal(this.Collapsed());
  private readonly authService = inject(AuthService);
  private readonly contextService = inject(CompanyContextService);
  private readonly router = inject(Router);
  private toggleTimeout: any;

  constructor() {
    // Sync internal state when input changes externally
    effect(() => {
      const val = this.Collapsed();
      this.isCollapsedSignal.set(val);
      this.isContentCollapsedSignal.set(val);
    });
  }

  // === Exposed collapsed state for templates ===
  // This now reflects the delayed content state
  readonly isSidebarCollapsed = computed(() => this.isContentCollapsedSignal());

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
      [UserRole.ADMIN]: 'user.role.admin',
      [UserRole.RH]: 'user.role.hr',
      [UserRole.MANAGER]: 'user.role.manager',
      [UserRole.EMPLOYEE]: 'user.role.employee',
      [UserRole.CABINET]: 'user.role.cabinet',
      [UserRole.ADMIN_PAYZEN]: 'user.role.adminPayzen'
    };
    return role ? roleLabels[role] || role : '';
  });

  // === Company Context Info ===
  readonly currentCompanyName = this.contextService.companyName;
  readonly isExpertMode = this.contextService.isExpertMode;
  readonly hasMultipleMemberships = computed(() => this.contextService.memberships().length > 1);

  // === Computed Route Prefix based on mode ===
  readonly routePrefix = computed(() => this.isExpertMode() ? '/expert' : '/app');

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

    // Clear any existing timeout to handle rapid toggles
    if (this.toggleTimeout) {
      clearTimeout(this.toggleTimeout);
    }

    if (next) {
      // Collapsing: Delay content change to allow width animation to start/finish
      this.toggleTimeout = setTimeout(() => {
        this.isContentCollapsedSignal.set(true);
      }, 200); // 200ms delay for smoother collapse
    } else {
      // Expanding: Delay content change slightly less or same
      this.toggleTimeout = setTimeout(() => {
        this.isContentCollapsedSignal.set(false);
      }, 200);
    }
  }

  // === Menu Items Template (routes will be prefixed dynamically) ===
  private readonly menuItemsTemplate: MenuItemConfig[] = [
    { 
      label: 'nav.dashboard', 
      icon: 'pi pi-home', 
      routerLink: '/dashboard',
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
    }
  ];

  // === Filtered menu items based on user role with dynamic route prefix ===
  readonly menuItems = computed(() => {
    const user = this.currentUser();
    const prefix = this.routePrefix();
    if (!user) return [];

    return this.menuItemsTemplate
      .filter(item => {
        // If no role restrictions, show to everyone
        if (!item.requiredRoles || item.requiredRoles.length === 0) {
          return true;
        }
        // Check if user's role is in the required roles
        return item.requiredRoles.includes(user.role as UserRole);
      })
      .map(item => ({
        ...item,
        routerLink: `${prefix}${item.routerLink}`
      }));
  });

  // === Profile Menu Items ===
  readonly profileMenuItems = computed<MenuItem[]>(() => {
    const user = this.currentUser();
    const prefix = this.routePrefix();
    const items: MenuItem[] = [];

    // 1. User Info Header
    if (user) {
      items.push({
        id: 'user-header',
        label: user.email,
        icon: 'pi pi-envelope',
        disabled: true
      });
      items.push({ separator: true });
    }

    // 2. Mon Compte (Personal)
    items.push({
      label: 'nav.myProfile',
      icon: 'pi pi-user',
      routerLink: `${prefix}/profile`
    });
    items.push({
      label: 'nav.security',
      icon: 'pi pi-lock',
      command: () => { /* TODO: Open security settings */ }
    });

    items.push({ separator: true });

    // 3. App Experience (Preferences)
    items.push({
      label: 'nav.theme',
      icon: 'pi pi-moon',
      command: () => { /* TODO: Toggle theme */ }
    });
    items.push({
      label: 'nav.language',
      icon: 'pi pi-globe',
      command: () => { /* TODO: Open language switcher */ }
    });

    // 4. Gestion (Specific to Cabinets & Admins)
    if (user && [UserRole.CABINET, UserRole.ADMIN, UserRole.RH].includes(user.role as UserRole)) {
      items.push({ separator: true });

      // Show Switch Workspace only if user has multiple memberships
      if (this.hasMultipleMemberships()) {
        items.push({
          label: 'contextSelection.switchWorkspace',
          icon: 'pi pi-sync',
          command: () => this.switchWorkspace()
        });
      }

      if ([UserRole.ADMIN, UserRole.RH, UserRole.ADMIN_PAYZEN].includes(user.role as UserRole)) {
        items.push({
          label: 'nav.companySettings',
          icon: 'pi pi-cog',
          routerLink: `${this.routePrefix()}/company`
        });
      }
    }

    items.push({ separator: true });

    // 5. Support
    items.push({
      label: 'nav.help',
      icon: 'pi pi-question-circle',
      url: 'https://docs.payzen.ma',
      target: '_blank'
    });

    items.push({ separator: true });

    // 6. Logout
    items.push({
      id: 'logout',
      label: 'auth.logout',
      icon: 'pi pi-sign-out'
    });

    return items;
  });

  // === Methods ===
  logout(): void {
    this.authService.logout();
  }

  switchWorkspace(): void {
    // Clear current context but keep memberships
    this.contextService.clearContext();
    // Navigate to context selection
    this.router.navigate(['/select-context']);
  }

  closeSidebar(): void {
    this.closeButtonClick.emit();
  }
}
