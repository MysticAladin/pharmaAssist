import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CustomerService } from '../../core/services/customer.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  Customer,
  CustomerType,
  CustomerTier,
  AddressType,
  CreateCustomerRequest,
  UpdateCustomerRequest
} from '../../core/models/customer.model';

interface Canton {
  id: number;
  name: string;
  code: string;
}

interface City {
  id: number;
  name: string;
  cantonId: number;
}

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink],
  template: `
    <div class="customer-form-page">
      <!-- Header -->
      <div class="page-header">
        <a routerLink="/customers" class="btn-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          {{ 'common.back' | translate }}
        </a>
        <div class="header-content">
          <h1>{{ isEditMode() ? ('customers.editCustomer' | translate) : ('customers.addCustomer' | translate) }}</h1>
          <p class="subtitle">{{ isEditMode() ? ('customers.editSubtitle' | translate) : ('customers.addSubtitle' | translate) }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-container">
          <!-- Basic Information Section -->
          <div class="form-section">
            <h2>{{ 'customers.basicInfo' | translate }}</h2>

            <div class="form-grid">
              <div class="form-group full-width">
                <label for="name">{{ 'customers.form.name' | translate }} *</label>
                <input
                  type="text"
                  id="name"
                  formControlName="name"
                  [placeholder]="'customers.form.namePlaceholder' | translate"
                  [class.error]="isFieldInvalid('name')"
                >
                @if (isFieldInvalid('name')) {
                  <span class="error-text">{{ 'validation.required' | translate }}</span>
                }
              </div>

              <div class="form-group">
                <label for="customerType">{{ 'customers.form.type' | translate }} *</label>
                <select id="customerType" formControlName="customerType" [class.error]="isFieldInvalid('customerType')">
                  <option [ngValue]="null">{{ 'customers.selectType' | translate }}</option>
                  @for (type of customerTypes; track type.value) {
                    <option [ngValue]="type.value">{{ type.label | translate }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="tier">{{ 'customers.form.tier' | translate }} *</label>
                <select id="tier" formControlName="tier" [class.error]="isFieldInvalid('tier')">
                  @for (tier of tiers; track tier.value) {
                    <option [ngValue]="tier.value">{{ tier.label | translate }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Contact Information Section -->
          <div class="form-section">
            <h2>{{ 'customers.contactInfo' | translate }}</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="email">{{ 'customers.form.email' | translate }} *</label>
                <input
                  type="email"
                  id="email"
                  formControlName="email"
                  [placeholder]="'customers.form.emailPlaceholder' | translate"
                  [class.error]="isFieldInvalid('email')"
                >
                @if (isFieldInvalid('email')) {
                  <span class="error-text">{{ getEmailError() }}</span>
                }
              </div>

              <div class="form-group">
                <label for="phone">{{ 'customers.form.phone' | translate }}</label>
                <input
                  type="tel"
                  id="phone"
                  formControlName="phone"
                  [placeholder]="'customers.form.phonePlaceholder' | translate"
                >
              </div>

              <div class="form-group full-width">
                <label for="contactPerson">{{ 'customers.form.contactPerson' | translate }}</label>
                <input
                  type="text"
                  id="contactPerson"
                  formControlName="contactPerson"
                  [placeholder]="'customers.form.contactPersonPlaceholder' | translate"
                >
              </div>
            </div>
          </div>

          <!-- Business Details Section -->
          <div class="form-section">
            <h2>{{ 'customers.businessDetails' | translate }}</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="taxId">{{ 'customers.form.taxId' | translate }}</label>
                <input
                  type="text"
                  id="taxId"
                  formControlName="taxId"
                  [placeholder]="'customers.form.taxIdPlaceholder' | translate"
                >
              </div>

              <div class="form-group">
                <label for="registrationNumber">{{ 'customers.form.registrationNumber' | translate }}</label>
                <input
                  type="text"
                  id="registrationNumber"
                  formControlName="registrationNumber"
                  [placeholder]="'customers.form.registrationNumberPlaceholder' | translate"
                >
              </div>

              @if (showPharmacyLicense()) {
                <div class="form-group">
                  <label for="pharmacyLicense">{{ 'customers.form.pharmacyLicense' | translate }}</label>
                  <input
                    type="text"
                    id="pharmacyLicense"
                    formControlName="pharmacyLicense"
                    [placeholder]="'customers.form.pharmacyLicensePlaceholder' | translate"
                  >
                </div>
              }
            </div>
          </div>

          <!-- Financial Terms Section -->
          <div class="form-section">
            <h2>{{ 'customers.financialTerms' | translate }}</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="discountPercentage">{{ 'customers.form.discount' | translate }} (%)</label>
                <input
                  type="number"
                  id="discountPercentage"
                  formControlName="discountPercentage"
                  min="0"
                  max="100"
                  step="0.5"
                >
              </div>

              <div class="form-group">
                <label for="creditLimit">{{ 'customers.form.creditLimit' | translate }} (BAM)</label>
                <input
                  type="number"
                  id="creditLimit"
                  formControlName="creditLimit"
                  min="0"
                  step="100"
                >
              </div>

              <div class="form-group">
                <label for="paymentTermDays">{{ 'customers.form.paymentTerms' | translate }}</label>
                <select id="paymentTermDays" formControlName="paymentTermDays">
                  <option [ngValue]="0">{{ 'customers.paymentTerms.immediate' | translate }}</option>
                  <option [ngValue]="7">{{ 'customers.paymentTerms.net7' | translate }}</option>
                  <option [ngValue]="15">{{ 'customers.paymentTerms.net15' | translate }}</option>
                  <option [ngValue]="30">{{ 'customers.paymentTerms.net30' | translate }}</option>
                  <option [ngValue]="45">{{ 'customers.paymentTerms.net45' | translate }}</option>
                  <option [ngValue]="60">{{ 'customers.paymentTerms.net60' | translate }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Primary Address Section -->
          <div class="form-section" formGroupName="primaryAddress">
            <h2>{{ 'customers.primaryAddress' | translate }}</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="canton">{{ 'customers.form.canton' | translate }} *</label>
                <select id="canton" formControlName="cantonId" (change)="onCantonChange()" [class.error]="isAddressFieldInvalid('cantonId')">
                  <option [ngValue]="null">{{ 'customers.selectCanton' | translate }}</option>
                  @for (canton of cantons(); track canton.id) {
                    <option [ngValue]="canton.id">{{ canton.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="city">{{ 'customers.form.city' | translate }} *</label>
                <select id="city" formControlName="cityId" [class.error]="isAddressFieldInvalid('cityId')">
                  <option [ngValue]="null">{{ 'customers.selectCity' | translate }}</option>
                  @for (city of filteredCities(); track city.id) {
                    <option [ngValue]="city.id">{{ city.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group full-width">
                <label for="street">{{ 'customers.form.street' | translate }} *</label>
                <input
                  type="text"
                  id="street"
                  formControlName="street"
                  [placeholder]="'customers.form.streetPlaceholder' | translate"
                  [class.error]="isAddressFieldInvalid('street')"
                >
              </div>

              <div class="form-group">
                <label for="buildingNumber">{{ 'customers.form.buildingNumber' | translate }}</label>
                <input
                  type="text"
                  id="buildingNumber"
                  formControlName="buildingNumber"
                  placeholder="e.g., 12A"
                >
              </div>

              <div class="form-group">
                <label for="postalCode">{{ 'customers.form.postalCode' | translate }} *</label>
                <input
                  type="text"
                  id="postalCode"
                  formControlName="postalCode"
                  placeholder="e.g., 71000"
                  [class.error]="isAddressFieldInvalid('postalCode')"
                >
              </div>

              <div class="form-group">
                <label for="addressType">{{ 'customers.form.addressType' | translate }}</label>
                <select id="addressType" formControlName="addressType">
                  @for (type of addressTypes; track type.value) {
                    <option [ngValue]="type.value">{{ type.label | translate }}</option>
                  }
                </select>
              </div>

              <div class="form-group full-width">
                <label for="addressNotes">{{ 'customers.form.addressNotes' | translate }}</label>
                <textarea
                  id="addressNotes"
                  formControlName="notes"
                  rows="2"
                  [placeholder]="'customers.form.addressNotesPlaceholder' | translate"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <a routerLink="/customers" class="btn btn-secondary">
              {{ 'common.cancel' | translate }}
            </a>
            <button type="submit" class="btn btn-primary" [disabled]="submitting() || form.invalid">
              @if (submitting()) {
                <span class="spinner-sm"></span>
              }
              {{ isEditMode() ? ('common.update' | translate) : ('common.create' | translate) }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0d9488;--c6:#dc2626}
    .customer-form-page{padding:1.5rem;max-width:900px;margin:0 auto}

    .page-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.5rem}
    .btn-back{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:none;border:1px solid var(--c3);border-radius:8px;color:var(--c2);font-size:.875rem;cursor:pointer;text-decoration:none;transition:all .2s}
    .btn-back:hover{border-color:var(--c5);color:var(--c5)}
    .header-content h1{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0}
    .subtitle{color:var(--c2);margin:.25rem 0 0;font-size:.9rem}

    .loading-state{display:flex;flex-direction:column;align-items:center;padding:4rem 2rem;color:var(--c2)}
    .spinner{width:40px;height:40px;border:3px solid var(--c3);border-top-color:var(--c5);border-radius:50%;animation:spin .8s linear infinite;margin-bottom:1rem}
    .spinner-sm{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    .form-container{display:flex;flex-direction:column;gap:1.5rem}

    .form-section{background:#fff;border:1px solid var(--c3);border-radius:12px;padding:1.5rem}
    .form-section h2{font-size:1.1rem;font-weight:600;color:var(--c1);margin:0 0 1.25rem;padding-bottom:.75rem;border-bottom:1px solid var(--c3)}

    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:600px){.form-grid{grid-template-columns:1fr}}
    .form-group.full-width{grid-column:span 2}
    @media(max-width:600px){.form-group.full-width{grid-column:span 1}}

    .form-group{display:flex;flex-direction:column;gap:.375rem}
    .form-group label{font-size:.875rem;font-weight:500;color:var(--c1)}

    .form-group input,.form-group select,.form-group textarea{padding:.75rem 1rem;border:1px solid var(--c3);border-radius:8px;font-size:.9rem;transition:all .2s}
    .form-group input:focus,.form-group select:focus,.form-group textarea:focus{outline:none;border-color:var(--c5);box-shadow:0 0 0 3px rgba(13,148,136,.1)}
    .form-group input.error,.form-group select.error,.form-group textarea.error{border-color:var(--c6)}
    .form-group textarea{resize:vertical;min-height:70px}

    .error-text{color:var(--c6);font-size:.75rem}

    .form-actions{display:flex;gap:.75rem;justify-content:flex-end;padding-top:1rem}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;border:none;border-radius:8px;font-size:.9rem;font-weight:500;cursor:pointer;text-decoration:none;transition:all .2s}
    .btn:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:var(--c4);color:var(--c2)}
    .btn-secondary:hover{background:var(--c3)}
    .btn-primary{background:var(--c5);color:#fff}
    .btn-primary:hover:not(:disabled){background:#0f766e}
  `]
})
export class CustomerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(false);
  submitting = signal(false);
  isEditMode = signal(false);
  customerId = signal<number | null>(null);

  cantons = signal<Canton[]>([]);
  cities = signal<City[]>([]);
  filteredCities = signal<City[]>([]);

  form!: FormGroup;

  customerTypes = [
    { value: CustomerType.Pharmacy, label: 'customers.types.pharmacy' },
    { value: CustomerType.Hospital, label: 'customers.types.hospital' },
    { value: CustomerType.Clinic, label: 'customers.types.clinic' },
    { value: CustomerType.Wholesale, label: 'customers.types.wholesale' },
    { value: CustomerType.Retail, label: 'customers.types.retail' },
    { value: CustomerType.Other, label: 'customers.types.other' }
  ];

  tiers = [
    { value: CustomerTier.A, label: 'customers.tiers.premium' },
    { value: CustomerTier.B, label: 'customers.tiers.standard' },
    { value: CustomerTier.C, label: 'customers.tiers.basic' }
  ];

  addressTypes = [
    { value: AddressType.Both, label: 'customers.addressTypes.both' },
    { value: AddressType.Billing, label: 'customers.addressTypes.billing' },
    { value: AddressType.Shipping, label: 'customers.addressTypes.shipping' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadReferenceData();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.customerId.set(+id);
      this.loadCustomer(+id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      customerType: [null, Validators.required],
      tier: [CustomerTier.B, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      contactPerson: [''],
      taxId: [''],
      registrationNumber: [''],
      pharmacyLicense: [''],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      creditLimit: [5000, Validators.min(0)],
      paymentTermDays: [30],
      primaryAddress: this.fb.group({
        addressType: [AddressType.Both],
        street: ['', Validators.required],
        buildingNumber: [''],
        postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        cityId: [null, Validators.required],
        cantonId: [null, Validators.required],
        isPrimary: [true],
        notes: ['']
      })
    });
  }

  private loadReferenceData(): void {
    // Mock cantons data (would come from API)
    this.cantons.set([
      { id: 1, name: 'Kanton Sarajevo', code: 'KS' },
      { id: 2, name: 'Tuzlanski kanton', code: 'TK' },
      { id: 3, name: 'Zeničko-dobojski kanton', code: 'ZDK' },
      { id: 4, name: 'Unsko-sanski kanton', code: 'USK' },
      { id: 5, name: 'Srednjobosanski kanton', code: 'SBK' },
      { id: 6, name: 'Hercegovačko-neretvanski kanton', code: 'HNK' },
      { id: 7, name: 'Zapadnohercegovački kanton', code: 'ZHK' },
      { id: 8, name: 'Posavski kanton', code: 'PK' },
      { id: 9, name: 'Bosansko-podrinjski kanton', code: 'BPK' },
      { id: 10, name: 'Kanton 10', code: 'K10' }
    ]);

    this.cities.set([
      { id: 1, name: 'Sarajevo', cantonId: 1 },
      { id: 2, name: 'Ilidža', cantonId: 1 },
      { id: 3, name: 'Hadžići', cantonId: 1 },
      { id: 4, name: 'Vogošća', cantonId: 1 },
      { id: 5, name: 'Tuzla', cantonId: 2 },
      { id: 6, name: 'Lukavac', cantonId: 2 },
      { id: 7, name: 'Gračanica', cantonId: 2 },
      { id: 8, name: 'Zenica', cantonId: 3 },
      { id: 9, name: 'Kakanj', cantonId: 3 },
      { id: 10, name: 'Visoko', cantonId: 3 },
      { id: 11, name: 'Bihać', cantonId: 4 },
      { id: 12, name: 'Cazin', cantonId: 4 },
      { id: 13, name: 'Travnik', cantonId: 5 },
      { id: 14, name: 'Vitez', cantonId: 5 },
      { id: 15, name: 'Mostar', cantonId: 6 },
      { id: 16, name: 'Čapljina', cantonId: 6 },
      { id: 17, name: 'Široki Brijeg', cantonId: 7 },
      { id: 18, name: 'Orašje', cantonId: 8 },
      { id: 19, name: 'Goražde', cantonId: 9 },
      { id: 20, name: 'Livno', cantonId: 10 }
    ]);
  }

  private loadCustomer(id: number): void {
    this.loading.set(true);
    this.customerService.getById(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.populateForm(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error', 'Failed to load customer');
        this.loading.set(false);
      }
    });
  }

  private populateForm(customer: Customer): void {
    this.form.patchValue({
      name: customer.name,
      customerType: customer.customerType,
      tier: customer.tier,
      email: customer.email,
      phone: customer.phone,
      contactPerson: customer.contactPerson,
      taxId: customer.taxId,
      registrationNumber: customer.registrationNumber,
      pharmacyLicense: customer.pharmacyLicense,
      discountPercentage: customer.discountPercentage,
      creditLimit: customer.creditLimit,
      paymentTermDays: customer.paymentTermDays
    });

    // Populate primary address if exists
    const primaryAddr = customer.addresses?.find(a => a.isPrimary);
    if (primaryAddr) {
      this.form.get('primaryAddress')?.patchValue({
        addressType: primaryAddr.addressType,
        street: primaryAddr.street,
        buildingNumber: primaryAddr.buildingNumber,
        postalCode: primaryAddr.postalCode,
        cityId: primaryAddr.cityId,
        cantonId: primaryAddr.cantonId,
        notes: primaryAddr.notes
      });
      this.onCantonChange();
    }
  }

  onCantonChange(): void {
    const cantonId = this.form.get('primaryAddress.cantonId')?.value;
    if (cantonId) {
      const filtered = this.cities().filter(c => c.cantonId === cantonId);
      this.filteredCities.set(filtered);
      // Reset city if not in filtered list
      const currentCityId = this.form.get('primaryAddress.cityId')?.value;
      if (currentCityId && !filtered.some(c => c.id === currentCityId)) {
        this.form.get('primaryAddress.cityId')?.setValue(null);
      }
    } else {
      this.filteredCities.set([]);
    }
  }

  showPharmacyLicense(): boolean {
    const type = this.form.get('customerType')?.value;
    return type === CustomerType.Pharmacy || type === CustomerType.Hospital || type === CustomerType.Clinic;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  isAddressFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(`primaryAddress.${fieldName}`);
    return field ? field.invalid && field.touched : false;
  }

  getEmailError(): string {
    const email = this.form.get('email');
    if (email?.hasError('required')) return 'validation.required';
    if (email?.hasError('email')) return 'validation.email';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    if (this.isEditMode()) {
      const updateData: UpdateCustomerRequest = {
        ...this.form.value,
        isActive: true
      };
      delete (updateData as any).primaryAddress;

      this.customerService.update(this.customerId()!, updateData).subscribe({
        next: () => {
          this.notificationService.success('Success', 'Customer updated successfully');
          this.router.navigate(['/customers', this.customerId()]);
        },
        error: () => {
          this.notificationService.error('Error', 'Failed to update customer');
          this.submitting.set(false);
        }
      });
    } else {
      const createData: CreateCustomerRequest = this.form.value;
      this.customerService.create(createData).subscribe({
        next: (response) => {
          this.notificationService.success('Success', 'Customer created successfully');
          this.router.navigate(['/customers', response.data?.id || '']);
        },
        error: () => {
          this.notificationService.error('Error', 'Failed to create customer');
          this.submitting.set(false);
        }
      });
    }
  }
}
