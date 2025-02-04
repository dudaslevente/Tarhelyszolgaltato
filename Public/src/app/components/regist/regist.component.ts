import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { User } from '../../interfaces/user';
import { ApiService } from '../../services/api.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-regist',
  standalone: true,
  imports: [FormsModule, InputTextModule, PasswordModule, ButtonModule, CommonModule],
  templateUrl: './regist.component.html',
  styleUrl: './regist.component.scss',
  providers: [MessageService]
})
export class RegistComponent {
  constructor(
    private api: ApiService, 
    private messageService: MessageService
  ) {}

  invalidFields: string[] = [];

  user: User = {
    id: '',
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'user',
    domain: ''
  };

  registration() {
    if (this.invalidFields.length > 0) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Minden mező kitöltése kötelező!' });
      return;
    }

    // Jelszavak egyezésének ellenőrzése
    if (this.user.password !== this.user.confirm) {
      this.messageService.add({ severity: 'error', summary: 'Password Mismatch', detail: 'A jelszavak nem egyeznek!' });
      this.invalidFields.push('password');
      return;
    }

    // API hívás az adatok adatbázisba küldésére
    this.api.registration('users', this.user).subscribe({
      next: (res: any) => {
        this.invalidFields = res.invalid || [];
        if (this.invalidFields.length === 0) {
          this.messageService.add({ severity: 'success', summary: 'Sikeres regisztráció!', detail: 'A fiókod elkészült!' });

          // Mezők törlése sikeres regisztráció után
          this.user = {
            id: '',
            name: '',
            email: '',
            password: '',
            confirm: '',
            role: 'user',
            domain: ''
          };
        } else {
          this.messageService.add({ severity: 'error', summary: 'HIBA', detail: res.message });
        }
      },
      error: (error) => {
        console.error('Server Error:', error);
        this.messageService.add({ severity: 'error', summary: 'Szerverhiba', detail: 'Nem sikerült a regisztráció, próbáld újra!' });
      }
    });
  }

  isInvalid(field: string) {
    return this.invalidFields.includes(field);
  }
}
