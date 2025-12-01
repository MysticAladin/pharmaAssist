import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="page"><h1>Proizvodi</h1><p>Lista proizvoda - u razvoju</p></div>`,
  styles: [`.page { padding: 20px; } h1 { margin-bottom: 16px; }`]
})
export class ProductsListComponent {}
