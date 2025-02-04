import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
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
  name: string = '';
  email: string = '';
  password: string = '';
  domain: string = '';

  constructor(
    private api: ApiService
  ){}

  registration() {
    if (!this.name || !this.email || !this.password || !this.domain) {
      console.error("Minden mezőt ki kell tölteni!");
      return;
    }
  
    const Data = {
      name: this.name,
      email: this.email,
      password: this.password,
      domain: this.domain
    };
  
    this.api.registration(Data).subscribe({
      next: (res) => {
        console.log("Sikeres regisztráció:", res);
        alert("Sikeres regisztráció:")
      },
      error: (err) => {
        console.error("Hiba a regisztrációnál:", err);
        alert("Hiba a regisztrációnál:")
      }
    });
  }
}