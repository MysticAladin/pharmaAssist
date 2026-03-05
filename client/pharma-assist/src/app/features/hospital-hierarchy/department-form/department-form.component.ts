import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DepartmentService } from '../../../core/services/department.service';
import { PhysicianService } from '../../../core/services/physician.service';
import {
  Department,
  DepartmentDetail,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  Physician
} from '../../../core/models/hospital.model';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  templateUrl: './department-form.component.html'
})
export class DepartmentFormComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly physicianService = inject(PhysicianService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  customerId = signal<number>(0);
  departmentId = signal<number>(0);
  physicians = signal<Physician[]>([]);

  formData = signal<CreateDepartmentRequest & { id?: number }>({
    customerId: 0,
    name: '',
    nameLocal: '',
    floor: '',
    headPhysicianId: undefined,
    contactPhone: '',
    contactEmail: '',
    sortOrder: 0
  });

  ngOnInit(): void {
    const custId = this.route.snapshot.paramMap.get('customerId');
    const deptId = this.route.snapshot.paramMap.get('id');

    if (custId) {
      this.customerId.set(+custId);
      this.updateFormField('customerId', +custId);
      this.loadPhysicians(+custId);
    }

    if (deptId && deptId !== 'new') {
      this.isEdit.set(true);
      this.departmentId.set(+deptId);
      this.loadDepartment(+deptId);
    }
  }

  loadDepartment(id: number): void {
    this.loading.set(true);
    this.departmentService.getById(id).subscribe({
      next: (res) => {
        if (res.succeeded) {
          const d = res.data;
          this.formData.set({
            id: d.id,
            customerId: d.customerId,
            name: d.name,
            nameLocal: d.nameLocal || '',
            floor: d.floor || '',
            headPhysicianId: d.headPhysicianId || undefined,
            contactPhone: d.contactPhone || '',
            contactEmail: d.contactEmail || '',
            sortOrder: d.sortOrder
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPhysicians(customerId: number): void {
    this.physicianService.getByInstitution(customerId).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.physicians.set(res.data);
        }
      }
    });
  }

  updateFormField(field: string, value: any): void {
    this.formData.update(current => ({ ...current, [field]: value }));
  }

  save(): void {
    this.saving.set(true);
    const data = this.formData();

    if (this.isEdit()) {
      const req: UpdateDepartmentRequest = { ...data, id: this.departmentId() };
      this.departmentService.update(this.departmentId(), req).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/hospital', this.customerId(), 'departments']);
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.departmentService.create(data).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/hospital', this.customerId(), 'departments']);
        },
        error: () => this.saving.set(false)
      });
    }
  }
}
