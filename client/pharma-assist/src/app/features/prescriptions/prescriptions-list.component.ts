import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { PrescriptionService, PrescriptionStats } from '../../core/services/prescription.service';
import {
  PrescriptionSummary,
  PrescriptionStatus,
  PrescriptionPriority,
  PrescriptionFilter,
  getPrescriptionStatusLabel,
  getPrescriptionStatusColor,
  getPriorityLabel,
  getPriorityColor
} from '../../core/models/prescription.model';
import { NotificationService } from '../../core/services/notification.service';

import { SearchInputComponent } from '../../shared/components/search-input';
import { StatusBadgeComponent } from '../../shared/components/status-badge';
import { EmptyStateComponent } from '../../shared/components/empty-state';
import { PaginationComponent, PageEvent } from '../../shared/components/pagination';

@Component({
  selector: 'app-prescriptions-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DatePipe,
    SearchInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  templateUrl: './prescriptions-list-component/prescriptions-list.component.html',
  styleUrls: ['./prescriptions-list-component/prescriptions-list.component.scss']
})
export class PrescriptionsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly prescriptionService = inject(PrescriptionService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(false);
  prescriptions = signal<PrescriptionSummary[]>([]);
  stats = signal<PrescriptionStats | null>(null);
  totalCount = signal(0);
  activeTab = signal<'all' | 'pending' | 'review' | 'approved' | 'dispensed'>('all');

  filter = signal<PrescriptionFilter>({
    page: 1,
    pageSize: 10
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadPrescriptions();
  }

  private loadStats(): void {
    this.prescriptionService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {
        // Mock data for demo
        this.stats.set({
          pending: 7,
          underReview: 3,
          approved: 12,
          rejected: 2,
          dispensed: 45,
          urgentCount: 2,
          controlledCount: 1
        });
      }
    });
  }

  private loadPrescriptions(): void {
    this.loading.set(true);
    this.prescriptionService.getAll(this.filter()).subscribe({
      next: (result) => {
        this.prescriptions.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        // Mock data for demo
        this.prescriptions.set(this.getMockPrescriptions());
        this.totalCount.set(15);
        this.loading.set(false);
      }
    });
  }

  setTab(tab: 'all' | 'pending' | 'review' | 'approved' | 'dispensed'): void {
    this.activeTab.set(tab);
    const statusMap: Record<string, PrescriptionStatus | undefined> = {
      'all': undefined,
      'pending': PrescriptionStatus.Pending,
      'review': PrescriptionStatus.UnderReview,
      'approved': PrescriptionStatus.Approved,
      'dispensed': PrescriptionStatus.Dispensed
    };
    this.filter.update(f => ({ ...f, status: statusMap[tab], page: 1 }));
    this.loadPrescriptions();
  }

  onSearch(term: string): void {
    this.filter.update(f => ({ ...f, searchTerm: term, page: 1 }));
    this.loadPrescriptions();
  }

  onPriorityChange(priority: PrescriptionPriority | undefined): void {
    this.filter.update(f => ({ ...f, priority, page: 1 }));
    this.loadPrescriptions();
  }

  onControlledChange(isControlled: boolean): void {
    this.filter.update(f => ({ ...f, isControlled: isControlled || undefined, page: 1 }));
    this.loadPrescriptions();
  }

  onPageChange(event: PageEvent): void {
    this.filter.update(f => ({ ...f, page: event.page, pageSize: event.pageSize }));
    this.loadPrescriptions();
  }

  viewPrescription(rx: PrescriptionSummary): void {
    this.router.navigate(['/orders/prescriptions', rx.id]);
  }

  reviewPrescription(rx: PrescriptionSummary, approved: boolean, event: Event): void {
    event.stopPropagation();
    // TODO: Open review modal
    const action = approved ? 'approved' : 'rejected';
    this.notificationService.success(
      `Prescription ${action}`,
      `${rx.prescriptionNumber} has been ${action}`
    );
  }

  dispensePrescription(rx: PrescriptionSummary, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/orders/prescriptions', rx.id, 'dispense']);
  }

  isExpired(date: Date): boolean {
    return new Date(date) < new Date();
  }

  getStatusLabel = getPrescriptionStatusLabel;
  getStatusColor = getPrescriptionStatusColor;
  getPriorityLabel = getPriorityLabel;
  getPriorityColor = getPriorityColor;

  private getMockPrescriptions(): PrescriptionSummary[] {
    return [
      { id: '1', prescriptionNumber: 'RX-2024-001', customerName: 'Apoteka Centar', patientName: 'Mira Hadžić', doctorName: 'Dr. Selma Kovač', issueDate: new Date('2024-12-01'), expiryDate: new Date('2024-12-31'), status: PrescriptionStatus.Pending, priority: PrescriptionPriority.Urgent, isControlled: true, itemCount: 2, createdAt: new Date() },
      { id: '2', prescriptionNumber: 'RX-2024-002', customerName: 'Farmacija Plus', patientName: 'Amir Begović', doctorName: 'Dr. Emir Jahić', issueDate: new Date('2024-12-02'), expiryDate: new Date('2025-01-02'), status: PrescriptionStatus.Pending, priority: PrescriptionPriority.Normal, isControlled: false, itemCount: 3, createdAt: new Date() },
      { id: '3', prescriptionNumber: 'RX-2024-003', customerName: 'Zdravlje d.o.o.', patientName: 'Lejla Muratović', doctorName: 'Dr. Alma Hodžić', issueDate: new Date('2024-11-28'), expiryDate: new Date('2024-12-28'), status: PrescriptionStatus.Approved, priority: PrescriptionPriority.Normal, isControlled: false, itemCount: 1, createdAt: new Date() },
      { id: '4', prescriptionNumber: 'RX-2024-004', customerName: 'Apoteka Baščaršija', patientName: 'Kenan Delić', doctorName: 'Dr. Nedim Imamović', issueDate: new Date('2024-11-25'), expiryDate: new Date('2024-12-25'), status: PrescriptionStatus.Dispensed, priority: PrescriptionPriority.Normal, isControlled: false, itemCount: 2, createdAt: new Date() },
    ];
  }
}
