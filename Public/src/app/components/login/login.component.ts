import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [InputTextModule, PasswordModule, ButtonModule, CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(
      private api: ApiService,
      private router: Router
  ){}

  login() {
    if (!this.email || !this.password) {
      console.error("Minden mezőt ki kell tölteni!");
      return;
    }

    const Data = { 
      email: this.email, 
      password: this.password 
    };

    this.api.login(Data).subscribe({
      next: (res) => {
        console.log(" Sikeres bejelentkezés:", res);
        alert("Sikeres bejelentkezés!");

        this.router.navigate(['/tarhely']);
      },
      error: (err) => {
        console.error(" Hiba a bejelentkezésnél:", err);
        alert("Hiba a bejelentkezésnél!");
      }
    });
  }
}
