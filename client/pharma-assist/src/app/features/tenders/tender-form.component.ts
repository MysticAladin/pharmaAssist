import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TenderService } from '../../core/services/tender.service';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { UserService } from '../../core/services/user.service';
import {
  TenderDetailDto,
  CreateTenderDto,
  UpdateTenderDto,
  AddTenderItemDto,
  TenderType,
  TenderPriority,
  tenderTypeLabels,
  tenderPriorityLabels
} from '../../core/models/tender.model';

@Component({
  selector: 'app-tender-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  templateUrl: './tender-form-component/tender-form.component.html',
  styleUrls: ['./tender-form-component/tender-form.component.scss']
})
export class TenderFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenderService = inject(TenderService);
  private readonly customerService = inject(CustomerService);
  private readonly userService = inject(UserService);

  // State
  readonly tender = signal<TenderDetailDto | null>(null);
  readonly customers = signal<{ id: number; name: string }[]>([]);
  readonly users = signal<{ id: string; fullName: string }[]>([]);
  readonly saving = this.tenderService.saving;

  isEditMode = false;
  form!: FormGroup;

  // Constants
  readonly types: TenderType[] = ['OpenTender', 'RestrictedTender', 'NegotiatedProcurement', 'FrameworkAgreement', 'QuoteRequest'];
  readonly priorities: TenderPriority[] = ['Low', 'Medium', 'High', 'Critical'];
  readonly tenderTypeLabels = tenderTypeLabels;
  readonly tenderPriorityLabels = tenderPriorityLabels;

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
    this.loadUsers();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadTender(+id);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      type: ['OpenTender', Validators.required],
      priority: ['Medium', Validators.required],
      customerId: [null, Validators.required],
      submissionDeadline: ['', Validators.required],
      openingDate: [''],
      contractStartDate: [''],
      contractEndDate: [''],
      estimatedValue: [null],
      budget: [null],
      bidSecurityAmount: [null],
      currency: ['BAM'],
      deliveryLocation: [''],
      deliveryTerms: [''],
      paymentTerms: [''],
      specialConditions: [''],
      evaluationCriteria: [''],
      contactPerson: [''],
      contactEmail: [''],
      contactPhone: [''],
      assignedUserId: [null],
      internalNotes: [''],
      items: this.fb.array([])
    });
  }

  loadTender(id: number): void {
    this.tenderService.getTender(id).subscribe({
      next: (tender) => {
        this.tender.set(tender);
        this.patchForm(tender);
      },
      error: (err) => {
        console.error('Failed to load tender', err);
        this.router.navigate(['/tenders']);
      }
    });
  }

  patchForm(tender: TenderDetailDto): void {
    this.form.patchValue({
      title: tender.title,
      description: tender.description,
      type: tender.type,
      priority: tender.priority,
      customerId: tender.customerId,
      submissionDeadline: this.formatDateTime(tender.submissionDeadline),
      openingDate: this.formatDateTime(tender.openingDate),
      contractStartDate: this.formatDate(tender.contractStartDate),
      contractEndDate: this.formatDate(tender.contractEndDate),
      estimatedValue: tender.estimatedValue,
      budget: tender.budget,
      bidSecurityAmount: tender.bidSecurityAmount,
      currency: tender.currency,
      deliveryLocation: tender.deliveryLocation,
      deliveryTerms: tender.deliveryTerms,
      paymentTerms: tender.paymentTerms,
      specialConditions: tender.specialConditions,
      evaluationCriteria: tender.evaluationCriteria,
      contactPerson: tender.contactPerson,
      contactEmail: tender.contactEmail,
      contactPhone: tender.contactPhone,
      assignedUserId: tender.assignedUserId,
      internalNotes: tender.internalNotes
    });

    // Add items
    this.items.clear();
    tender.items.forEach(item => {
      this.items.push(this.fb.group({
        id: [item.id],
        description: [item.description, Validators.required],
        specification: [item.specification],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        unit: [item.unit],
        estimatedUnitPrice: [item.estimatedUnitPrice],
        isRequired: [item.isRequired],
        productId: [item.productId]
      }));
    });
  }

  loadCustomers(): void {
    this.customerService.getSummaries().subscribe({
      next: (response) => {
        if (response.data) {
          this.customers.set(response.data.map(c => ({ id: c.id, name: c.name })));
        }
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers({ pageSize: 1000 }).subscribe({
      next: (response) => {
        this.users.set(response.data.map(u => ({ id: u.id, fullName: u.fullName })));
      }
    });
  }

  addItem(): void {
    this.items.push(this.fb.group({
      id: [null],
      description: ['', Validators.required],
      specification: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['kom'],
      estimatedUnitPrice: [null],
      isRequired: [true],
      productId: [null]
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formValue = this.form.value;

    // Parse dates
    const data = {
      ...formValue,
      customerId: +formValue.customerId,
      submissionDeadline: new Date(formValue.submissionDeadline),
      openingDate: formValue.openingDate ? new Date(formValue.openingDate) : null,
      contractStartDate: formValue.contractStartDate ? new Date(formValue.contractStartDate) : null,
      contractEndDate: formValue.contractEndDate ? new Date(formValue.contractEndDate) : null
    };

    if (this.isEditMode) {
      const updateDto: UpdateTenderDto = {
        ...data,
        id: this.tender()!.id
      };

      this.tenderService.updateTender(this.tender()!.id, updateDto).subscribe({
        next: (updated) => {
          this.router.navigate(['/tenders', updated.id]);
        },
        error: (err) => {
          console.error('Failed to update tender', err);
        }
      });
    } else {
      const createDto: CreateTenderDto = data;

      this.tenderService.createTender(createDto).subscribe({
        next: (created) => {
          this.router.navigate(['/tenders', created.id]);
        },
        error: (err) => {
          console.error('Failed to create tender', err);
        }
      });
    }
  }

  goBack(): void {
    if (this.isEditMode && this.tender()) {
      this.router.navigate(['/tenders', this.tender()!.id]);
    } else {
      this.router.navigate(['/tenders']);
    }
  }

  private formatDateTime(date: Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  }

  private formatDate(date: Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  }
}
