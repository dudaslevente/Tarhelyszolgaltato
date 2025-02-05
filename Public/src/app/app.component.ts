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
export class AppComponent implements OnInit{
  appName = 'Tárhelyszolgáltató';
  company = 'Bajai SZC - Türr István Technikum';
  author = '13.a Szoftverfejlesztő';

  constructor(private auth:AuthService){}

  items:MenuItem[] = [];

  ngOnInit(): void {
    this.auth.isLoggedIn$.subscribe(res => {
      this.setupMenu(res);
    });
  }

  setupMenu(isLoggedIn:boolean){
    this.items = [
      ...(isLoggedIn) ? [
        ...(this.auth.isAdmin()) ? [
          { label: "Kilépés", url: '/logout' }
        ] : [
          { label: "Packages", url: '/packages' },
          { label: "Kilépés", url: '/logout' }
        ]

      ] : [
        { label: "Belépés", url: '/login' },
        { label: "Regisztráció", url: '/'}
      ]
    ];
  }
}
