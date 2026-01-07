import { Component } from '@angular/core';
import { SalesRepsListComponent } from './sales-reps-list.component';

@Component({
  selector: 'app-sales-reps',
  standalone: true,
  imports: [SalesRepsListComponent],
  template: `<app-sales-reps-list></app-sales-reps-list>`
})
export class SalesRepsComponent {}
