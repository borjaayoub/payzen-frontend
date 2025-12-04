import { Component, Input, Output, EventEmitter  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext'

@Component({
  selector: 'ds-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule],
  templateUrl: './ds-input.html',
  styleUrls: ['./ds-input.css'],
})
export class DsInput {
  @Input() model?: any;
  @Input() placeholder = '';
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Output() modelChange = new EventEmitter<any>();
}
