import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { ProductCatalogItem } from '../../models/portal.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, KmCurrencyPipe],
  templateUrl: './product-detail-component/product-detail.component.html',
  styleUrl: './product-detail-component/product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  isLoading = signal(true);
  product = signal<ProductCatalogItem | null>(null);
  quantity = signal(1);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.catalogService.getProduct(id).subscribe({
        next: (product) => {
          this.product.set(product);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  incrementQty() {
    this.quantity.update(q => q + 1);
  }

  decrementQty() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart() {
    const p = this.product();
    if (p) {
      this.cartService.addItem(p, this.quantity());
      this.quantity.set(1);
    }
  }
}
