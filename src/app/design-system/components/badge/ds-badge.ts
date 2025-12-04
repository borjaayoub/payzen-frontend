import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'ds-badge',
  standalone: true,
  imports: [CommonModule, BadgeModule],
  templateUrl: './ds-badge.html',
  styleUrls: ['./ds-badge.css']
})
export class DsBadge {
  @Input() value?: string | number;
  @Input() severity?: 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast';
}
