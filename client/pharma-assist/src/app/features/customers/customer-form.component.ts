import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '../../core/services/customer.service';
import { Canton, City, LocationService } from '../../core/services/location.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  Customer,
  CustomerType,
  CustomerTier,
  AddressType,
  CreateCustomerRequest,
  UpdateCustomerRequest
} from '../../core/models/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, RouterLink],
  templateUrl: './customer-form-component/customer-form.component.html',
  styleUrls: ['./customer-form-component/customer-form.component.scss']
})
export class CustomerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customerService = inject(CustomerService);
  private readonly locationService = inject(LocationService);
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
    this.locationService.getAllCantons().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const sorted = [...resp.data].sort((a, b) => a.name.localeCompare(b.name));
          this.cantons.set(sorted);
        }
      },
      error: (err) => {
        console.error('Error loading cantons:', err);
      }
    });

    this.locationService.getAllCities().subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          const sorted = [...resp.data].sort((a, b) => a.name.localeCompare(b.name));
          this.cities.set(sorted);
          // If canton already selected (e.g., edit mode), ensure cities are filtered.
          this.onCantonChange();
        }
      },
      error: (err) => {
        console.error('Error loading cities:', err);
      }
    });
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
      const currentCityId = this.form.get('primaryAddress.cityId')?.value;
      if (currentCityId && !filtered.some(c => c.id === currentCityId)) {
        this.form.get('primaryAddress.cityId')?.setValue(null);
      }
    } else {
      this.filteredCities.set([]);
      this.form.get('primaryAddress.cityId')?.setValue(null);
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
