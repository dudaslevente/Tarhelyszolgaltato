import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
  providers: [MessageService]
})
export class LogoutComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.auth.logout();
    this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Sikeres kijelentkezés!' });
    this.router.navigateByUrl('/login');
  }
}
