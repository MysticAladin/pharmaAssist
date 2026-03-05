import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models/hospital.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    EmptyStateComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './department-list.component.html'
})
export class DepartmentListComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  departments = signal<Department[]>([]);
  loading = signal(true);
  customerId = signal<number>(0);
  customerName = signal<string>('');
  showDeleteConfirm = signal(false);
  departmentToDelete = signal<Department | null>(null);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('customerId');
    if (id) {
      this.customerId.set(+id);
      this.loadDepartments();
    }
  }

  loadDepartments(): void {
    this.loading.set(true);
    this.departmentService.getByCustomer(this.customerId()).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.departments.set(res.data);
          if (res.data.length > 0) {
            this.customerName.set(res.data[0].customerName);
          }
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  confirmDelete(dept: Department): void {
    this.departmentToDelete.set(dept);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirmed(): void {
    const dept = this.departmentToDelete();
    if (!dept) return;
    this.deleting.set(true);
    this.departmentService.delete(dept.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.departmentToDelete.set(null);
        this.deleting.set(false);
        this.loadDepartments();
      },
      error: () => this.deleting.set(false)
    });
  }

  onDeleteCancelled(): void {
    this.showDeleteConfirm.set(false);
    this.departmentToDelete.set(null);
  }
}
