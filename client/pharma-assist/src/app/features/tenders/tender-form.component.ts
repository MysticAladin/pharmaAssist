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
  template: `
    <div class="tender-form-page">
      <div class="page-header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div class="header-content">
            <h1 class="page-title">
              {{ isEditMode ? ('TENDERS.FORM.EDIT_TITLE' | translate) : ('TENDERS.FORM.CREATE_TITLE' | translate) }}
            </h1>
            @if (isEditMode && tender()) {
              <p class="page-subtitle">{{ tender()?.tenderNumber }}</p>
            }
          </div>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-sections">
          <!-- Basic Information -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.FORM.BASIC_INFO' | translate }}</h2>

            <div class="form-row">
              <div class="form-group flex-2">
                <label for="title" class="form-label required">{{ 'TENDERS.FIELD.TITLE' | translate }}</label>
                <input type="text" id="title" formControlName="title" class="form-input"
                       [class.invalid]="form.get('title')?.invalid && form.get('title')?.touched">
                @if (form.get('title')?.invalid && form.get('title')?.touched) {
                  <span class="error-message">{{ 'VALIDATION.REQUIRED' | translate }}</span>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="type" class="form-label required">{{ 'TENDERS.FIELD.TYPE' | translate }}</label>
                <select id="type" formControlName="type" class="form-select">
                  @for (type of types; track type) {
                    <option [value]="type">{{ tenderTypeLabels[type] | translate }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="priority" class="form-label required">{{ 'TENDERS.FIELD.PRIORITY' | translate }}</label>
                <select id="priority" formControlName="priority" class="form-select">
                  @for (priority of priorities; track priority) {
                    <option [value]="priority">{{ tenderPriorityLabels[priority] | translate }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="customerId" class="form-label required">{{ 'TENDERS.FIELD.CUSTOMER' | translate }}</label>
                <select id="customerId" formControlName="customerId" class="form-select"
                        [class.invalid]="form.get('customerId')?.invalid && form.get('customerId')?.touched">
                  <option [ngValue]="null">{{ 'TENDERS.FORM.SELECT_CUSTOMER' | translate }}</option>
                  @for (customer of customers(); track customer.id) {
                    <option [value]="customer.id">{{ customer.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label for="description" class="form-label">{{ 'TENDERS.FIELD.DESCRIPTION' | translate }}</label>
                <textarea id="description" formControlName="description" class="form-textarea" rows="4"></textarea>
              </div>
            </div>
          </div>

          <!-- Dates -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.FORM.DATES' | translate }}</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="submissionDeadline" class="form-label required">{{ 'TENDERS.FIELD.DEADLINE' | translate }}</label>
                <input type="datetime-local" id="submissionDeadline" formControlName="submissionDeadline" class="form-input"
                       [class.invalid]="form.get('submissionDeadline')?.invalid && form.get('submissionDeadline')?.touched">
              </div>
              <div class="form-group">
                <label for="openingDate" class="form-label">{{ 'TENDERS.FIELD.OPENING_DATE' | translate }}</label>
                <input type="datetime-local" id="openingDate" formControlName="openingDate" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="contractStartDate" class="form-label">{{ 'TENDERS.FIELD.CONTRACT_START' | translate }}</label>
                <input type="date" id="contractStartDate" formControlName="contractStartDate" class="form-input">
              </div>
              <div class="form-group">
                <label for="contractEndDate" class="form-label">{{ 'TENDERS.FIELD.CONTRACT_END' | translate }}</label>
                <input type="date" id="contractEndDate" formControlName="contractEndDate" class="form-input">
              </div>
            </div>
          </div>

          <!-- Financial -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.FORM.FINANCIAL' | translate }}</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="estimatedValue" class="form-label">{{ 'TENDERS.FIELD.ESTIMATED_VALUE' | translate }}</label>
                <div class="input-group">
                  <input type="number" id="estimatedValue" formControlName="estimatedValue" class="form-input" step="0.01">
                  <span class="input-suffix">{{ form.get('currency')?.value }}</span>
                </div>
              </div>
              <div class="form-group">
                <label for="budget" class="form-label">{{ 'TENDERS.FIELD.BUDGET' | translate }}</label>
                <div class="input-group">
                  <input type="number" id="budget" formControlName="budget" class="form-input" step="0.01">
                  <span class="input-suffix">{{ form.get('currency')?.value }}</span>
                </div>
              </div>
              <div class="form-group">
                <label for="bidSecurityAmount" class="form-label">{{ 'TENDERS.FIELD.BID_SECURITY' | translate }}</label>
                <div class="input-group">
                  <input type="number" id="bidSecurityAmount" formControlName="bidSecurityAmount" class="form-input" step="0.01">
                  <span class="input-suffix">{{ form.get('currency')?.value }}</span>
                </div>
              </div>
              <div class="form-group">
                <label for="currency" class="form-label">{{ 'TENDERS.FIELD.CURRENCY' | translate }}</label>
                <select id="currency" formControlName="currency" class="form-select">
                  <option value="BAM">BAM</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Delivery & Terms -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.FORM.TERMS' | translate }}</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="deliveryLocation" class="form-label">{{ 'TENDERS.FIELD.DELIVERY_LOCATION' | translate }}</label>
                <input type="text" id="deliveryLocation" formControlName="deliveryLocation" class="form-input">
              </div>
              <div class="form-group">
                <label for="deliveryTerms" class="form-label">{{ 'TENDERS.FIELD.DELIVERY_TERMS' | translate }}</label>
                <input type="text" id="deliveryTerms" formControlName="deliveryTerms" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="paymentTerms" class="form-label">{{ 'TENDERS.FIELD.PAYMENT_TERMS' | translate }}</label>
                <input type="text" id="paymentTerms" formControlName="paymentTerms" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label for="specialConditions" class="form-label">{{ 'TENDERS.FIELD.SPECIAL_CONDITIONS' | translate }}</label>
                <textarea id="specialConditions" formControlName="specialConditions" class="form-textarea" rows="3"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label for="evaluationCriteria" class="form-label">{{ 'TENDERS.FIELD.EVALUATION_CRITERIA' | translate }}</label>
                <textarea id="evaluationCriteria" formControlName="evaluationCriteria" class="form-textarea" rows="3"
                          placeholder="{{ 'TENDERS.FORM.EVALUATION_PLACEHOLDER' | translate }}"></textarea>
              </div>
            </div>
          </div>

          <!-- Contact -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.FORM.CONTACT' | translate }}</h2>

            <div class="form-row">
              <div class="form-group">
                <label for="contactPerson" class="form-label">{{ 'TENDERS.FIELD.CONTACT_PERSON' | translate }}</label>
                <input type="text" id="contactPerson" formControlName="contactPerson" class="form-input">
              </div>
              <div class="form-group">
                <label for="contactEmail" class="form-label">{{ 'TENDERS.FIELD.CONTACT_EMAIL' | translate }}</label>
                <input type="email" id="contactEmail" formControlName="contactEmail" class="form-input">
              </div>
              <div class="form-group">
                <label for="contactPhone" class="form-label">{{ 'TENDERS.FIELD.CONTACT_PHONE' | translate }}</label>
                <input type="tel" id="contactPhone" formControlName="contactPhone" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="assignedUserId" class="form-label">{{ 'TENDERS.FIELD.ASSIGNED_TO' | translate }}</label>
                <select id="assignedUserId" formControlName="assignedUserId" class="form-select">
                  <option [ngValue]="null">{{ 'TENDERS.FORM.SELECT_USER' | translate }}</option>
                  @for (user of users(); track user.id) {
                    <option [value]="user.id">{{ user.fullName }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Items (Edit mode only) -->
          @if (isEditMode) {
            <div class="form-section">
              <div class="section-header">
                <h2 class="section-title">{{ 'TENDERS.FORM.ITEMS' | translate }}</h2>
                <button type="button" class="btn btn-secondary btn-sm" (click)="addItem()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  {{ 'TENDERS.FORM.ADD_ITEM' | translate }}
                </button>
              </div>

              @if (items.length === 0) {
                <div class="empty-items">
                  <p>{{ 'TENDERS.FORM.NO_ITEMS' | translate }}</p>
                </div>
              } @else {
                <div class="items-list">
                  @for (item of items.controls; track $index; let i = $index) {
                    <div class="item-row" [formGroupName]="i">
                      <div class="item-fields">
                        <div class="form-group flex-2">
                          <label class="form-label required">{{ 'TENDERS.ITEMS.DESCRIPTION' | translate }}</label>
                          <input type="text" formControlName="description" class="form-input">
                        </div>
                        <div class="form-group">
                          <label class="form-label">{{ 'TENDERS.ITEMS.QUANTITY' | translate }}</label>
                          <input type="number" formControlName="quantity" class="form-input" step="1">
                        </div>
                        <div class="form-group">
                          <label class="form-label">{{ 'TENDERS.ITEMS.UNIT' | translate }}</label>
                          <input type="text" formControlName="unit" class="form-input" placeholder="kom">
                        </div>
                        <div class="form-group">
                          <label class="form-label">{{ 'TENDERS.ITEMS.UNIT_PRICE' | translate }}</label>
                          <input type="number" formControlName="estimatedUnitPrice" class="form-input" step="0.01">
                        </div>
                      </div>
                      <button type="button" class="btn-remove" (click)="removeItem(i)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="goBack()">
            {{ 'COMMON.CANCEL' | translate }}
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
            @if (saving()) {
              <span class="spinner"></span>
            }
            {{ isEditMode ? ('COMMON.SAVE' | translate) : ('TENDERS.FORM.CREATE' | translate) }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .tender-form-page {
      padding: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .btn-back {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background: var(--bg-primary);
      cursor: pointer;
      color: var(--text-secondary);
    }

    .btn-back:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .form-sections {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .section-header .section-title {
      margin: 0;
      border-bottom: none;
      padding-bottom: 0;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-row:last-child {
      margin-bottom: 0;
    }

    .form-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-group.flex-2 {
      flex: 2;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-label.required::after {
      content: ' *';
      color: #dc2626;
    }

    .form-input, .form-select, .form-textarea {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background: var(--bg-primary);
      color: var(--text-primary);
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
    }

    .form-input.invalid, .form-select.invalid {
      border-color: #dc2626;
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .input-group {
      display: flex;
      align-items: stretch;
    }

    .input-group .form-input {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    .input-suffix {
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-left: none;
      border-radius: 0 0.375rem 0.375rem 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .error-message {
      font-size: 0.75rem;
      color: #dc2626;
    }

    /* Items */
    .empty-items {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border-radius: 0.375rem;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .item-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 0.375rem;
    }

    .item-fields {
      flex: 1;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .item-fields .form-group {
      flex: 1;
      min-width: 150px;
    }

    .btn-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 0.25rem;
      margin-top: 1.5rem;
    }

    .btn-remove:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-size: 0.875rem;
      transition: all 0.15s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary);
      color: white;
    }

    .btn-secondary {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }

      .form-group.flex-2 {
        flex: 1;
      }
    }
  `]
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
