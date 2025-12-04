import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  imports: [FormsModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
})
export class InputComponent {
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() model: any;
}
