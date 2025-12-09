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
  template: `
    <div class="bid-form-page">
      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
        </div>
      } @else if (tender()) {
        <div class="page-header">
          <div class="header-left">
            <button class="btn-back" (click)="goBack()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="header-content">
              <h1 class="page-title">{{ 'TENDERS.BID_FORM.TITLE' | translate }}</h1>
              <p class="page-subtitle">{{ tender()?.tenderNumber }} - {{ tender()?.title }}</p>
            </div>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Tender Items -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.BID_FORM.ITEMS' | translate }}</h2>
            
            <div class="items-table-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>{{ 'TENDERS.ITEMS.DESCRIPTION' | translate }}</th>
                    <th class="text-right">{{ 'TENDERS.ITEMS.QUANTITY' | translate }}</th>
                    <th class="text-right">{{ 'TENDERS.BID_FORM.UNIT_PRICE' | translate }}</th>
                    <th class="text-right">{{ 'TENDERS.BID_FORM.DISCOUNT' | translate }}</th>
                    <th class="text-right">{{ 'TENDERS.BID_FORM.FINAL_PRICE' | translate }}</th>
                    <th class="text-right">{{ 'TENDERS.BID_FORM.TOTAL' | translate }}</th>
                  </tr>
                </thead>
                <tbody formArrayName="items">
                  @for (item of bidItems.controls; track $index; let i = $index) {
                    <tr [formGroupName]="i">
                      <td>
                        <div class="item-info">
                          <span class="description">{{ tender()!.items[i].description }}</span>
                          @if (tender()!.items[i].specification) {
                            <span class="specification">{{ tender()!.items[i].specification }}</span>
                          }
                        </div>
                      </td>
                      <td class="text-right">
                        <input type="number" formControlName="quantity" class="form-input narrow" step="1">
                      </td>
                      <td class="text-right">
                        <input type="number" formControlName="unitPrice" class="form-input narrow" step="0.01"
                               (input)="calculateItemTotal(i)">
                      </td>
                      <td class="text-right">
                        <div class="input-group narrow">
                          <input type="number" formControlName="discountPercent" class="form-input" step="0.01"
                                 (input)="calculateItemTotal(i)">
                          <span class="input-suffix">%</span>
                        </div>
                      </td>
                      <td class="text-right">
                        {{ item.get('finalUnitPrice')?.value | currency:tender()!.currency:'symbol':'1.2-2' }}
                      </td>
                      <td class="text-right font-semibold">
                        {{ getItemTotal(i) | currency:tender()!.currency:'symbol':'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="5" class="text-right"><strong>{{ 'TENDERS.BID_FORM.SUBTOTAL' | translate }}</strong></td>
                    <td class="text-right"><strong>{{ subtotal() | currency:tender()!.currency:'symbol':'1.2-2' }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Bid Summary -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.BID_FORM.SUMMARY' | translate }}</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ 'TENDERS.BID_FORM.TOTAL_AMOUNT' | translate }}</label>
                <div class="input-group">
                  <input type="number" formControlName="totalAmount" class="form-input" step="0.01">
                  <span class="input-suffix">{{ tender()!.currency }}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ 'TENDERS.BID_FORM.DISCOUNT_AMOUNT' | translate }}</label>
                <div class="input-group">
                  <input type="number" formControlName="discountAmount" class="form-input" step="0.01"
                         (input)="calculateFinalAmount()">
                  <span class="input-suffix">{{ tender()!.currency }}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ 'TENDERS.BID_FORM.FINAL_AMOUNT' | translate }}</label>
                <div class="input-group">
                  <input type="number" formControlName="finalAmount" class="form-input" step="0.01">
                  <span class="input-suffix">{{ tender()!.currency }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bid Details -->
          <div class="form-section">
            <h2 class="section-title">{{ 'TENDERS.BID_FORM.DETAILS' | translate }}</h2>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ 'TENDERS.BID_FORM.VALIDITY_DAYS' | translate }}</label>
                <div class="input-group">
                  <input type="number" formControlName="validityDays" class="form-input" min="1">
                  <span class="input-suffix">{{ 'COMMON.DAYS' | translate }}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ 'TENDERS.BID_FORM.DELIVERY_DAYS' | translate }}</label>
                <div class="input-group">
                  <input type="number" formControlName="deliveryDays" class="form-input" min="1">
                  <span class="input-suffix">{{ 'COMMON.DAYS' | translate }}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ 'TENDERS.BID_FORM.WARRANTY_MONTHS' | translate }}</label>
                <div class="input-group">
                  <input type="number" formControlName="warrantyMonths" class="form-input" min="0">
                  <span class="input-suffix">{{ 'COMMON.MONTHS' | translate }}</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label">{{ 'TENDERS.BID_FORM.PAYMENT_TERMS' | translate }}</label>
                <input type="text" formControlName="paymentTerms" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label">{{ 'TENDERS.BID_FORM.TECHNICAL_PROPOSAL' | translate }}</label>
                <textarea formControlName="technicalProposal" class="form-textarea" rows="4"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label">{{ 'TENDERS.BID_FORM.NOTES' | translate }}</label>
                <textarea formControlName="notes" class="form-textarea" rows="3"></textarea>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">
              {{ 'COMMON.CANCEL' | translate }}
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) {
                <span class="spinner"></span>
              }
              {{ 'TENDERS.BID_FORM.SUBMIT' | translate }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .bid-form-page {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
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
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .form-section {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .items-table-container {
      overflow-x: auto;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table th {
      padding: 0.75rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-secondary);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .items-table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    .items-table tfoot td {
      background: var(--bg-secondary);
      font-weight: 600;
    }

    .text-right { text-align: right; }
    .font-semibold { font-weight: 600; }

    .item-info .description {
      display: block;
      font-weight: 500;
    }

    .item-info .specification {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
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

    .form-group.flex-2 { flex: 2; }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .form-input, .form-textarea {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }

    .form-input.narrow {
      width: 100px;
    }

    .input-group {
      display: flex;
    }

    .input-group.narrow {
      width: 100px;
    }

    .input-group .form-input {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      flex: 1;
    }

    .input-suffix {
      display: flex;
      align-items: center;
      padding: 0 0.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-left: none;
      border-radius: 0 0.375rem 0.375rem 0;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1rem;
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

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
    }
  `]
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
