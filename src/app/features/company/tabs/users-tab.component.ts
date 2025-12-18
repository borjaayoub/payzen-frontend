import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-users-tab',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ButtonModule,
    TableModule,
    AvatarModule,
    TagModule
  ],
  templateUrl: './users-tab.component.html'
})
export class UsersTabComponent {
  users = [
    {
      name: 'Fatima Benali',
      email: 'fatima.rh@company.com',
      role: 'user.role.hr',
      status: 'active',
      initials: 'FB',
      color: 'blue'
    },
    {
      name: 'Ahmed Alami',
      email: 'ahmed.manager@company.com',
      role: 'user.role.manager',
      status: 'active',
      initials: 'AA',
      color: 'green'
    },
    {
      name: 'Karim Tazi',
      email: 'karim.tazi@company.com',
      role: 'user.role.manager',
      status: 'pending',
      initials: 'KT',
      color: 'orange'
    }
  ];
}
