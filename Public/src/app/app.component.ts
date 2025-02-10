import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MenubarModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  appName = 'Tárhelyszolgáltató';
  company = 'Bajai SZC - Türr István Technikum';
  author = '13.a Szoftverfejlesztő';

  constructor(private auth: AuthService) {}

  items: MenuItem[] = [];

  ngOnInit(): void {
    this.auth.isLoggedIn$.subscribe(() => {
      this.setupMenu();
    });
  }

  setupMenu() {
    if (this.auth.isLoggedUser()) {
      this.items = [
        {
          label: 'Csomagválasztó',
          routerLink: '/package'
        },
        {
          label: 'Kijelentkezés',
          routerLink: '/logout'
        }
      ];
    } else {
      this.items = [
        {
          label: 'Regisztráció',
          routerLink: '/register'
        },
        {
          label: 'Bejelentkezés',
          routerLink: '/login'
        }
      ];
    }
  }
}
