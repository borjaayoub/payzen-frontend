import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-department-tab',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './department-tab.component.html',
})
export class DepartmentTabComponent {}
