import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { AbsenceService } from '@app/core/services/absence.service';
import { EmployeeService } from '@app/core/services/employee.service';
import { CompanyContextService } from '@app/core/services/companyContext.service';
import { Absence, AbsenceType, AbsenceDurationType } from '@app/core/models/absence.model';

@Component({
  selector: 'app-employee-absence-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    TextareaModule,
    CardModule,
    TooltipModule
  ],
  templateUrl: './employee-absence-detail.html',
  styleUrl: './employee-absence-detail.css'
})
export class EmployeeAbsenceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private absenceService = inject(AbsenceService);
  private employeeService = inject(EmployeeService);
  private contextService = inject(CompanyContextService);

  employeeId = signal<number>(0);
  employeeName = signal<string>('');
  absences = signal<Absence[]>([]);
  isLoading = signal(false);
  
  readonly routePrefix = signal('/app');

  stats = signal({
    totalAbsences: 0,
    totalDays: 0
  });

  ngOnInit() {
    // Determine route prefix
    if (this.contextService.isExpertMode()) {
      this.routePrefix.set('/expert');
    }

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        const employeeId = Number(id);
        this.employeeId.set(employeeId);
        this.loadEmployeeInfo(employeeId);
        this.loadAbsences(employeeId);
      }
    });
  }

  loadEmployeeInfo(id: number) {
    this.employeeService.getEmployeeById(String(id)).subscribe({
      next: (employee) => {
        this.employeeName.set(`${employee.firstName} ${employee.lastName}`);
      },
      error: (err) => console.error('Failed to load employee info', err)
    });
  }

  loadAbsences(employeeId: number) {
    this.isLoading.set(true);
    
    this.absenceService.getEmployeeAbsences(String(employeeId)).subscribe({
      next: (response) => {
        this.absences.set(response.absences);
        this.stats.set(response.stats);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load absences', err);
        this.isLoading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate([`${this.routePrefix()}/absences/hr`]);
  }

  getAbsenceTypeLabel(type: AbsenceType): string {
    const typeMap: Partial<Record<AbsenceType, string>> = {
      'JUSTIFIED': 'absences.types.justified',
      'UNJUSTIFIED': 'absences.types.unjustified',
      'SICK': 'absences.types.sick',
      'MISSION': 'absences.types.mission'
    };
    return typeMap[type] || type;
  }

  getDurationLabel(absence: Absence): string {
    if (absence.durationType === 'FullDay') {
      return 'absences.durations.fullDay';
    } else if (absence.durationType === 'HalfDay') {
      return absence.isMorning ? 'absences.durations.halfDayMorning' : 'absences.durations.halfDayAfternoon';
    } else {
      return `${absence.startTime} - ${absence.endTime}`;
    }
  }

  getAbsenceTypeSeverity(type: AbsenceType): 'success' | 'warn' | 'danger' | 'info' {
    switch (type) {
      case 'JUSTIFIED':
        return 'success';
      case 'SICK':
        return 'info';
      case 'MISSION':
        return 'info';
      case 'UNJUSTIFIED':
        return 'danger';
      default:
        return 'info';
    }
  }
}
