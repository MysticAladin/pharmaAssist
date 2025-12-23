import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';
import { CartService } from '../../services/cart.service';
import { Favorite, ProductCatalogItem, PriceType } from '../../models/portal.model';
import { KmCurrencyPipe } from '../../../../core/pipes/km-currency.pipe';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, KmCurrencyPipe],
  templateUrl: './favorites-component/favorites.component.html',
  styleUrl: './favorites-component/favorites.component.scss'
})
export class FavoritesComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private cartService = inject(CartService);

  loading = signal(true);
  favorites = signal<Favorite[]>([]);

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    this.loading.set(true);
    this.catalogService.getFavorites().subscribe({
      next: (items) => {
        this.favorites.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  removeFavorite(productId: string) {
    this.catalogService.toggleFavorite(productId).subscribe(() => {
      this.favorites.update(items => items.filter(f => f.productId !== productId));
    });
  }

  addToCart(product: ProductCatalogItem) {
    this.cartService.addItem({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      manufacturer: product.manufacturer,
      unitPrice: product.unitPrice,
      quantity: 1,
      maxQuantity: product.stockQuantity,
      subtotal: product.unitPrice,
      imageUrl: product.imageUrl,
      priceType: product.priceType || PriceType.Commercial
    });
  }
}
