import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { AbsenceService } from '@app/core/services/absence.service';
import { AuthService } from '@app/core/services/auth.service';
import { Absence, AbsenceType, AbsenceDurationType, CreateAbsenceRequest } from '@app/core/models/absence.model';

@Component({
  selector: 'app-employee-absences',
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
    SelectModule,
    DatePickerModule,
    FileUploadModule,
    CardModule,
    TooltipModule
  ],
  templateUrl: './employee-absences.html',
  styleUrl: './employee-absences.css'
})
export class EmployeeAbsencesComponent implements OnInit {
  private absenceService = inject(AbsenceService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  absences = signal<Absence[]>([]);
  isLoading = signal(false);
  showCreateDialog = signal(false);
  
  stats = signal({
    totalAbsences: 0,
    totalDays: 0
  });

  // Create form
  newAbsence = signal<CreateAbsenceRequest>({
    employeeId: 0,
    absenceDate: '',
    durationType: 'FullDay',
    absenceType: 'JUSTIFIED',
    reason: ''
  });

  absenceTypes: Array<{ label: string; value: AbsenceType }> = [];

  durationTypes: Array<{ label: string; value: AbsenceDurationType }> = [];

  halfDayOptions: Array<{ label: string; value: boolean }> = [];

  ngOnInit() {
    this.loadAbsences();

    // Initialize translated labels for select options so the UI shows localized text
    this.absenceTypes = [
      { label: this.translate.instant('absences.types.annual_leave'), value: 'ANNUAL_LEAVE' },
      { label: this.translate.instant('absences.types.sick'), value: 'SICK' },
      { label: this.translate.instant('absences.types.maternity'), value: 'MATERNITY' },
      { label: this.translate.instant('absences.types.paternity'), value: 'PATERNITY' },
      { label: this.translate.instant('absences.types.unpaid'), value: 'UNPAID' },
      { label: this.translate.instant('absences.types.mission'), value: 'MISSION' },
      { label: this.translate.instant('absences.types.training'), value: 'TRAINING' },
      { label: this.translate.instant('absences.types.justified'), value: 'JUSTIFIED' },
      { label: this.translate.instant('absences.types.unjustified'), value: 'UNJUSTIFIED' },
      { label: this.translate.instant('absences.types.accident_work'), value: 'ACCIDENT_WORK' },
      { label: this.translate.instant('absences.types.exceptional'), value: 'EXCEPTIONAL' },
      { label: this.translate.instant('absences.types.religious'), value: 'RELIGIOUS' }
    ];

    this.durationTypes = [
      { label: this.translate.instant('absences.durations.fullDay'), value: 'FullDay' },
      { label: this.translate.instant('absences.durations.halfDay'), value: 'HalfDay' },
      { label: this.translate.instant('absences.durations.hourly'), value: 'Hourly' }
    ];

    this.halfDayOptions = [
      { label: this.translate.instant('absences.morning'), value: true },
      { label: this.translate.instant('absences.afternoon'), value: false }
    ];
  }

  loadAbsences() {
    this.isLoading.set(true);
    const user = this.authService.currentUser();
    const employeeId = user?.employee_id || user?.id;

    if (!employeeId) {
      this.isLoading.set(false);
      return;
    }

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

  openCreateDialog() {
    const user = this.authService.currentUser();
    const employeeId = user?.employee_id || user?.id;
    
    this.newAbsence.set({
      employeeId: Number(employeeId),
      absenceDate: '',
      durationType: 'FullDay',
      absenceType: 'JUSTIFIED',
      reason: ''
    });
    this.showCreateDialog.set(true);
  }

  submitAbsenceRequest() {
    const request = this.newAbsence();
    if (!request.absenceDate) {
      return;
    }

    // Validate based on duration type
    if (request.durationType === 'HalfDay' && request.isMorning === undefined) {
      return;
    }
    if (request.durationType === 'Hourly' && (!request.startTime || !request.endTime)) {
      return;
    }

    this.absenceService.createAbsence(request).subscribe({
      next: () => {
        this.showCreateDialog.set(false);
        this.loadAbsences();
      },
      error: (err) => {
        console.error('Failed to create absence request', err);
      }
    });
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

  updateField(field: keyof CreateAbsenceRequest, value: any) {
    this.newAbsence.update(current => ({ ...current, [field]: value }));
  }
}
