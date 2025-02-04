import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TarhelyComponent } from './components/tarhely/tarhely.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RegistComponent } from "./components/regist/regist.component";

@Component({
    selector: 'app-root',
    standalone:true,
    imports: [RouterOutlet, TarhelyComponent, HeaderComponent, FooterComponent, RegistComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  appName = 'Tárhelyszolgaltató';
  company = 'Bajai SZC - Türr István Technikum';
  author = '13.a Szoftverfejlesztő';
}
