import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhysicianService } from '../../../core/services/physician.service';
import { DepartmentService } from '../../../core/services/department.service';
import {
  Physician,
  CreatePhysicianRequest,
  UpdatePhysicianRequest,
  PhysicianSpecialty,
  KOLStatus,
  Department
} from '../../../core/models/hospital.model';

@Component({
  selector: 'app-physician-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  templateUrl: './physician-form.component.html'
})
export class PhysicianFormComponent implements OnInit {
  private readonly physicianService = inject(PhysicianService);
  private readonly departmentService = inject(DepartmentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  customerId = signal<number>(0);
  physicianId = signal<number>(0);
  departments = signal<Department[]>([]);

  specialtyOptions = Object.entries(PhysicianSpecialty)
    .filter(([, v]) => typeof v === 'number')
    .map(([key, value]) => ({ value: value as number, label: key }));

  kolOptions = Object.entries(KOLStatus)
    .filter(([, v]) => typeof v === 'number')
    .map(([key, value]) => ({ value: value as number, label: key }));

  formData = signal<CreatePhysicianRequest & { id?: number }>({
    fullName: '',
    fullNameLocal: '',
    specialty: PhysicianSpecialty.GeneralPractice,
    specialtyOther: '',
    institutionId: 0,
    departmentId: undefined,
    licenseNumber: '',
    phone: '',
    email: '',
    kolStatus: KOLStatus.None,
    notes: ''
  });

  ngOnInit(): void {
    const custId = this.route.snapshot.paramMap.get('customerId');
    const physicianId = this.route.snapshot.paramMap.get('id');

    if (custId) {
      this.customerId.set(+custId);
      this.updateFormField('institutionId', +custId);
      this.loadDepartments(+custId);
    }

    if (physicianId && physicianId !== 'new') {
      this.isEdit.set(true);
      this.physicianId.set(+physicianId);
      this.loadPhysician(+physicianId);
    }
  }

  loadPhysician(id: number): void {
    this.loading.set(true);
    this.physicianService.getById(id).subscribe({
      next: (res) => {
        if (res.succeeded) {
          const p = res.data;
          this.formData.set({
            id: p.id,
            fullName: p.fullName,
            fullNameLocal: p.fullNameLocal || '',
            specialty: p.specialty,
            specialtyOther: p.specialtyOther || '',
            institutionId: p.institutionId,
            departmentId: p.departmentId || undefined,
            licenseNumber: p.licenseNumber || '',
            phone: p.phone || '',
            email: p.email || '',
            kolStatus: p.kolStatus,
            notes: p.notes || ''
          });
          if (p.institutionId) {
            this.customerId.set(p.institutionId);
            this.loadDepartments(p.institutionId);
          }
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadDepartments(customerId: number): void {
    this.departmentService.getByCustomer(customerId).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.departments.set(res.data);
        }
      }
    });
  }

  updateFormField(field: string, value: any): void {
    this.formData.update(current => ({ ...current, [field]: value }));
  }

  isSpecialtyOther(): boolean {
    return this.formData().specialty === PhysicianSpecialty.Other;
  }

  save(): void {
    this.saving.set(true);
    const data = this.formData();

    if (this.isEdit()) {
      const req: UpdatePhysicianRequest = { ...data, id: this.physicianId() };
      this.physicianService.update(this.physicianId(), req).subscribe({
        next: () => {
          this.saving.set(false);
          this.navigateBack();
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.physicianService.create(data).subscribe({
        next: () => {
          this.saving.set(false);
          this.navigateBack();
        },
        error: () => this.saving.set(false)
      });
    }
  }

  navigateBack(): void {
    if (this.customerId()) {
      this.router.navigate(['/hospital', this.customerId(), 'physicians']);
    } else {
      this.router.navigate(['/hospital/physicians']);
    }
  }

  getBackRoute(): string {
    if (this.customerId()) {
      return `/hospital/${this.customerId()}/physicians`;
    }
    return '/hospital/physicians';
  }
}
