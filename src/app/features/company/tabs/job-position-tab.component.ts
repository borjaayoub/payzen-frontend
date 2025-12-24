import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-job-position-tab',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './job-position-tab.component.html',
})
export class JobPositionTabComponent {}
