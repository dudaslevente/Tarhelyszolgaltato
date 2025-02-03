import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ApiService } from '../../services/api.service';
import { Package } from '../../interfaces/packages';

@Component({
  selector: 'app-tarhely',
  standalone: true,
  imports: [CardModule, CommonModule],
  templateUrl: './tarhely.component.html',
  styleUrl: './tarhely.component.scss'
})
export class TarhelyComponent implements OnInit{

  constructor(private api: ApiService){}

  packages:Package[] = [];

  ngOnInit(): void {
      this.api.readAll('packages').subscribe(res => {
      this.packages = res as Package[];
    });
  }
}