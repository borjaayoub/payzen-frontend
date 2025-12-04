import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DsInput } from '../input/ds-input';
import { DsButton } from '../button/ds-button';
import { DsAlert } from '../alert/ds-alert';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'ds-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DsInput, DsButton, DsAlert, CardModule],
  templateUrl: './ds-form.html',
  styleUrls: ['./ds-form.css']
})
export class DsForm {
  @Input() initial?: { [k: string]: any } = {};
  @Input() title: string = '';
  @Output() submitForm = new EventEmitter<{ [k: string]: any }>();
  
  form = new FormGroup({
    name: new FormControl('', { validators: [Validators.required] }),
    email: new FormControl('', { validators: [Validators.required, Validators.email] })
  });

  ngOnInit() {
    if (this.initial) {
      this.form.patchValue(this.initial);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
