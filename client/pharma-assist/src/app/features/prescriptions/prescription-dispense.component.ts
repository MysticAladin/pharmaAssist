import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PrescriptionService } from '../../core/services/prescription.service';
import { NotificationService } from '../../core/services/notification.service';
import { Prescription, PrescriptionItem, DispenseItem } from '../../core/models/prescription.model';

@Component({
  selector: 'app-prescription-dispense',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="dispense-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (prescription()) {
        <!-- Header -->
        <div class="page-header">
          <button class="btn-back" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            {{ 'common.back' | translate }}
          </button>
          <div class="header-content">
            <h1>{{ 'prescriptions.dispenseMedications' | translate }}</h1>
            <p class="subtitle">{{ prescription()!.prescriptionNumber }} - {{ prescription()!.patientName }}</p>
          </div>
        </div>

        <!-- Dispense Form -->
        <div class="dispense-card">
          <div class="card-header">
            <h2>{{ 'prescriptions.itemsToDispense' | translate }}</h2>
            <p class="info-text">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              {{ 'prescriptions.dispenseInfo' | translate }}
            </p>
          </div>

          <div class="items-list">
            @for (item of prescription()!.items; track item.id; let i = $index) {
              <div class="item-card" [class.dispensed]="item.isDispensed">
                <div class="item-header">
                  <div class="item-info">
                    <span class="item-name">{{ item.productName }}</span>
                    <span class="item-sku">{{ item.productSku }}</span>
                  </div>
                  @if (item.isDispensed) {
                    <span class="dispensed-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {{ 'prescriptions.alreadyDispensed' | translate }}
                    </span>
                  }
                </div>

                <div class="item-details">
                  <div class="detail">
                    <span class="label">{{ 'prescriptions.prescribedQty' | translate }}</span>
                    <span class="value">{{ item.quantity }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">{{ 'prescriptions.dosage' | translate }}</span>
                    <span class="value">{{ item.dosage }}</span>
                  </div>
                  <div class="detail">
                    <span class="label">{{ 'prescriptions.refills' | translate }}</span>
                    <span class="value">{{ item.refillsUsed }}/{{ item.refillsAllowed }}</span>
                  </div>
                </div>

                <div class="item-instructions">
                  <span class="label">{{ 'prescriptions.instructions' | translate }}:</span>
                  <span class="value">{{ item.instructions }}</span>
                </div>

                @if (!item.isDispensed) {
                  <div class="dispense-inputs">
                    <div class="input-group">
                      <label>{{ 'prescriptions.quantityToDispense' | translate }}</label>
                      <input type="number"
                             [min]="1"
                             [max]="item.quantity"
                             [(ngModel)]="dispenseItems[i].quantityDispensed"
                             [placeholder]="item.quantity.toString()">
                    </div>
                    <div class="input-group">
                      <label>{{ 'prescriptions.batchNumber' | translate }}</label>
                      <input type="text"
                             [(ngModel)]="dispenseItems[i].batchNumber"
                             placeholder="e.g., LOT-2024-001">
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Notes -->
          <div class="notes-section">
            <label>{{ 'prescriptions.dispenseNotes' | translate }}</label>
            <textarea
              [(ngModel)]="notes"
              rows="3"
              [placeholder]="'prescriptions.dispenseNotesPlaceholder' | translate"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="actions">
            <button class="btn btn-secondary" (click)="goBack()">
              {{ 'common.cancel' | translate }}
            </button>
            <button class="btn btn-primary" [disabled]="submitting() || !hasItemsToDispense()" (click)="submitDispense()">
              @if (submitting()) {
                <span class="spinner-sm"></span>
              }
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {{ 'prescriptions.confirmDispense' | translate }}
            </button>
          </div>
        </div>

        <!-- Patient Counseling Checklist -->
        <div class="counseling-card">
          <h2>{{ 'prescriptions.patientCounseling' | translate }}</h2>
          <div class="checklist">
            <label class="check-item">
              <input type="checkbox" [(ngModel)]="counseling.dosageExplained">
              <span>{{ 'prescriptions.counseling.dosageExplained' | translate }}</span>
            </label>
            <label class="check-item">
              <input type="checkbox" [(ngModel)]="counseling.sideEffectsDiscussed">
              <span>{{ 'prescriptions.counseling.sideEffectsDiscussed' | translate }}</span>
            </label>
            <label class="check-item">
              <input type="checkbox" [(ngModel)]="counseling.interactionsReviewed">
              <span>{{ 'prescriptions.counseling.interactionsReviewed' | translate }}</span>
            </label>
            <label class="check-item">
              <input type="checkbox" [(ngModel)]="counseling.storageInstructionsGiven">
              <span>{{ 'prescriptions.counseling.storageInstructionsGiven' | translate }}</span>
            </label>
            <label class="check-item">
              <input type="checkbox" [(ngModel)]="counseling.patientQuestionsAnswered">
              <span>{{ 'prescriptions.counseling.patientQuestionsAnswered' | translate }}</span>
            </label>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0d9488;--c6:#dc2626;--c7:#22c55e}
    .dispense-page{padding:1.5rem;max-width:900px;margin:0 auto}

    .loading-state{display:flex;flex-direction:column;align-items:center;padding:4rem 2rem;color:var(--c2)}
    .spinner{width:40px;height:40px;border:3px solid var(--c3);border-top-color:var(--c5);border-radius:50%;animation:spin .8s linear infinite;margin-bottom:1rem}
    .spinner-sm{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    .page-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.5rem}
    .btn-back{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:none;border:1px solid var(--c3);border-radius:8px;color:var(--c2);font-size:.875rem;cursor:pointer;transition:all .2s}
    .btn-back:hover{border-color:var(--c5);color:var(--c5)}
    .header-content h1{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0}
    .subtitle{color:var(--c2);margin:.25rem 0 0;font-size:.9rem}

    .dispense-card,.counseling-card{background:#fff;border:1px solid var(--c3);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
    .card-header{margin-bottom:1.5rem}
    .card-header h2,.counseling-card h2{font-size:1.1rem;font-weight:600;color:var(--c1);margin:0 0 .5rem}
    .info-text{display:flex;align-items:center;gap:.5rem;color:var(--c2);font-size:.85rem;margin:0}

    .items-list{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem}
    .item-card{border:1px solid var(--c3);border-radius:10px;padding:1.25rem}
    .item-card.dispensed{background:var(--c4);opacity:.7}
    .item-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .item-name{font-weight:600;color:var(--c1);display:block}
    .item-sku{font-size:.8rem;color:var(--c2)}
    .dispensed-badge{display:inline-flex;align-items:center;gap:.375rem;padding:.375rem .75rem;background:#d1fae5;color:#059669;font-size:.75rem;font-weight:500;border-radius:6px}

    .item-details{display:flex;gap:2rem;margin-bottom:1rem;flex-wrap:wrap}
    .detail .label{display:block;font-size:.7rem;color:var(--c2);text-transform:uppercase;margin-bottom:.125rem}
    .detail .value{font-size:.9rem;font-weight:500;color:var(--c1)}

    .item-instructions{background:var(--c4);padding:.75rem 1rem;border-radius:6px;margin-bottom:1rem}
    .item-instructions .label{font-size:.75rem;color:var(--c2)}
    .item-instructions .value{font-size:.85rem;color:var(--c1)}

    .dispense-inputs{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:500px){.dispense-inputs{grid-template-columns:1fr}}
    .input-group label{display:block;font-size:.8rem;color:var(--c2);margin-bottom:.375rem}
    .input-group input{width:100%;padding:.625rem .875rem;border:1px solid var(--c3);border-radius:8px;font-size:.9rem}
    .input-group input:focus{outline:none;border-color:var(--c5);box-shadow:0 0 0 3px rgba(13,148,136,.1)}

    .notes-section{margin-bottom:1.5rem}
    .notes-section label{display:block;font-size:.875rem;font-weight:500;color:var(--c1);margin-bottom:.5rem}
    .notes-section textarea{width:100%;padding:.75rem 1rem;border:1px solid var(--c3);border-radius:8px;font-size:.9rem;resize:vertical}
    .notes-section textarea:focus{outline:none;border-color:var(--c5);box-shadow:0 0 0 3px rgba(13,148,136,.1)}

    .actions{display:flex;gap:.75rem;justify-content:flex-end}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;border:none;border-radius:8px;font-size:.9rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:var(--c4);color:var(--c2)}
    .btn-secondary:hover{background:var(--c3)}
    .btn-primary{background:var(--c5);color:#fff}
    .btn-primary:hover:not(:disabled){background:#0f766e}

    .checklist{display:flex;flex-direction:column;gap:.75rem}
    .check-item{display:flex;align-items:center;gap:.75rem;cursor:pointer;font-size:.9rem;color:var(--c1)}
    .check-item input{width:18px;height:18px;accent-color:var(--c5)}
  `]
})
export class PrescriptionDispenseComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(true);
  submitting = signal(false);
  prescription = signal<Prescription | null>(null);
  dispenseItems: DispenseItem[] = [];
  notes = '';

  counseling = {
    dosageExplained: false,
    sideEffectsDiscussed: false,
    interactionsReviewed: false,
    storageInstructionsGiven: false,
    patientQuestionsAnswered: false
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPrescription(id);
    }
  }

  private loadPrescription(id: string): void {
    this.loading.set(true);
    this.prescriptionService.getById(id).subscribe({
      next: (rx) => {
        this.prescription.set(rx);
        this.initDispenseItems(rx.items);
        this.loading.set(false);
      },
      error: () => {
        // Mock data for demo
        const mockRx = this.getMockPrescription(id);
        this.prescription.set(mockRx);
        this.initDispenseItems(mockRx.items);
        this.loading.set(false);
      }
    });
  }

  private initDispenseItems(items: PrescriptionItem[]): void {
    this.dispenseItems = items
      .filter(item => !item.isDispensed)
      .map(item => ({
        prescriptionItemId: item.id,
        quantityDispensed: item.quantity
      }));
  }

  goBack(): void {
    const rx = this.prescription();
    if (rx) {
      this.router.navigate(['/orders/prescriptions', rx.id]);
    } else {
      this.router.navigate(['/orders/prescriptions']);
    }
  }

  hasItemsToDispense(): boolean {
    const rx = this.prescription();
    return rx !== null && rx.items.some(item => !item.isDispensed);
  }

  submitDispense(): void {
    if (!this.hasItemsToDispense()) return;

    this.submitting.set(true);

    this.prescriptionService.dispense(this.prescription()!.id, {
      items: this.dispenseItems,
      notes: this.notes || undefined
    }).subscribe({
      next: () => {
        this.notificationService.success(
          'Medications dispensed',
          'The prescription items have been successfully dispensed'
        );
        this.router.navigate(['/orders/prescriptions', this.prescription()!.id]);
      },
      error: () => {
        this.notificationService.error('Error', 'Failed to dispense medications');
        this.submitting.set(false);
      }
    });
  }

  private getMockPrescription(id: string): Prescription {
    return {
      id,
      prescriptionNumber: 'RX-2024-001',
      customerId: 'c1',
      customerName: 'Apoteka Centar',
      patientName: 'Mira Hadžić',
      doctorName: 'Dr. Selma Kovač',
      issueDate: new Date('2024-12-01'),
      expiryDate: new Date('2024-12-31'),
      status: 2,
      priority: 1,
      isControlled: true,
      items: [
        { id: 'i1', productId: 1, productName: 'Tramadol 50mg', productSku: 'TRM-50', dosage: '50mg', quantity: 30, instructions: 'Take 1 tablet every 6 hours as needed for pain', duration: '10 days', refillsAllowed: 0, refillsUsed: 0, isDispensed: false },
        { id: 'i2', productId: 2, productName: 'Paracetamol 500mg', productSku: 'PAR-500', dosage: '500mg', quantity: 20, instructions: 'Take 1-2 tablets every 4-6 hours', duration: '7 days', refillsAllowed: 2, refillsUsed: 0, isDispensed: false }
      ],
      createdAt: new Date()
    };
  }
}
