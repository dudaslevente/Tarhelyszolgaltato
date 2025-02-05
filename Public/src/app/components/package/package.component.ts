import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ApiService } from '../../services/api.service';
import { Package } from '../../interfaces/packages';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-package',
  standalone: true,
  imports: [CardModule, CommonModule, RouterLink],
  templateUrl: './package.component.html',
  styleUrl: './package.component.scss'
})
export class PackageComponent implements OnInit{

  constructor(private api: ApiService){}

  packages:Package[] = [];

  ngOnInit(): void {
      this.api.readAll('packages').subscribe(res => {
      this.packages = res as Package[];
    });
  }
}