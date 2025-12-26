import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TranslateModule } from '@ngx-translate/core';
import { CompanyContextService } from '@app/core/services/companyContext.service';
import { DashboardService, EmployeeDashboardItem } from '@app/core/services/dashboard.service';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: string;
  iconColor: string;
  bgColor: string;
}

interface Payslip {
  id: string;
  employeeName: string;
  amount: string;
  status: 'paid' | 'pending';
  date: string;
}

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  iconColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ChartModule,
    TagModule,
    AvatarModule,
    TranslateModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly contextService = inject(CompanyContextService);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);

  // Context signals
  readonly isExpertMode = this.contextService.isExpertMode;
  readonly isClientView = this.contextService.isClientView;

  // Route prefix based on current context mode
  readonly routePrefix = computed(() => this.isExpertMode() ? '/expert' : '/app');

  // Data signals
  readonly totalEmployees = signal<number>(0);
  readonly activeEmployees = signal<number>(0);
  readonly employees = signal<EmployeeDashboardItem[]>([]);
  readonly isLoading = signal<boolean>(true);

  // Quick actions with dynamic routes
  readonly quickActions = computed<QuickAction[]>(() => [
    {
      title: 'Générer les Paies',
      icon: 'pi-calculator',
      route: `${this.routePrefix()}/payroll/generate`,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Ajouter un Employé',
      icon: 'pi-user-plus',
      route: `${this.routePrefix()}/employees/create`,
      iconColor: 'text-green-600',
    },
    {
      title: 'Voir les Rapports',
      icon: 'pi-chart-bar',
      route: `${this.routePrefix()}/reports`,
      iconColor: 'text-purple-600',
    },
    {
      title: 'Paramètres Société',
      icon: 'pi-cog',
      route: `${this.routePrefix()}/company`,
      iconColor: 'text-gray-600',
    },
  ]);

  // Computed metrics based on real API data
  readonly metrics = computed<MetricCard[]>(() => [
    {
      title: 'Total Employés',
      value: this.totalEmployees().toString(),
      change: '+12%', // TODO: Calculate from historical data when available
      changeType: 'increase',
      icon: 'pi-users',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Masse Salariale',
      value: '1.2M MAD', // TODO: Get from payroll API when available
      change: '+8%',
      changeType: 'increase',
      icon: 'pi-wallet',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Paies en Attente',
      value: '12', // TODO: Get from payroll API when available
      change: '-3%',
      changeType: 'decrease',
      icon: 'pi-clock',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]);

  ngOnInit(): void {
    this.loadEmployeeSummary();
  }

  loadEmployeeSummary(): void {
    this.isLoading.set(true);
    
    this.dashboardService.getEmployeeSummary().subscribe({
      next: (summary) => {
        this.totalEmployees.set(summary.totalEmployees);
        this.activeEmployees.set(summary.activeEmployees);
        this.employees.set(summary.employees);
        this.isLoading.set(false);
        
        // Update chart data based on real employee data
        this.updateEmployeeDistribution(summary.employees);
      },
      error: (err) => {
        console.error('Failed to load employee summary', err);
        this.isLoading.set(false);
      }
    });
  }

  updateEmployeeDistribution(employees: EmployeeDashboardItem[]): void {
    // Count employees by contract type
    const distribution: Record<string, number> = {};
    
    employees.forEach(emp => {
      const type = emp.contractType || 'Unknown';
      distribution[type] = (distribution[type] || 0) + 1;
    });

    // Update the chart
    const labels = Object.keys(distribution);
    const data = Object.values(distribution);
    
    this.employeeChartData.set({
      labels,
      datasets: [{
        data,
        backgroundColor: ['#1A73E8', '#10B981', '#F59E0B', '#EF4444'],
        hoverBackgroundColor: ['#1557B0', '#059669', '#D97706', '#B91C1C'],
      }],
    });
  }

  // Recent payslips - TODO: Get from payroll API when available
  recentPayslips: Payslip[] = [
    {
      id: '1',
      employeeName: 'Ahmed Bennani',
      amount: '12,500 MAD',
      status: 'paid',
      date: '2024-12-01',
    },
    {
      id: '2',
      employeeName: 'Fatima Zahra',
      amount: '15,000 MAD',
      status: 'paid',
      date: '2024-12-01',
    },
    {
      id: '3',
      employeeName: 'Youssef Amrani',
      amount: '18,500 MAD',
      status: 'pending',
      date: '2024-12-01',
    },
    {
      id: '4',
      employeeName: 'Samira El Fassi',
      amount: '14,200 MAD',
      status: 'pending',
      date: '2024-12-01',
    },
  ];

  // Chart data
  chartData = signal<any>({
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Masse Salariale (MAD)',
        data: [950000, 980000, 1020000, 1050000, 1100000, 1150000],
        fill: false,
        borderColor: '#1A73E8',
        tension: 0.4,
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
      },
    ],
  });

  chartOptions = signal<any>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function (value: any) {
            return value.toLocaleString() + ' MAD';
          },
        },
      },
    },
  });

  // Employee distribution chart
  employeeChartData = signal<any>({
    labels: ['CDI', 'CDD', 'Stage', 'Freelance'],
    datasets: [
      {
        data: [150, 60, 25, 13],
        backgroundColor: ['#1A73E8', '#10B981', '#F59E0B', '#EF4444'],
        hoverBackgroundColor: ['#1557B0', '#059669', '#D97706', '#B91C1C'],
      },
    ],
  });

  employeeChartOptions = signal<any>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  });

  openCompanySettings(): void {
    console.log('Opening company settings...');
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warn';
      default:
        return 'info';
    }
  }

  getStatusLabel(status: string): string {
    return status === 'paid' ? 'Payé' : 'En attente';
  }

  backToPortfolio(): void {
    this.contextService.resetToPortfolioContext();
    this.router.navigate(['/expert/dashboard']);
  }
}
