import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrandService } from '../../../core/services/brand.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Brand, ProductDocument, KnowledgeArticleSummary, DOCUMENT_TYPE_LABELS, KNOWLEDGE_CATEGORY_LABELS } from '../../../core/models/brand.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-brand-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, StatusBadgeComponent, ConfirmDialogComponent],
  templateUrl: './brand-detail.component.html'
})
export class BrandDetailComponent {
  private readonly brandService = inject(BrandService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  brand = signal<Brand | null>(null);
  loading = signal(true);
  activeTab = signal<'products' | 'documents' | 'knowledge'>('products');

  // Documents & Knowledge for brand's products
  documents = signal<ProductDocument[]>([]);
  knowledgeArticles = signal<KnowledgeArticleSummary[]>([]);

  // Delete
  showDeleteDialog = signal(false);

  // Constants
  documentTypeLabels = DOCUMENT_TYPE_LABELS;
  categoryLabels = KNOWLEDGE_CATEGORY_LABELS;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBrand(Number(id));
    }
  }

  private loadBrand(id: number): void {
    this.loading.set(true);
    this.brandService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.brand.set(response.data);
          this.loadKnowledgeArticles(id);
        } else {
          this.notification.error(this.translate.instant('brands.notFound'));
          this.router.navigate(['/brands']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('brands.loadError'));
        this.loading.set(false);
        this.router.navigate(['/brands']);
      }
    });
  }

  private loadKnowledgeArticles(brandId: number): void {
    this.brandService.getKnowledgeArticlesPaged({
      page: 1,
      pageSize: 50,
      brandId: brandId,
      publishedOnly: false
    }).subscribe({
      next: (response) => {
        this.knowledgeArticles.set(response.data || []);
      }
    });
  }

  setTab(tab: 'products' | 'documents' | 'knowledge'): void {
    this.activeTab.set(tab);
  }

  editBrand(): void {
    const b = this.brand();
    if (b) {
      this.router.navigate(['/brands', b.id, 'edit']);
    }
  }

  confirmDelete(): void {
    this.showDeleteDialog.set(true);
  }

  deleteBrand(): void {
    const b = this.brand();
    if (!b) return;

    this.brandService.delete(b.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('brands.deleted'));
          this.router.navigate(['/brands']);
        }
      },
      error: () => this.notification.error(this.translate.instant('brands.deleteError'))
    });
    this.showDeleteDialog.set(false);
  }

  toggleStatus(): void {
    const b = this.brand();
    if (!b) return;

    const action = b.isActive
      ? this.brandService.deactivate(b.id)
      : this.brandService.activate(b.id);

    action.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadBrand(b.id);
          this.notification.success(
            b.isActive
              ? this.translate.instant('brands.deactivated')
              : this.translate.instant('brands.activated')
          );
        }
      }
    });
  }

  viewProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  viewKnowledgeArticle(articleId: number): void {
    this.router.navigate(['/brands', 'knowledge', articleId]);
  }

  createKnowledgeArticle(): void {
    this.router.navigate(['/brands', 'knowledge', 'new'], {
      queryParams: { brandId: this.brand()?.id }
    });
  }
}
