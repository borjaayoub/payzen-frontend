import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

interface HrSettings {
  workingDays: string[];
  leaveCalculationMode: string;
  absenceCalculationMode: string;
}

@Component({
  selector: 'app-hr-settings-tab',
  imports: [
    FormsModule,
    TranslateModule,
    CheckboxModule,
    SelectModule,
    ButtonModule
  ],
  templateUrl: './hr-settings-tab.html'
})
export class HrSettingsTab {
  readonly isEditMode = signal(false);

  readonly hrSettings = signal<HrSettings>({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    leaveCalculationMode: 'civil',
    absenceCalculationMode: 'days'
  });

  readonly weekDays = [
    { label: 'Lundi', value: 'monday' },
    { label: 'Mardi', value: 'tuesday' },
    { label: 'Mercredi', value: 'wednesday' },
    { label: 'Jeudi', value: 'thursday' },
    { label: 'Vendredi', value: 'friday' },
    { label: 'Samedi', value: 'saturday' },
    { label: 'Dimanche', value: 'sunday' }
  ];

  readonly leaveCalculationModes = [
    { label: 'Année civile (1er Janvier - 31 Décembre)', value: 'civil' },
    { label: 'Année d\'ancienneté (Date d\'embauche)', value: 'seniority' }
  ];

  readonly absenceCalculationModes = [
    { label: 'Jours ouvrables', value: 'working_days' },
    { label: 'Jours calendaires', value: 'calendar_days' },
    { label: 'Heures', value: 'hours' }
  ];

  getLeaveCalculationLabel(): string {
    const mode = this.leaveCalculationModes.find(m => m.value === this.hrSettings().leaveCalculationMode);
    return mode?.label || '';
  }

  getAbsenceCalculationLabel(): string {
    const mode = this.absenceCalculationModes.find(m => m.value === this.hrSettings().absenceCalculationMode);
    return mode?.label || '';
  }

  toggleEditMode() {
    this.isEditMode.update(v => !v);
  }

  isWorkingDay(day: string): boolean {
    return this.hrSettings().workingDays.includes(day);
  }

  toggleWorkingDay(day: string) {
    if (!this.isEditMode()) return;

    this.hrSettings.update(settings => {
      const days = [...settings.workingDays];
      const index = days.indexOf(day);

      if (index > -1) {
        days.splice(index, 1);
      } else {
        days.push(day);
      }

      return { ...settings, workingDays: days };
    });
  }

  save() {
    // TODO: Call API to save HR settings
    this.isEditMode.set(false);
  }

  cancel() {
    // TODO: Reset form to original values
    this.isEditMode.set(false);
  }
}
