import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TranslateModule } from '@ngx-translate/core';

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
  imports: [
    CommonModule,
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
export class Dashboard {
  // Metrics data
  metrics: MetricCard[] = [
    {
      title: 'Total Employés',
      value: '248',
      change: '+12%',
      changeType: 'increase',
      icon: 'pi-users',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Masse Salariale',
      value: '1.2M MAD',
      change: '+8%',
      changeType: 'increase',
      icon: 'pi-wallet',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Paies en Attente',
      value: '12',
      change: '-3%',
      changeType: 'decrease',
      icon: 'pi-clock',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  // Recent payslips
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

  // Quick actions
  quickActions: QuickAction[] = [
    {
      title: 'Générer les Paies',
      icon: 'pi-calculator',
      route: '/payroll/generate',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Ajouter un Employé',
      icon: 'pi-user-plus',
      route: '/employees/add',
      iconColor: 'text-green-600',
    },
    {
      title: 'Voir les Rapports',
      icon: 'pi-chart-bar',
      route: '/reports',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Paramètres Société',
      icon: 'pi-cog',
      route: '/company/settings',
      iconColor: 'text-gray-600',
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
}
