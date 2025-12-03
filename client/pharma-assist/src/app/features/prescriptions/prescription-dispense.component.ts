import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  imports: [CommonModule, FormsModule, TranslateModule, StatusBadgeComponent],
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
          @if (prescription()!.isControlled) {
            <span class="controlled-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {{ 'prescriptions.controlled' | translate }}
            </span>
          }
        </div>

        <!-- Progress Steps -->
        <div class="progress-steps">
          <div class="step" [class.active]="currentStep() >= 1" [class.completed]="currentStep() > 1">
            <div class="step-number">1</div>
            <span>{{ 'prescriptions.steps.verify' | translate }}</span>
          </div>
          <div class="step-connector" [class.active]="currentStep() > 1"></div>
          <div class="step" [class.active]="currentStep() >= 2" [class.completed]="currentStep() > 2">
            <div class="step-number">2</div>
            <span>{{ 'prescriptions.steps.prepare' | translate }}</span>
          </div>
          <div class="step-connector" [class.active]="currentStep() > 2"></div>
          <div class="step" [class.active]="currentStep() >= 3" [class.completed]="currentStep() > 3">
            <div class="step-number">3</div>
            <span>{{ 'prescriptions.steps.counsel' | translate }}</span>
          </div>
          <div class="step-connector" [class.active]="currentStep() > 3"></div>
          <div class="step" [class.active]="currentStep() >= 4">
            <div class="step-number">4</div>
            <span>{{ 'prescriptions.steps.confirm' | translate }}</span>
          </div>
        </div>

        <!-- Step 1: Verification -->
        @if (currentStep() === 1) {
          <div class="step-card">
            <div class="card-header">
              <h2>{{ 'prescriptions.verifyPrescription' | translate }}</h2>
              <p class="info-text">{{ 'prescriptions.verifyInfo' | translate }}</p>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="label">{{ 'prescriptions.patient' | translate }}</span>
                <span class="value">{{ prescription()!.patientName }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ 'prescriptions.doctor' | translate }}</span>
                <span class="value">{{ prescription()!.doctorName }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ 'prescriptions.issueDate' | translate }}</span>
                <span class="value">{{ prescription()!.issueDate | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ 'prescriptions.expiryDate' | translate }}</span>
                <span class="value" [class.expiring-soon]="isExpiringSoon()">{{ prescription()!.expiryDate | date:'mediumDate' }}</span>
              </div>
            </div>

            <div class="verification-section">
              <h3>{{ 'prescriptions.verificationChecklist' | translate }}</h3>
              <div class="checklist">
                <label class="check-item" [class.checked]="verification.prescriptionValid">
                  <input type="checkbox" [(ngModel)]="verification.prescriptionValid">
                  <span class="checkmark"></span>
                  <span>{{ 'prescriptions.verify.prescriptionValid' | translate }}</span>
                </label>
                <label class="check-item" [class.checked]="verification.patientIdentified">
                  <input type="checkbox" [(ngModel)]="verification.patientIdentified">
                  <span class="checkmark"></span>
                  <span>{{ 'prescriptions.verify.patientIdentified' | translate }}</span>
                </label>
                <label class="check-item" [class.checked]="verification.doctorVerified">
                  <input type="checkbox" [(ngModel)]="verification.doctorVerified">
                  <span class="checkmark"></span>
                  <span>{{ 'prescriptions.verify.doctorVerified' | translate }}</span>
                </label>
                <label class="check-item" [class.checked]="verification.notExpired">
                  <input type="checkbox" [(ngModel)]="verification.notExpired">
                  <span class="checkmark"></span>
                  <span>{{ 'prescriptions.verify.notExpired' | translate }}</span>
                </label>
                @if (prescription()!.isControlled) {
                  <label class="check-item controlled" [class.checked]="verification.controlledSubstanceCheck">
                    <input type="checkbox" [(ngModel)]="verification.controlledSubstanceCheck">
                    <span class="checkmark"></span>
                    <span>{{ 'prescriptions.verify.controlledSubstanceCheck' | translate }}</span>
                  </label>
                }
              </div>
            </div>

            <div class="payment-section">
              <h3>{{ 'prescriptions.paymentInfo' | translate }}</h3>
              <div class="payment-options">
                <label class="radio-item" [class.selected]="paymentType === 'invoice'">
                  <input type="radio" name="payment" value="invoice" [(ngModel)]="paymentType">
                  <span>{{ 'prescriptions.paymentTypes.invoice' | translate }}</span>
                </label>
                <label class="radio-item" [class.selected]="paymentType === 'bankTransfer'">
                  <input type="radio" name="payment" value="bankTransfer" [(ngModel)]="paymentType">
                  <span>{{ 'prescriptions.paymentTypes.bankTransfer' | translate }}</span>
                </label>
                <label class="radio-item" [class.selected]="paymentType === 'insurance'">
                  <input type="radio" name="payment" value="insurance" [(ngModel)]="paymentType">
                  <span>{{ 'prescriptions.paymentTypes.insurance' | translate }}</span>
                </label>
              </div>
            </div>

            <div class="step-actions">
              <button class="btn btn-secondary" (click)="goBack()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn-primary" [disabled]="!isVerificationComplete()" (click)="nextStep()">
                {{ 'common.next' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        }

        <!-- Step 2: Prepare Items -->
        @if (currentStep() === 2) {
          <div class="step-card">
            <div class="card-header">
              <h2>{{ 'prescriptions.prepareItems' | translate }}</h2>
              <p class="info-text">{{ 'prescriptions.prepareInfo' | translate }}</p>
            </div>

            @if (!stockChecked()) {
              <div class="stock-check-section">
                <button class="btn btn-outline" (click)="checkStock()" [disabled]="checkingStock()">
                  @if (checkingStock()) {<span class="spinner-sm"></span>}
                  {{ 'prescriptions.checkStock' | translate }}
                </button>
              </div>
            }

            <div class="items-list">
              @for (item of dispenseFormItems(); track item.prescriptionItemId; let i = $index) {
                <div class="item-card" [class.insufficient]="item.stockChecked && !item.stockSufficient">
                  <div class="item-header">
                    <div class="item-info">
                      <span class="item-name">{{ item.productName }}</span>
                      <span class="item-sku">{{ item.productSku }}</span>
                    </div>
                    @if (item.stockChecked) {
                      <app-status-badge [variant]="item.stockSufficient ? 'success' : 'danger'" [label]="item.stockSufficient ? ('prescriptions.inStock' | translate) : ('prescriptions.lowStock' | translate)"></app-status-badge>
                    }
                  </div>
                  <div class="item-details">
                    <div class="detail"><span class="label">{{ 'prescriptions.prescribedQty' | translate }}</span><span class="value">{{ item.prescribedQty }}</span></div>
                    <div class="detail"><span class="label">{{ 'prescriptions.dosage' | translate }}</span><span class="value">{{ item.dosage }}</span></div>
                    @if (item.stockChecked) {<div class="detail"><span class="label">{{ 'prescriptions.availableStock' | translate }}</span><span class="value" [class.danger]="!item.stockSufficient">{{ item.availableStock }}</span></div>}
                  </div>
                  <div class="item-instructions"><span class="label">{{ 'prescriptions.instructions' | translate }}:</span> {{ item.instructions }}</div>
                  <div class="dispense-inputs">
                    <div class="input-group">
                      <label>{{ 'prescriptions.quantityToDispense' | translate }} *</label>
                      <input type="number" [min]="1" [max]="item.availableStock || item.prescribedQty" [(ngModel)]="item.quantityDispensed">
                    </div>
                    <div class="input-group">
                      <label>{{ 'prescriptions.batchNumber' | translate }} *</label>
                      @if (item.batchOptions.length > 0) {
                        <select [(ngModel)]="item.batchNumber">
                          <option value="">{{ 'prescriptions.selectBatch' | translate }}</option>
                          @for (batch of item.batchOptions; track batch.batchNumber) {
                            <option [value]="batch.batchNumber">{{ batch.batchNumber }} ({{ batch.quantity }}) - {{ batch.expiryDate | date:'MM/yy' }}</option>
                          }
                        </select>
                      } @else {
                        <input type="text" [(ngModel)]="item.batchNumber" placeholder="LOT-2024-001">
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="summary-box">
              <div class="summary-row"><span>{{ 'prescriptions.totalItems' | translate }}</span><span>{{ dispenseFormItems().length }}</span></div>
              <div class="summary-row"><span>{{ 'prescriptions.totalUnits' | translate }}</span><span>{{ totalUnitsToDispense() }}</span></div>
              <div class="summary-row total"><span>{{ 'prescriptions.estimatedValue' | translate }}</span><span>{{ estimatedValue() | number:'1.2-2' }} KM</span></div>
            </div>

            <div class="step-actions">
              <button class="btn btn-secondary" (click)="prevStep()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg> {{ 'common.back' | translate }}</button>
              <button class="btn btn-primary" [disabled]="!isPrepareComplete()" (click)="nextStep()">{{ 'common.next' | translate }} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>
            </div>
          </div>
        }

        <!-- Step 3: Counseling -->
        @if (currentStep() === 3) {
          <div class="step-card">
            <div class="card-header">
              <h2>{{ 'prescriptions.patientCounseling' | translate }}</h2>
              <p class="info-text">{{ 'prescriptions.counselingInfo' | translate }}</p>
            </div>

            <div class="checklist">
              <label class="check-item" [class.checked]="counseling.dosageExplained">
                <input type="checkbox" [(ngModel)]="counseling.dosageExplained">
                <span class="checkmark"></span>
                <div class="check-content"><span class="check-title">{{ 'prescriptions.counseling.dosageExplained' | translate }}</span><span class="check-desc">{{ 'prescriptions.counseling.dosageExplainedDesc' | translate }}</span></div>
              </label>
              <label class="check-item" [class.checked]="counseling.sideEffectsDiscussed">
                <input type="checkbox" [(ngModel)]="counseling.sideEffectsDiscussed">
                <span class="checkmark"></span>
                <div class="check-content"><span class="check-title">{{ 'prescriptions.counseling.sideEffectsDiscussed' | translate }}</span><span class="check-desc">{{ 'prescriptions.counseling.sideEffectsDiscussedDesc' | translate }}</span></div>
              </label>
              <label class="check-item" [class.checked]="counseling.interactionsReviewed">
                <input type="checkbox" [(ngModel)]="counseling.interactionsReviewed">
                <span class="checkmark"></span>
                <div class="check-content"><span class="check-title">{{ 'prescriptions.counseling.interactionsReviewed' | translate }}</span><span class="check-desc">{{ 'prescriptions.counseling.interactionsReviewedDesc' | translate }}</span></div>
              </label>
              <label class="check-item" [class.checked]="counseling.storageInstructionsGiven">
                <input type="checkbox" [(ngModel)]="counseling.storageInstructionsGiven">
                <span class="checkmark"></span>
                <div class="check-content"><span class="check-title">{{ 'prescriptions.counseling.storageInstructionsGiven' | translate }}</span><span class="check-desc">{{ 'prescriptions.counseling.storageInstructionsGivenDesc' | translate }}</span></div>
              </label>
              <label class="check-item" [class.checked]="counseling.patientQuestionsAnswered">
                <input type="checkbox" [(ngModel)]="counseling.patientQuestionsAnswered">
                <span class="checkmark"></span>
                <div class="check-content"><span class="check-title">{{ 'prescriptions.counseling.patientQuestionsAnswered' | translate }}</span><span class="check-desc">{{ 'prescriptions.counseling.patientQuestionsAnsweredDesc' | translate }}</span></div>
              </label>
              @if (prescription()!.isControlled) {
                <label class="check-item controlled" [class.checked]="counseling.controlledSubstanceWarning">
                  <input type="checkbox" [(ngModel)]="counseling.controlledSubstanceWarning">
                  <span class="checkmark"></span>
                  <div class="check-content"><span class="check-title">{{ 'prescriptions.counseling.controlledSubstanceWarning' | translate }}</span><span class="check-desc">{{ 'prescriptions.counseling.controlledSubstanceWarningDesc' | translate }}</span></div>
                </label>
              }
            </div>

            <div class="notes-section">
              <label>{{ 'prescriptions.dispenseNotes' | translate }}</label>
              <textarea [(ngModel)]="notes" rows="3" [placeholder]="'prescriptions.dispenseNotesPlaceholder' | translate"></textarea>
            </div>

            <div class="step-actions">
              <button class="btn btn-secondary" (click)="prevStep()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg> {{ 'common.back' | translate }}</button>
              <button class="btn btn-primary" [disabled]="!isCounselingComplete()" (click)="nextStep()">{{ 'common.next' | translate }} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>
            </div>
          </div>
        }

        <!-- Step 4: Confirm -->
        @if (currentStep() === 4) {
          <div class="step-card confirmation">
            <div class="card-header">
              <h2>{{ 'prescriptions.confirmDispense' | translate }}</h2>
              <p class="info-text">{{ 'prescriptions.confirmInfo' | translate }}</p>
            </div>

            <div class="final-summary">
              <div class="summary-section">
                <h3>{{ 'prescriptions.prescriptionDetails' | translate }}</h3>
                <div class="summary-grid">
                  <div><span class="label">{{ 'prescriptions.prescriptionNumber' | translate }}</span><span class="value">{{ prescription()!.prescriptionNumber }}</span></div>
                  <div><span class="label">{{ 'prescriptions.patient' | translate }}</span><span class="value">{{ prescription()!.patientName }}</span></div>
                  <div><span class="label">{{ 'prescriptions.doctor' | translate }}</span><span class="value">{{ prescription()!.doctorName }}</span></div>
                  <div><span class="label">{{ 'prescriptions.paymentMethod' | translate }}</span><span class="value">{{ getPaymentLabel() | translate }}</span></div>
                </div>
              </div>

              <div class="summary-section">
                <h3>{{ 'prescriptions.itemsToDispense' | translate }}</h3>
                <div class="items-summary">
                  @for (item of dispenseFormItems(); track item.prescriptionItemId) {
                    <div class="item-row">
                      <div><span class="name">{{ item.productName }}</span><span class="batch">{{ item.batchNumber }}</span></div>
                      <span class="qty">× {{ item.quantityDispensed }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="total-box">
                <div class="total-row"><span>{{ 'prescriptions.totalUnits' | translate }}</span><span>{{ totalUnitsToDispense() }}</span></div>
                <div class="total-row grand"><span>{{ 'prescriptions.estimatedValue' | translate }}</span><span>{{ estimatedValue() | number:'1.2-2' }} KM</span></div>
              </div>
            </div>

            <div class="pharmacist-confirm">
              <label class="check-item confirmation" [class.checked]="pharmacistConfirmed">
                <input type="checkbox" [(ngModel)]="pharmacistConfirmed">
                <span class="checkmark"></span>
                <div class="check-content">
                  <span class="check-title">{{ 'prescriptions.pharmacistConfirmText' | translate }}</span>
                  <span class="check-desc">{{ 'prescriptions.pharmacistConfirmDesc' | translate }}</span>
                </div>
              </label>
            </div>

            <div class="print-options">
              <label class="check-item"><input type="checkbox" [(ngModel)]="printLabel"><span class="checkmark"></span><span>{{ 'prescriptions.printLabel' | translate }}</span></label>
              <label class="check-item"><input type="checkbox" [(ngModel)]="printReceipt"><span class="checkmark"></span><span>{{ 'prescriptions.printReceipt' | translate }}</span></label>
            </div>

            <div class="step-actions final">
              <button class="btn btn-secondary" (click)="prevStep()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg> {{ 'common.back' | translate }}</button>
              <button class="btn btn-success" [disabled]="!canSubmit() || submitting()" (click)="submitDispense()">
                @if (submitting()) {<span class="spinner-sm"></span>}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                {{ 'prescriptions.completeDispense' | translate }}
              </button>
            </div>
          </div>
        }
      } @else {
        <div class="error-state">
          <h2>{{ 'prescriptions.notFound' | translate }}</h2>
          <button class="btn btn-primary" (click)="goBack()">{{ 'common.goBack' | translate }}</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0d9488;--c6:#dc2626;--c7:#22c55e;--c8:#f59e0b}
    .dispense-page{padding:1.5rem;max-width:900px;margin:0 auto}
    .loading-state,.error-state{display:flex;flex-direction:column;align-items:center;padding:4rem;color:var(--c2);text-align:center}
    .spinner{width:40px;height:40px;border:3px solid var(--c3);border-top-color:var(--c5);border-radius:50%;animation:spin .8s linear infinite}
    .spinner-sm{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    .page-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap}
    .btn-back{display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:none;border:1px solid var(--c3);border-radius:8px;color:var(--c2);cursor:pointer}
    .btn-back:hover{border-color:var(--c5);color:var(--c5)}
    .header-content{flex:1}
    .header-content h1{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0}
    .subtitle{color:var(--c2);margin:.25rem 0 0;font-size:.9rem}
    .controlled-badge{display:flex;align-items:center;gap:.375rem;padding:.375rem .75rem;background:#fef3c7;color:#d97706;font-size:.75rem;font-weight:600;border-radius:6px}

    .progress-steps{display:flex;align-items:center;justify-content:center;gap:.5rem;margin-bottom:1.5rem;padding:1rem;background:#fff;border-radius:12px;border:1px solid var(--c3)}
    .step{display:flex;align-items:center;gap:.5rem;color:var(--c2)}
    .step.active{color:var(--c5)}
    .step.completed{color:var(--c7)}
    .step-number{width:28px;height:28px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:600}
    .step.active .step-number{background:var(--c5);color:#fff}
    .step.completed .step-number{background:var(--c7);color:#fff}
    .step>span:not(.step-number){font-size:.85rem;font-weight:500}
    .step-connector{width:40px;height:2px;background:var(--c3)}
    .step-connector.active{background:var(--c7)}
    @media(max-width:640px){.step>span:not(.step-number){display:none}.step-connector{width:20px}}

    .step-card{background:#fff;border:1px solid var(--c3);border-radius:12px;padding:1.5rem}
    .card-header{margin-bottom:1.5rem}
    .card-header h2{font-size:1.1rem;font-weight:600;color:var(--c1);margin:0 0 .5rem}
    .info-text{color:var(--c2);font-size:.85rem;margin:0}

    .info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem;padding:1rem;background:var(--c4);border-radius:8px}
    @media(max-width:500px){.info-grid{grid-template-columns:1fr}}
    .info-item .label{display:block;font-size:.75rem;color:var(--c2);text-transform:uppercase}
    .info-item .value{font-size:.9rem;font-weight:500;color:var(--c1)}
    .expiring-soon{color:var(--c8)}

    .verification-section,.payment-section{margin-bottom:1.5rem}
    .verification-section h3,.payment-section h3,.summary-section h3{font-size:.95rem;font-weight:600;color:var(--c1);margin:0 0 1rem}
    .checklist{display:flex;flex-direction:column;gap:.75rem}
    .check-item{display:flex;align-items:flex-start;gap:.75rem;cursor:pointer;padding:.75rem 1rem;border:1px solid var(--c3);border-radius:8px;transition:all .2s}
    .check-item:hover{background:var(--c4)}
    .check-item.checked{border-color:var(--c5);background:#f0fdfa}
    .check-item.controlled{border-color:var(--c8);background:#fffbeb}
    .check-item.controlled.checked{background:#fef3c7}
    .check-item.confirmation{border-width:2px}
    .check-item input{display:none}
    .checkmark{width:20px;height:20px;border:2px solid var(--c3);border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
    .check-item.checked .checkmark{background:var(--c5);border-color:var(--c5)}
    .check-item.checked .checkmark::after{content:'✓';color:#fff;font-size:.75rem}
    .check-content{flex:1}
    .check-title{font-size:.9rem;color:var(--c1);display:block}
    .check-desc{font-size:.8rem;color:var(--c2);display:block;margin-top:.25rem}

    .payment-options{display:flex;gap:1rem;flex-wrap:wrap}
    .radio-item{display:flex;align-items:center;gap:.5rem;cursor:pointer;padding:.75rem 1rem;border:1px solid var(--c3);border-radius:8px}
    .radio-item.selected{border-color:var(--c5);background:#f0fdfa}
    .radio-item input{accent-color:var(--c5)}

    .stock-check-section{text-align:center;padding:1.5rem;background:var(--c4);border-radius:8px;margin-bottom:1.5rem}
    .btn-outline{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;background:#fff;border:2px solid var(--c5);border-radius:8px;color:var(--c5);font-weight:500;cursor:pointer}
    .btn-outline:hover:not(:disabled){background:var(--c5);color:#fff}

    .items-list{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem}
    .item-card{border:1px solid var(--c3);border-radius:10px;padding:1.25rem}
    .item-card.insufficient{border-color:var(--c6);background:#fef2f2}
    .item-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
    .item-name{font-weight:600;color:var(--c1);display:block}
    .item-sku{font-size:.8rem;color:var(--c2)}
    .item-details{display:flex;gap:2rem;margin-bottom:1rem;flex-wrap:wrap}
    .detail .label{display:block;font-size:.7rem;color:var(--c2);text-transform:uppercase}
    .detail .value{font-size:.9rem;font-weight:500;color:var(--c1)}
    .detail .value.danger{color:var(--c6)}
    .item-instructions{background:var(--c4);padding:.75rem 1rem;border-radius:6px;margin-bottom:1rem;font-size:.85rem}
    .item-instructions .label{color:var(--c2)}
    .dispense-inputs{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:500px){.dispense-inputs{grid-template-columns:1fr}}
    .input-group label{display:block;font-size:.8rem;color:var(--c2);margin-bottom:.375rem}
    .input-group input,.input-group select{width:100%;padding:.625rem .875rem;border:1px solid var(--c3);border-radius:8px;font-size:.9rem}
    .input-group input:focus,.input-group select:focus{outline:none;border-color:var(--c5)}

    .summary-box,.total-box{background:var(--c4);border-radius:8px;padding:1rem}
    .summary-row,.total-row{display:flex;justify-content:space-between;padding:.5rem 0;font-size:.9rem;color:var(--c2)}
    .summary-row.total,.total-row.grand{border-top:1px solid var(--c3);margin-top:.5rem;padding-top:1rem;font-weight:600;color:var(--c1);font-size:1rem}

    .notes-section{margin-bottom:1.5rem}
    .notes-section label{display:block;font-size:.875rem;font-weight:500;color:var(--c1);margin-bottom:.5rem}
    .notes-section textarea{width:100%;padding:.75rem 1rem;border:1px solid var(--c3);border-radius:8px;font-size:.9rem;resize:vertical}
    .notes-section textarea:focus{outline:none;border-color:var(--c5)}

    .final-summary{margin-bottom:1.5rem}
    .summary-section{margin-bottom:1.5rem}
    .summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;padding:1rem;background:var(--c4);border-radius:8px}
    @media(max-width:500px){.summary-grid{grid-template-columns:1fr}}
    .summary-grid .label{display:block;font-size:.75rem;color:var(--c2)}
    .summary-grid .value{font-size:.9rem;font-weight:500;color:var(--c1)}
    .items-summary{border:1px solid var(--c3);border-radius:8px;overflow:hidden}
    .item-row{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;border-bottom:1px solid var(--c3)}
    .item-row:last-child{border-bottom:none}
    .item-row .name{font-weight:500;color:var(--c1);display:block}
    .item-row .batch{font-size:.8rem;color:var(--c2)}
    .item-row .qty{font-weight:600;color:var(--c5)}

    .pharmacist-confirm{margin-bottom:1.5rem}
    .print-options{display:flex;gap:1rem;margin-bottom:1.5rem}
    .print-options .check-item{flex:1;min-width:150px}

    .step-actions{display:flex;gap:.75rem;justify-content:flex-end;padding-top:1.5rem;border-top:1px solid var(--c3)}
    .step-actions.final{background:#f0fdfa;margin:-1.5rem;margin-top:1.5rem;padding:1.5rem;border-radius:0 0 12px 12px}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;border:none;border-radius:8px;font-size:.9rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:var(--c4);color:var(--c2)}
    .btn-secondary:hover{background:var(--c3)}
    .btn-primary{background:var(--c5);color:#fff}
    .btn-primary:hover:not(:disabled){background:#0f766e}
    .btn-success{background:var(--c7);color:#fff}
    .btn-success:hover:not(:disabled){background:#16a34a}
  `]
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
