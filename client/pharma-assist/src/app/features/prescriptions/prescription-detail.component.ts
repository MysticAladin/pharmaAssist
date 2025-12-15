import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PrescriptionService } from '../../core/services/prescription.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import {
  Prescription,
  PrescriptionStatus,
  getPrescriptionStatusLabel,
  getPrescriptionStatusColor,
  getPriorityLabel,
  getPriorityColor
} from '../../core/models/prescription.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, DatePipe, StatusBadgeComponent],
  template: `
    <div class="prescription-detail">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (prescription()) {
        <!-- Header -->
        <div class="detail-header">
          <button class="btn-back" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            {{ 'common.back' | translate }}
          </button>
          <div class="header-content">
            <div class="title-row">
              <h1>{{ prescription()!.prescriptionNumber }}</h1>
              <div class="badges">
                @if (prescription()!.isControlled) {
                  <span class="controlled-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    {{ 'prescriptions.controlled' | translate }}
                  </span>
                }
                <app-status-badge [variant]="getStatusColor(prescription()!.status)" [label]="getStatusLabel(prescription()!.status) | translate"></app-status-badge>
              </div>
            </div>
            <p class="subtitle">{{ 'prescriptions.submittedOn' | translate }} {{ prescription()!.createdAt | date:'medium' }}</p>
          </div>
          <div class="header-actions">
            @if (canReview()) {
              <button class="btn btn-success" (click)="approve()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {{ 'prescriptions.approve' | translate }}
              </button>
              <button class="btn btn-danger" (click)="reject()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                {{ 'prescriptions.reject' | translate }}
              </button>
            }
            @if (canDispense()) {
              <button class="btn btn-primary" (click)="dispense()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {{ 'prescriptions.dispense' | translate }}
              </button>
            }
          </div>
        </div>

        <!-- Content Grid -->
        <div class="detail-grid">
          <!-- Left Column: Prescription Image -->
          <div class="prescription-image-card">
            <h2>{{ 'prescriptions.prescriptionImage' | translate }}</h2>
            @if (prescription()!.fileUrl) {
              <div class="image-container">
                <img [src]="prescription()!.fileUrl" [alt]="prescription()!.prescriptionNumber">
                <div class="image-actions">
                  <button class="btn-icon" (click)="zoomImage()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </button>
                  <button class="btn-icon" (click)="downloadFile()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                </div>
              </div>
            } @else {
              <div class="no-image">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>{{ 'prescriptions.noImageAvailable' | translate }}</p>
              </div>
            }
          </div>

          <!-- Right Column: Details -->
          <div class="details-column">
            <!-- Prescription Info -->
            <div class="info-card">
              <h2>{{ 'prescriptions.prescriptionDetails' | translate }}</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">{{ 'prescriptions.rxNumber' | translate }}</span>
                  <span class="value">{{ prescription()!.prescriptionNumber }}</span>
                </div>
                <div class="info-item">
                  <span class="label">{{ 'prescriptions.issueDate' | translate }}</span>
                  <span class="value">{{ prescription()!.issueDate | date:'mediumDate' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">{{ 'prescriptions.expiryDate' | translate }}</span>
                  <span class="value" [class.expired]="isExpired()">{{ prescription()!.expiryDate | date:'mediumDate' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">{{ 'prescriptions.priorityLabel' | translate }}</span>
                  <app-status-badge [variant]="getPriorityColor(prescription()!.priority)" [label]="getPriorityLabel(prescription()!.priority) | translate"></app-status-badge>
                </div>
              </div>
            </div>

            <!-- Patient Info -->
            <div class="info-card">
              <h2>{{ 'prescriptions.patientInfo' | translate }}</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">{{ 'prescriptions.patientName' | translate }}</span>
                  <span class="value">{{ prescription()!.patientName }}</span>
                </div>
                @if (prescription()!.patientDateOfBirth) {
                  <div class="info-item">
                    <span class="label">{{ 'prescriptions.dateOfBirth' | translate }}</span>
                    <span class="value">{{ prescription()!.patientDateOfBirth | date:'mediumDate' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Doctor Info -->
            <div class="info-card">
              <h2>{{ 'prescriptions.doctorInfo' | translate }}</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">{{ 'prescriptions.doctorName' | translate }}</span>
                  <span class="value">{{ prescription()!.doctorName }}</span>
                </div>
                @if (prescription()!.doctorLicenseNumber) {
                  <div class="info-item">
                    <span class="label">{{ 'prescriptions.licenseNumber' | translate }}</span>
                    <span class="value">{{ prescription()!.doctorLicenseNumber }}</span>
                  </div>
                }
                @if (prescription()!.healthFacility) {
                  <div class="info-item full-width">
                    <span class="label">{{ 'prescriptions.healthFacility' | translate }}</span>
                    <span class="value">{{ prescription()!.healthFacility }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Customer Info -->
            <div class="info-card">
              <h2>{{ 'prescriptions.customerInfo' | translate }}</h2>
              <div class="info-grid">
                <div class="info-item full-width">
                  <span class="label">{{ 'prescriptions.customer' | translate }}</span>
                  <span class="value">{{ prescription()!.customerName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prescription Items -->
        <div class="items-card">
          <h2>{{ 'prescriptions.prescribedMedications' | translate }}</h2>
          <div class="items-table">
            <div class="table-header">
              <span>{{ 'prescriptions.medication' | translate }}</span>
              <span>{{ 'prescriptions.dosage' | translate }}</span>
              <span>{{ 'prescriptions.quantity' | translate }}</span>
              <span>{{ 'prescriptions.instructions' | translate }}</span>
              <span>{{ 'prescriptions.refills' | translate }}</span>
              <span>{{ 'prescriptions.status' | translate }}</span>
            </div>
            @for (item of prescription()!.items; track item.id) {
              <div class="table-row">
                <div class="medication-info">
                  <span class="name">{{ item.productName }}</span>
                  <span class="sku">{{ item.productSku }}</span>
                </div>
                <span>{{ item.dosage }}</span>
                <span>{{ item.quantity }}</span>
                <span class="instructions">{{ item.instructions }}</span>
                <span>{{ item.refillsUsed }}/{{ item.refillsAllowed }}</span>
                <span>
                  @if (item.isDispensed) {
                    <span class="dispensed-badge">{{ 'prescriptions.dispensed' | translate }}</span>
                  } @else {
                    <span class="pending-badge">{{ 'prescriptions.pending' | translate }}</span>
                  }
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Review History -->
        @if (prescription()!.reviewedAt) {
          <div class="review-card">
            <h2>{{ 'prescriptions.reviewHistory' | translate }}</h2>
            <div class="review-item">
              <div class="review-icon">
                @if (prescription()!.status === 2) {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                } @else {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                }
              </div>
              <div class="review-content">
                <p class="review-action">
                  {{ prescription()!.status === 2 ? ('prescriptions.approvedBy' | translate) : ('prescriptions.rejectedBy' | translate) }}
                  <strong>{{ prescription()!.reviewedBy }}</strong>
                </p>
                <p class="review-date">{{ prescription()!.reviewedAt | date:'medium' }}</p>
                @if (prescription()!.reviewNotes) {
                  <p class="review-notes">{{ prescription()!.reviewNotes }}</p>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#dc2626;--c7:#22c55e}
    .prescription-detail{padding:1.5rem;max-width:1200px;margin:0 auto}

    .loading-state{display:flex;flex-direction:column;align-items:center;padding:4rem 2rem;color:var(--c2)}
    .spinner{width:40px;height:40px;border:3px solid var(--c3);border-top-color:var(--c5);border-radius:50%;animation:spin .8s linear infinite;margin-bottom:1rem}
    @keyframes spin{to{transform:rotate(360deg)}}

    .detail-header{display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid var(--c3)}
    .btn-back{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:none;border:1px solid var(--c3);border-radius:8px;color:var(--c2);font-size:.875rem;cursor:pointer;transition:all .2s}
    .btn-back:hover{border-color:var(--c5);color:var(--c5)}
    .header-content{flex:1}
    .title-row{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
    .title-row h1{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0}
    .badges{display:flex;gap:.5rem}
    .controlled-badge{display:inline-flex;align-items:center;gap:.375rem;padding:.375rem .75rem;background:#fef2f2;color:#dc2626;font-size:.75rem;font-weight:500;border-radius:6px}
    .subtitle{color:var(--c2);font-size:.875rem;margin:.5rem 0 0}
    .header-actions{display:flex;gap:.75rem}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.25rem;border:none;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-primary{background:var(--c5);color:#fff}
    .btn-primary:hover{background:#088888}
    .btn-success{background:var(--c7);color:#fff}
    .btn-success:hover{background:#16a34a}
    .btn-danger{background:var(--c6);color:#fff}
    .btn-danger:hover{background:#b91c1c}

    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem}
    @media(max-width:900px){.detail-grid{grid-template-columns:1fr}}

    .prescription-image-card,.info-card,.items-card,.review-card{background:#fff;border:1px solid var(--c3);border-radius:12px;padding:1.5rem}
    .prescription-image-card h2,.info-card h2,.items-card h2,.review-card h2{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 1rem}

    .image-container{position:relative;border-radius:8px;overflow:hidden;background:var(--c4)}
    .image-container img{width:100%;height:auto;display:block}
    .image-actions{position:absolute;bottom:1rem;right:1rem;display:flex;gap:.5rem}
    .btn-icon{width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,.9);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
    .btn-icon:hover{background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.15)}
    .no-image{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem 2rem;color:var(--c2);background:var(--c4);border-radius:8px}
    .no-image p{margin:.75rem 0 0}

    .details-column{display:flex;flex-direction:column;gap:1rem}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    .info-item{display:flex;flex-direction:column;gap:.25rem}
    .info-item.full-width{grid-column:span 2}
    .info-item .label{font-size:.75rem;color:var(--c2)}
    .info-item .value{font-size:.9rem;font-weight:500;color:var(--c1)}
    .info-item .value.expired{color:var(--c6)}

    .items-table{border:1px solid var(--c3);border-radius:8px;overflow:hidden}
    .table-header{display:grid;grid-template-columns:2fr 1fr 80px 2fr 80px 100px;gap:1rem;padding:.75rem 1rem;background:var(--c4);font-size:.75rem;font-weight:600;color:var(--c2);text-transform:uppercase}
    .table-row{display:grid;grid-template-columns:2fr 1fr 80px 2fr 80px 100px;gap:1rem;padding:1rem;border-top:1px solid var(--c3);font-size:.875rem;align-items:center}
    .medication-info{display:flex;flex-direction:column}
    .medication-info .name{font-weight:500;color:var(--c1)}
    .medication-info .sku{font-size:.75rem;color:var(--c2)}
    .instructions{font-size:.8rem;color:var(--c2)}
    .dispensed-badge{display:inline-block;padding:.25rem .5rem;background:#d1fae5;color:#059669;font-size:.75rem;border-radius:4px}
    .pending-badge{display:inline-block;padding:.25rem .5rem;background:#fef3c7;color:#d97706;font-size:.75rem;border-radius:4px}

    .review-item{display:flex;gap:1rem}
    .review-icon{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .review-icon svg{stroke:#fff}
    .review-card .review-icon{background:var(--c7)}
    .review-content{flex:1}
    .review-action{margin:0;font-size:.9rem;color:var(--c1)}
    .review-date{margin:.25rem 0 0;font-size:.8rem;color:var(--c2)}
    .review-notes{margin:.75rem 0 0;padding:.75rem;background:var(--c4);border-radius:6px;font-size:.85rem;color:var(--c2)}

    @media(max-width:700px){
      .table-header,.table-row{grid-template-columns:1fr;gap:.5rem}
      .table-header{display:none}
      .table-row{display:block}
    }
  `]
})
export class PrescriptionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  loading = signal(true);
  prescription = signal<Prescription | null>(null);

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
        this.loading.set(false);
      },
      error: () => {
        // Mock data for demo
        this.prescription.set(this.getMockPrescription(id));
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/orders/prescriptions']);
  }

  canReview(): boolean {
    const rx = this.prescription();
    return rx !== null && (rx.status === PrescriptionStatus.Pending || rx.status === PrescriptionStatus.UnderReview);
  }

  canDispense(): boolean {
    const rx = this.prescription();
    return rx !== null && rx.status === PrescriptionStatus.Approved;
  }

  async approve(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'prescriptions.confirmApprove',
      message: 'prescriptions.confirmApproveMessage',
      confirmText: 'prescriptions.approve',
      variant: 'info'
    });

    if (confirmed) {
      this.prescriptionService.review(this.prescription()!.id, { approved: true }).subscribe({
        next: () => {
          this.notificationService.success('Prescription approved', 'The prescription has been approved');
          this.loadPrescription(this.prescription()!.id);
        },
        error: () => {
          this.notificationService.error('Error', 'Failed to approve prescription');
        }
      });
    }
  }

  async reject(): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'prescriptions.confirmReject',
      message: 'prescriptions.confirmRejectMessage',
      confirmText: 'prescriptions.reject',
      variant: 'danger'
    });

    if (confirmed) {
      this.prescriptionService.review(this.prescription()!.id, { approved: false }).subscribe({
        next: () => {
          this.notificationService.success('Prescription rejected', 'The prescription has been rejected');
          this.loadPrescription(this.prescription()!.id);
        },
        error: () => {
          this.notificationService.error('Error', 'Failed to reject prescription');
        }
      });
    }
  }

  dispense(): void {
    this.router.navigate(['/orders/prescriptions', this.prescription()!.id, 'dispense']);
  }

  isExpired(): boolean {
    const rx = this.prescription();
    return rx !== null && new Date(rx.expiryDate) < new Date();
  }

  zoomImage(): void {
    // TODO: Implement image zoom modal
  }

  downloadFile(): void {
    const rx = this.prescription();
    if (rx) {
      this.prescriptionService.downloadFile(rx.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = rx.fileName || `${rx.prescriptionNumber}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.notificationService.error('Error', 'Failed to download file');
        }
      });
    }
  }

  getStatusLabel = getPrescriptionStatusLabel;
  getStatusColor = getPrescriptionStatusColor;
  getPriorityLabel = getPriorityLabel;
  getPriorityColor = getPriorityColor;

  private getMockPrescription(id: string): Prescription {
    return {
      id,
      prescriptionNumber: 'RX-2024-001',
      customerId: 'c1',
      customerName: 'Apoteka Centar',
      patientName: 'Mira Hadžić',
      patientDateOfBirth: new Date('1985-03-15'),
      doctorName: 'Dr. Selma Kovač',
      doctorLicenseNumber: 'MD-12345',
      healthFacility: 'Klinički centar Sarajevo',
      issueDate: new Date('2024-12-01'),
      expiryDate: new Date('2024-12-31'),
      status: PrescriptionStatus.Pending,
      priority: 1,
      isControlled: true,
      fileUrl: 'https://via.placeholder.com/600x800?text=Prescription',
      fileName: 'prescription.pdf',
      items: [
        { id: 'i1', productId: 1, productName: 'Tramadol 50mg', productSku: 'TRM-50', dosage: '50mg', quantity: 30, instructions: 'Take 1 tablet every 6 hours as needed for pain', duration: '10 days', refillsAllowed: 0, refillsUsed: 0, isDispensed: false },
        { id: 'i2', productId: 2, productName: 'Paracetamol 500mg', productSku: 'PAR-500', dosage: '500mg', quantity: 20, instructions: 'Take 1-2 tablets every 4-6 hours', duration: '7 days', refillsAllowed: 2, refillsUsed: 0, isDispensed: false }
      ],
      createdAt: new Date()
    };
  }
}
