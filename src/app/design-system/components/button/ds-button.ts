import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ds-button',
  standalone: true,
  imports: [CommonModule, ButtonModule, NgClass],
  templateUrl: './ds-button.html',
  styleUrls: ['./ds-button.css']
})
export class DsButton {
  @Input() label?: string;
  @Input() icon?: string;
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() customClass?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth: boolean = false;
  @Output() clicked = new EventEmitter<void>();
  @Input() disabled: boolean = false;
  
  onClick() { this.clicked.emit(); }
}
