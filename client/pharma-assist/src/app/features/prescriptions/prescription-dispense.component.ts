import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { EuropeanDatePipe } from '../../core/pipes';

import { PrescriptionService } from '../../core/services/prescription.service';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { PrintService, PrescriptionPrintData } from '../../core/services/print.service';
import { Prescription, PrescriptionItem, DispenseItem, PrescriptionStatus } from '../../core/models/prescription.model';
import { StatusBadgeComponent, BadgeVariant } from '../../shared/components/status-badge';

interface DispenseFormItem extends DispenseItem {
  productName: string;
  productSku: string;
  prescribedQty: number;
  dosage: string;
  instructions: string;
  availableStock: number;
  stockChecked: boolean;
  stockSufficient: boolean;
  batchOptions: BatchOption[];
  selectedBatch: string;
  unitPrice: number;
}

interface BatchOption {
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  isExpiringSoon: boolean;
}

@Component({
  selector: 'app-prescription-dispense',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, EuropeanDatePipe, StatusBadgeComponent],
  templateUrl: './prescription-dispense-component/prescription-dispense.component.html',
  styleUrls: ['./prescription-dispense-component/prescription-dispense.component.scss']
})
export class PrescriptionDispenseComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly inventoryService = inject(InventoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translateService = inject(TranslateService);
  private readonly printService = inject(PrintService);

  // State signals
  loading = signal(true);
  submitting = signal(false);
  checkingStock = signal(false);
  stockChecked = signal(false);
  currentStep = signal(1);
  prescription = signal<Prescription | null>(null);
  dispenseFormItems = signal<DispenseFormItem[]>([]);

  // Form data
  notes = '';
  paymentType: 'insurance' | 'invoice' | 'bankTransfer' = 'invoice';
  pharmacistConfirmed = false;
  printLabel = true;
  printReceipt = true;

  verification = {
    prescriptionValid: false,
    patientIdentified: false,
    doctorVerified: false,
    notExpired: false,
    controlledSubstanceCheck: false
  };

  counseling = {
    dosageExplained: false,
    sideEffectsDiscussed: false,
    interactionsReviewed: false,
    storageInstructionsGiven: false,
    patientQuestionsAnswered: false,
    controlledSubstanceWarning: false
  };

  // Computed
  totalUnitsToDispense = computed(() =>
    this.dispenseFormItems().reduce((sum, item) => sum + item.quantityDispensed, 0)
  );

  estimatedValue = computed(() =>
    this.dispenseFormItems().reduce((sum, item) => sum + (item.quantityDispensed * item.unitPrice), 0)
  );

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
        const mockRx = this.getMockPrescription(id);
        this.prescription.set(mockRx);
        this.initDispenseItems(mockRx.items);
        this.loading.set(false);
      }
    });
  }

  private initDispenseItems(items: PrescriptionItem[]): void {
    const formItems: DispenseFormItem[] = items
      .filter(item => !item.isDispensed)
      .map(item => ({
        prescriptionItemId: item.id,
        quantityDispensed: item.quantity,
        batchNumber: '',
        productName: item.productName,
        productSku: item.productSku,
        prescribedQty: item.quantity,
        dosage: item.dosage,
        instructions: item.instructions,
        availableStock: 0,
        stockChecked: false,
        stockSufficient: true,
        batchOptions: [],
        selectedBatch: '',
        unitPrice: Math.random() * 50 + 10
      }));
    this.dispenseFormItems.set(formItems);
  }

  goBack(): void {
    const rx = this.prescription();
    if (rx) {
      this.router.navigate(['/orders/prescriptions', rx.id]);
    } else {
      this.router.navigate(['/orders/prescriptions']);
    }
  }

  nextStep(): void {
    if (this.currentStep() < 4) this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  isExpiringSoon(): boolean {
    const rx = this.prescription();
    if (!rx) return false;
    const days = Math.ceil((new Date(rx.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 7 && days > 0;
  }

  isVerificationComplete(): boolean {
    const v = this.verification;
    const basic = v.prescriptionValid && v.patientIdentified && v.doctorVerified && v.notExpired;
    return this.prescription()?.isControlled ? basic && v.controlledSubstanceCheck : basic;
  }

  checkStock(): void {
    this.checkingStock.set(true);
    setTimeout(() => {
      const items = this.dispenseFormItems().map(item => ({
        ...item,
        stockChecked: true,
        availableStock: Math.floor(Math.random() * 100) + 20,
        stockSufficient: true,
        batchOptions: this.generateMockBatches()
      }));
      items.forEach(item => {
        item.stockSufficient = item.availableStock >= item.prescribedQty;
      });
      this.dispenseFormItems.set(items);
      this.stockChecked.set(true);
      this.checkingStock.set(false);
    }, 1500);
  }

  private generateMockBatches(): BatchOption[] {
    const batches: BatchOption[] = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const exp = new Date(now);
      exp.setMonth(exp.getMonth() + (i + 1) * 6);
      batches.push({
        batchNumber: `LOT-2024-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        expiryDate: exp,
        quantity: Math.floor(Math.random() * 50) + 10,
        isExpiringSoon: i === 0
      });
    }
    return batches;
  }

  isPrepareComplete(): boolean {
    if (!this.stockChecked()) return false;
    return this.dispenseFormItems().every(item =>
      item.quantityDispensed > 0 && item.quantityDispensed <= item.availableStock && item.batchNumber
    );
  }

  isCounselingComplete(): boolean {
    const c = this.counseling;
    const basic = c.dosageExplained && c.sideEffectsDiscussed && c.interactionsReviewed &&
                  c.storageInstructionsGiven && c.patientQuestionsAnswered;
    return this.prescription()?.isControlled ? basic && c.controlledSubstanceWarning : basic;
  }

  getPaymentLabel(): string {
    const labels: Record<string, string> = {
      'insurance': 'prescriptions.paymentTypes.insurance',
      'invoice': 'prescriptions.paymentTypes.invoice',
      'bankTransfer': 'prescriptions.paymentTypes.bankTransfer'
    };
    return labels[this.paymentType] || this.paymentType;
  }

  canSubmit(): boolean {
    return this.pharmacistConfirmed && this.isPrepareComplete();
  }

  async submitDispense(): Promise<void> {
    if (!this.canSubmit()) return;

    const confirmed = await this.confirmationService.confirm({
      title: this.translateService.instant('prescriptions.confirmDispenseTitle'),
      message: this.translateService.instant('prescriptions.confirmDispenseMessage'),
      confirmText: this.translateService.instant('prescriptions.completeDispense'),
      cancelText: this.translateService.instant('common.cancel'),
      variant: 'info'
    });

    if (!confirmed) return;

    this.submitting.set(true);

    const items: DispenseItem[] = this.dispenseFormItems().map(item => ({
      prescriptionItemId: item.prescriptionItemId,
      quantityDispensed: item.quantityDispensed,
      batchNumber: item.batchNumber
    }));

    this.prescriptionService.dispense(this.prescription()!.id, {
      items,
      notes: this.notes || undefined
    }).subscribe({
      next: () => {
        // Print receipt if selected
        if (this.printReceipt) {
          this.printPrescriptionReceipt();
        }

        this.notificationService.success(
          this.translateService.instant('prescriptions.dispenseSuccess'),
          this.translateService.instant('prescriptions.dispenseSuccessMessage')
        );
        this.router.navigate(['/orders/prescriptions', this.prescription()!.id]);
      },
      error: () => {
        this.notificationService.error(
          this.translateService.instant('common.error'),
          this.translateService.instant('prescriptions.dispenseError')
        );
        this.submitting.set(false);
      }
    });
  }

  private printPrescriptionReceipt(): void {
    const rx = this.prescription();
    if (!rx) return;

    const printData: PrescriptionPrintData = {
      prescriptionNumber: rx.prescriptionNumber,
      date: new Date(rx.issueDate).toLocaleDateString('bs-BA'),
      validUntil: rx.expiryDate ? new Date(rx.expiryDate).toLocaleDateString('bs-BA') : undefined,
      patient: {
        name: rx.patientName,
        dateOfBirth: undefined,
        insuranceNumber: undefined
      },
      prescriber: {
        name: rx.doctorName || 'N/A',
        license: undefined,
        institution: undefined
      },
      items: this.dispenseFormItems().map(item => ({
        medication: item.productName,
        dosage: item.dosage,
        quantity: item.quantityDispensed,
        instructions: item.instructions,
        dispensed: true
      })),
      notes: this.notes || undefined
    };

    this.printService.printPrescription(printData, {
      title: `Prescription ${rx.prescriptionNumber}`
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
      status: PrescriptionStatus.Approved,
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
