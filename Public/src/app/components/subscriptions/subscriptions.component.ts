import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [InputTextModule, PasswordModule, ButtonModule, CommonModule, FormsModule],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss'
})
export class SubscriptionsComponent {
  constructor(
    private api: ApiService
  ){}

  domain: string = '';

  subscriptions() {
    if (!this.domain) {
      console.error("Minden mezőt ki kell tölteni!");
      return;
    }
  
    const Data = {
      domain: this.domain,
    };
  
    this.api.subscriptions(Data).subscribe({
      next: (res) => {
        console.log("Sikeres előfizetés:", res);
        alert("Sikeres előfizetés:")
      },
      error: (err) => {
        console.error("Hiba a előfizetésnél:", err);
        alert("Hiba a előfizetésnél:")
      }
    });
  }
}
