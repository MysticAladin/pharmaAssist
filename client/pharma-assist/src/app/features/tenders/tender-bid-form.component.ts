import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { TenderService } from '../../core/services/tender.service';
import {
  TenderDetailDto,
  AddTenderBidDto,
  AddTenderBidItemDto
} from '../../core/models/tender.model';

@Component({
  selector: 'app-tender-bid-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    CurrencyPipe
  ],
  templateUrl: './tender-bid-form-component/tender-bid-form.component.html',
  styleUrls: ['./tender-bid-form-component/tender-bid-form.component.scss']
})
export class TenderBidFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenderService = inject(TenderService);

  readonly tender = signal<TenderDetailDto | null>(null);
  readonly loading = this.tenderService.loading;
  readonly saving = this.tenderService.saving;

  form!: FormGroup;

  readonly subtotal = computed(() => {
    const items = this.bidItems.controls;
    return items.reduce((sum, item) => {
      const qty = item.get('quantity')?.value || 0;
      const price = item.get('finalUnitPrice')?.value || 0;
      return sum + (qty * price);
    }, 0);
  });

  get bidItems(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTender(+id);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      totalAmount: [0, Validators.required],
      discountAmount: [0],
      finalAmount: [0, Validators.required],
      validityDays: [30],
      deliveryDays: [null],
      warrantyMonths: [null],
      paymentTerms: [''],
      technicalProposal: [''],
      notes: [''],
      items: this.fb.array([])
    });
  }

  loadTender(id: number): void {
    this.tenderService.getTender(id).subscribe({
      next: (tender) => {
        this.tender.set(tender);
        this.buildItemsForm(tender);
      },
      error: (err) => {
        console.error('Failed to load tender', err);
        this.router.navigate(['/tenders']);
      }
    });
  }

  buildItemsForm(tender: TenderDetailDto): void {
    this.bidItems.clear();
    tender.items.forEach(item => {
      this.bidItems.push(this.fb.group({
        tenderItemId: [item.id],
        productId: [item.productId],
        description: [item.description],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        unitPrice: [item.estimatedUnitPrice || 0, Validators.required],
        discountPercent: [0],
        finalUnitPrice: [item.estimatedUnitPrice || 0],
        deliveryDays: [null],
        warrantyMonths: [null],
        notes: ['']
      }));
    });

    // Calculate initial totals
    this.updateTotals();
  }

  calculateItemTotal(index: number): void {
    const item = this.bidItems.at(index);
    const unitPrice = item.get('unitPrice')?.value || 0;
    const discountPercent = item.get('discountPercent')?.value || 0;
    const finalUnitPrice = unitPrice * (1 - discountPercent / 100);
    item.get('finalUnitPrice')?.setValue(finalUnitPrice);
    this.updateTotals();
  }

  getItemTotal(index: number): number {
    const item = this.bidItems.at(index);
    const qty = item.get('quantity')?.value || 0;
    const finalPrice = item.get('finalUnitPrice')?.value || 0;
    return qty * finalPrice;
  }

  updateTotals(): void {
    const total = this.subtotal();
    this.form.get('totalAmount')?.setValue(total);
    this.calculateFinalAmount();
  }

  calculateFinalAmount(): void {
    const total = this.form.get('totalAmount')?.value || 0;
    const discount = this.form.get('discountAmount')?.value || 0;
    this.form.get('finalAmount')?.setValue(total - discount);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const tender = this.tender();
    if (!tender) return;

    const formValue = this.form.value;
    const bid: AddTenderBidDto = {
      totalAmount: formValue.totalAmount,
      discountAmount: formValue.discountAmount,
      finalAmount: formValue.finalAmount,
      validityDays: formValue.validityDays,
      deliveryDays: formValue.deliveryDays,
      warrantyMonths: formValue.warrantyMonths,
      paymentTerms: formValue.paymentTerms,
      technicalProposal: formValue.technicalProposal,
      notes: formValue.notes,
      items: formValue.items.map((item: any) => ({
        tenderItemId: item.tenderItemId,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        finalUnitPrice: item.finalUnitPrice,
        deliveryDays: item.deliveryDays,
        warrantyMonths: item.warrantyMonths,
        notes: item.notes
      }))
    };

    this.tenderService.addBid(tender.id, bid).subscribe({
      next: () => {
        this.router.navigate(['/tenders', tender.id]);
      },
      error: (err) => {
        console.error('Failed to create bid', err);
      }
    });
  }

  goBack(): void {
    const tender = this.tender();
    if (tender) {
      this.router.navigate(['/tenders', tender.id]);
    } else {
      this.router.navigate(['/tenders']);
    }
  }
}
