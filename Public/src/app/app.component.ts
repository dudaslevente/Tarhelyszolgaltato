import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MenubarModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  appName = 'Tárhelyszolgáltató';
  company = 'Bajai SZC - Türr István Technikum';
  author = '13.a Szoftverfejlesztő';

  items = [
    {
      label: "Registration",
      routerLink: ['/']
    },
    {
      label: "Login",
      routerLink: ['/login']
    }
  ];
}
