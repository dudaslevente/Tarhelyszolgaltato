import { Component } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [InputTextModule, PasswordModule, ButtonModule, CommonModule, FormsModule],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss'
})
export class SubscriptionsComponent {
  constructor(
    private api: ApiService,
    private auth: AuthService,
    private activated: ActivatedRoute
  ){}

  domain: string = '';

  subscriptions() {
    if (!this.domain) {
      console.error("Minden mezőt ki kell tölteni!");
      return;
    }

    const packageId = this.activated.snapshot.params["id"];
    const user = this.auth.loggedUser();
    console.log(user)
    const Data = {
      domain: this.domain,
      userId: user.id,
      packageId: packageId
    };
  
    console.log(Data)
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
