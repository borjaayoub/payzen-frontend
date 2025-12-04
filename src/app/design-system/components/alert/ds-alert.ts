import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ds-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ds-alert.html',
  styleUrls: ['./ds-alert.css']
})
export class DsAlert {
  @Input() type: 'success' | 'danger' | 'warning' | 'info' = 'info';
}
