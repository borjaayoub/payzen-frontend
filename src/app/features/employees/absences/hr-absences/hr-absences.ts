import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { AbsenceService } from '@app/core/services/absence.service';
import { EmployeeService } from '@app/core/services/employee.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';
import { Absence } from '@app/core/models/absence.model';

interface EmployeeAbsenceSummary {
  employeeId: number;
  employeeName: string;
  totalAbsences: number;
  totalDays: number;
}

@Component({
  selector: 'app-hr-absences',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    TableModule,
    TagModule,
    InputTextModule,
    SelectModule,
    CardModule
  ],
  templateUrl: './hr-absences.html',
  styleUrl: './hr-absences.css'
})
export class HrAbsencesComponent implements OnInit {
  private absenceService = inject(AbsenceService);
  private employeeService = inject(EmployeeService);
  private router = inject(Router);
  private contextService = inject(CompanyContextService);

  employees = signal<EmployeeAbsenceSummary[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');

  readonly routePrefix = signal('/app');

  companyStats = signal({
    totalAbsences: 0,
    totalDays: 0
  });

  ngOnInit() {
    // Determine route prefix based on context
    if (this.contextService.isExpertMode()) {
      this.routePrefix.set('/expert');
    }
    
    this.loadEmployeesAbsences();
  }

  loadEmployeesAbsences() {
    this.isLoading.set(true);

    // Load all employees
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        const employees = response.employees || [];
        
        // For each employee, get their absence stats
        const summaries: EmployeeAbsenceSummary[] = employees.map(emp => ({
          employeeId: Number(emp.id),
          employeeName: `${emp.firstName} ${emp.lastName}`,
          totalAbsences: 0,
          totalDays: 0
        }));

        this.employees.set(summaries);

        // Load company-wide stats
        this.absenceService.getAbsenceStats().subscribe({
          next: (stats) => {
            this.companyStats.set(stats);
          },
          error: (err) => console.error('Failed to load company stats', err)
        });

        // Load individual employee stats (could be optimized with a bulk endpoint)
        employees.forEach((emp, index) => {
          this.absenceService.getAbsenceStats({ employeeId: Number(emp.id) }).subscribe({
            next: (stats) => {
              this.employees.update(current => {
                const updated = [...current];
                updated[index] = {
                  ...updated[index],
                  totalAbsences: stats.totalAbsences,
                  totalDays: stats.totalDays
                };
                return updated;
              });
            },
            error: (err) => console.error(`Failed to load stats for employee ${emp.id}`, err)
          });
        });

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.isLoading.set(false);
      }
    });
  }

  viewEmployeeAbsences(employeeId: string) {
    this.router.navigate([`${this.routePrefix()}/absences/employee`, employeeId]);
  }

  filteredEmployees() {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.employees();
    }
    return this.employees().filter(emp => 
      emp.employeeName.toLowerCase().includes(query)
    );
  }
}
