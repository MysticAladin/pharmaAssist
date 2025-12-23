import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { EuropeanDatePipe } from '../../core/pipes';

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
  imports: [CommonModule, TranslateModule, DatePipe, EuropeanDatePipe, StatusBadgeComponent],
  templateUrl: './prescription-detail-component/prescription-detail.component.html',
  styleUrls: ['./prescription-detail-component/prescription-detail.component.scss']
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
