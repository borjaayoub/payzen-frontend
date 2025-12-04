import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'ds-card',
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: './ds-card.html',
  styleUrls: ['./ds-card.css']
})
export class DsCard {
}
