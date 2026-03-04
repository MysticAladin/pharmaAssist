import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrandService } from '../../../core/services/brand.service';
import { ProductService } from '../../../core/services/product.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  CreateKnowledgeArticleRequest,
  UpdateKnowledgeArticleRequest,
  KnowledgeCategory,
  KNOWLEDGE_CATEGORY_LABELS
} from '../../../core/models/brand.model';

interface KnowledgeForm {
  title: string;
  titleLocal: string;
  content: string;
  contentLocal: string;
  productId: number | null;
  brandId: number | null;
  category: number;
  sortOrder: number;
  isPublished: boolean;
  tags: string;
}

@Component({
  selector: 'app-knowledge-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './knowledge-form.component.html'
})
export class KnowledgeFormComponent {
  private readonly brandService = inject(BrandService);
  private readonly productService = inject(ProductService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  // State
  loading = signal(false);
  saving = signal(false);
  articleId = signal<number | null>(null);
  isEditMode = computed(() => this.articleId() !== null);

  // Dropdowns
  brands = signal<{ id: number; name: string }[]>([]);
  products = signal<{ id: number; name: string }[]>([]);

  // Category options
  categories = Object.entries(KNOWLEDGE_CATEGORY_LABELS).map(([key, label]) => ({
    value: Number(key),
    label
  }));

  form: KnowledgeForm = {
    title: '',
    titleLocal: '',
    content: '',
    contentLocal: '',
    productId: null,
    brandId: null,
    category: KnowledgeCategory.FAQ,
    sortOrder: 0,
    isPublished: false,
    tags: ''
  };

  constructor() {
    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.articleId.set(Number(id));
      this.loadArticle(Number(id));
    } else {
      // Pre-fill from query params
      const brandId = this.route.snapshot.queryParamMap.get('brandId');
      if (brandId) this.form.brandId = Number(brandId);
      const productId = this.route.snapshot.queryParamMap.get('productId');
      if (productId) this.form.productId = Number(productId);
    }
  }

  private loadDropdowns(): void {
    this.brandService.getPaged({ page: 1, pageSize: 1000, activeOnly: true }).subscribe({
      next: (response) => {
        this.brands.set((response.data || []).map(b => ({ id: b.id, name: b.name })));
      }
    });

    this.productService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products.set(response.data.map(p => ({ id: p.id, name: p.name })));
        }
      }
    });
  }

  private loadArticle(id: number): void {
    this.loading.set(true);
    this.brandService.getKnowledgeArticle(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const a = response.data;
          this.form = {
            title: a.title,
            titleLocal: a.titleLocal || '',
            content: a.content,
            contentLocal: a.contentLocal || '',
            productId: a.productId || null,
            brandId: a.brandId || null,
            category: a.category,
            sortOrder: a.sortOrder,
            isPublished: a.isPublished,
            tags: a.tags || ''
          };
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('knowledge.loadError'));
        this.loading.set(false);
        this.router.navigate(['/brands', 'knowledge']);
      }
    });
  }

  save(): void {
    if (!this.form.title?.trim()) {
      this.notification.error(this.translate.instant('knowledge.validation.titleRequired'));
      return;
    }
    if (!this.form.content?.trim()) {
      this.notification.error(this.translate.instant('knowledge.validation.contentRequired'));
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      const dto: UpdateKnowledgeArticleRequest = {
        title: this.form.title,
        titleLocal: this.form.titleLocal || undefined,
        content: this.form.content,
        contentLocal: this.form.contentLocal || undefined,
        productId: this.form.productId || undefined,
        brandId: this.form.brandId || undefined,
        category: this.form.category,
        sortOrder: this.form.sortOrder,
        isPublished: this.form.isPublished,
        tags: this.form.tags || undefined
      };

      this.brandService.updateKnowledgeArticle(this.articleId()!, dto).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success) {
            this.notification.success(this.translate.instant('knowledge.updated'));
            this.router.navigate(['/brands', 'knowledge', this.articleId()]);
          } else {
            this.notification.error(response.message || this.translate.instant('knowledge.saveError'));
          }
        },
        error: () => {
          this.saving.set(false);
          this.notification.error(this.translate.instant('knowledge.saveError'));
        }
      });
    } else {
      const dto: CreateKnowledgeArticleRequest = {
        title: this.form.title,
        titleLocal: this.form.titleLocal || undefined,
        content: this.form.content,
        contentLocal: this.form.contentLocal || undefined,
        productId: this.form.productId || undefined,
        brandId: this.form.brandId || undefined,
        category: this.form.category,
        sortOrder: this.form.sortOrder,
        isPublished: this.form.isPublished,
        tags: this.form.tags || undefined
      };

      this.brandService.createKnowledgeArticle(dto).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success && response.data) {
            this.notification.success(this.translate.instant('knowledge.created'));
            this.router.navigate(['/brands', 'knowledge', response.data.id]);
          } else {
            this.notification.error(response.message || this.translate.instant('knowledge.saveError'));
          }
        },
        error: () => {
          this.saving.set(false);
          this.notification.error(this.translate.instant('knowledge.saveError'));
        }
      });
    }
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/brands', 'knowledge', this.articleId()]);
    } else {
      this.router.navigate(['/brands', 'knowledge']);
    }
  }
}
