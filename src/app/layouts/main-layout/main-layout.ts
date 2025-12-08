import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    Sidebar,
    Header,
    CommonModule,
    RouterModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    TranslateModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  isSidebarOpen = signal(false);
  searchQuery = signal('');

  // Menu items - Using PrimeIcons (pi pi-*)
  menuItems: MenuItem[] = [
    {
      label: 'Tableau de bord',
      icon: 'pi pi-home',
      routerLink: '/dashboard'
    },
    {
      label: 'Entreprise',
      icon: 'pi pi-building',
      routerLink: '/company'
    },
    {
      label: 'Employés',
      icon: 'pi pi-users',
      routerLink: '/employees'
    },
    {
      label: 'Paie',
      icon: 'pi pi-wallet',
      routerLink: '/payroll'
    },
    {
      label: 'Rapports',
      icon: 'pi pi-chart-bar',
      routerLink: '/reports'
    }
  ];

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen.update(open => !open);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
}
