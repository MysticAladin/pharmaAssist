import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhysicianService } from '../../../core/services/physician.service';
import {
  Physician,
  PhysicianSpecialty,
  KOLStatus,
  SPECIALTY_LABELS,
  KOL_STATUS_LABELS
} from '../../../core/models/hospital.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent, PageEvent } from '../../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';

@Component({
  selector: 'app-physician-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    EmptyStateComponent,
    StatusBadgeComponent,
    PaginationComponent,
    ConfirmDialogComponent,
    SearchInputComponent
  ],
  templateUrl: './physician-list.component.html'
})
export class PhysicianListComponent implements OnInit {
  private readonly physicianService = inject(PhysicianService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  physicians = signal<Physician[]>([]);
  loading = signal(true);
  customerId = signal<number | null>(null);
  departmentId = signal<number | null>(null);
  searchTerm = signal('');
  selectedSpecialty = signal<number | null>(null);
  selectedKolStatus = signal<number | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(20);
  totalItems = signal(0);

  // Delete
  showDeleteConfirm = signal(false);
  physicianToDelete = signal<Physician | null>(null);
  deleting = signal(false);

  // Make enums/labels available to template
  specialtyOptions = Object.entries(PhysicianSpecialty)
    .filter(([, v]) => typeof v === 'number')
    .map(([key, value]) => ({ value: value as number, label: key }));

  kolOptions = Object.entries(KOLStatus)
    .filter(([, v]) => typeof v === 'number')
    .map(([key, value]) => ({ value: value as number, label: key }));

  ngOnInit(): void {
    const custId = this.route.snapshot.paramMap.get('customerId');
    const deptId = this.route.snapshot.paramMap.get('departmentId');
    if (custId) this.customerId.set(+custId);
    if (deptId) this.departmentId.set(+deptId);
    this.loadPhysicians();
  }

  loadPhysicians(): void {
    this.loading.set(true);

    // If we have a department context, use by-department endpoint
    if (this.departmentId()) {
      this.physicianService.getByDepartment(this.departmentId()!).subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.physicians.set(res.data);
            this.totalItems.set(res.data.length);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
    // If we have an institution context, use by-institution endpoint
    else if (this.customerId()) {
      this.physicianService.getByInstitution(this.customerId()!).subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.physicians.set(res.data);
            this.totalItems.set(res.data.length);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
    // Otherwise use paged global list
    else {
      this.physicianService.getPaged(
        this.currentPage(),
        this.pageSize(),
        this.searchTerm() || undefined,
        this.selectedSpecialty() ?? undefined,
        this.selectedKolStatus() ?? undefined
      ).subscribe({
        next: (res) => {
          this.physicians.set(res.data);
          this.totalItems.set(res.totalCount);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadPhysicians();
  }

  onSpecialtyChange(value: string): void {
    this.selectedSpecialty.set(value ? +value : null);
    this.currentPage.set(1);
    this.loadPhysicians();
  }

  onKolChange(value: string): void {
    this.selectedKolStatus.set(value ? +value : null);
    this.currentPage.set(1);
    this.loadPhysicians();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadPhysicians();
  }

  getSpecialtyLabel(specialty: PhysicianSpecialty): string {
    return SPECIALTY_LABELS[specialty] || 'HOSPITAL.SPECIALTY.OTHER';
  }

  getKolBadgeVariant(status: KOLStatus): 'success' | 'warning' | 'info' | 'neutral' {
    switch (status) {
      case KOLStatus.Senior: return 'success';
      case KOLStatus.Active: return 'info';
      case KOLStatus.Potential: return 'warning';
      default: return 'neutral';
    }
  }

  getKolLabel(status: KOLStatus): string {
    return KOL_STATUS_LABELS[status] || 'HOSPITAL.KOL.NONE';
  }

  confirmDelete(physician: Physician): void {
    this.physicianToDelete.set(physician);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmed(): void {
    const p = this.physicianToDelete();
    if (!p) return;
    this.deleting.set(true);
    this.physicianService.delete(p.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.physicianToDelete.set(null);
        this.deleting.set(false);
        this.loadPhysicians();
      },
      error: () => this.deleting.set(false)
    });
  }

  onDeleteCancelled(): void {
    this.showDeleteConfirm.set(false);
    this.physicianToDelete.set(null);
  }

  getBaseRoute(): string {
    if (this.customerId()) {
      return `/hospital/${this.customerId()}/physicians`;
    }
    return '/hospital/physicians';
  }
}
