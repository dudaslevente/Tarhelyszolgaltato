import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-regist',
  standalone:true,
  imports: [FormsModule,InputTextModule,PasswordModule],
  templateUrl: './regist.component.html',
  styleUrl: './regist.component.scss'
})
export class RegistComponent {
  value: string = '';
}
