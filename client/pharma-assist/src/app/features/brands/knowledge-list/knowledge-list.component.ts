import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BrandService } from '../../../core/services/brand.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  KnowledgeArticleSummary,
  KnowledgeCategory,
  KNOWLEDGE_CATEGORY_LABELS
} from '../../../core/models/brand.model';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-knowledge-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    SearchInputComponent,
    PaginationComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent
  ],
  templateUrl: './knowledge-list.component.html'
})
export class KnowledgeListComponent {
  private readonly brandService = inject(BrandService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  articles = signal<KnowledgeArticleSummary[]>([]);
  loading = signal(false);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);

  // Filters
  searchTerm = signal('');
  selectedCategory = signal<number | null>(null);
  publishedOnly = signal<boolean | null>(null);

  // Delete dialog
  showDeleteDialog = signal(false);
  articleToDelete = signal<KnowledgeArticleSummary | null>(null);

  // Category options
  categories = Object.entries(KNOWLEDGE_CATEGORY_LABELS).map(([key, label]) => ({
    value: Number(key),
    label
  }));

  categoryLabels = KNOWLEDGE_CATEGORY_LABELS;

  constructor() {
    this.loadArticles();
  }

  loadArticles(): void {
    this.loading.set(true);
    this.brandService.getKnowledgeArticlesPaged({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchTerm() || undefined,
      category: this.selectedCategory() ?? undefined,
      publishedOnly: this.publishedOnly() ?? undefined
    }).subscribe({
      next: (response) => {
        this.articles.set(response.data || []);
        this.totalCount.set(response.totalCount || 0);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('knowledge.loadError'));
        this.loading.set(false);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadArticles();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category ? Number(category) : null);
    this.currentPage.set(1);
    this.loadArticles();
  }

  onPublishedChange(value: string): void {
    this.publishedOnly.set(value === '' ? null : value === 'true');
    this.currentPage.set(1);
    this.loadArticles();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadArticles();
  }

  viewArticle(article: KnowledgeArticleSummary): void {
    this.router.navigate(['/brands', 'knowledge', article.id]);
  }

  editArticle(article: KnowledgeArticleSummary): void {
    this.router.navigate(['/brands', 'knowledge', article.id, 'edit']);
  }

  createArticle(): void {
    this.router.navigate(['/brands', 'knowledge', 'new']);
  }

  confirmDelete(article: KnowledgeArticleSummary, event: Event): void {
    event.stopPropagation();
    this.articleToDelete.set(article);
    this.showDeleteDialog.set(true);
  }

  onDeleteConfirmed(): void {
    const article = this.articleToDelete();
    if (!article) return;

    this.brandService.deleteKnowledgeArticle(article.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success(this.translate.instant('knowledge.deleted'));
          this.loadArticles();
        } else {
          this.notification.error(response.message || this.translate.instant('knowledge.deleteError'));
        }
        this.showDeleteDialog.set(false);
        this.articleToDelete.set(null);
      },
      error: () => {
        this.notification.error(this.translate.instant('knowledge.deleteError'));
        this.showDeleteDialog.set(false);
        this.articleToDelete.set(null);
      }
    });
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
    this.articleToDelete.set(null);
  }

  getCategoryLabel(category: number): string {
    return this.categoryLabels[category as KnowledgeCategory] || 'Unknown';
  }

  getCategoryClass(category: number): string {
    switch (category) {
      case KnowledgeCategory.FAQ: return 'bg-info';
      case KnowledgeCategory.ProductInfo: return 'bg-primary';
      case KnowledgeCategory.ClinicalStudy: return 'bg-success';
      case KnowledgeCategory.CompetitorAnalysis: return 'bg-warning';
      case KnowledgeCategory.SalesGuide: return 'bg-secondary';
      case KnowledgeCategory.Training: return 'bg-dark';
      default: return 'bg-light';
    }
  }
}
