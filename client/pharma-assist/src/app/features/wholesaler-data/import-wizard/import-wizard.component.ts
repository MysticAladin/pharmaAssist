import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WholesalerDataService } from '../../../core/services/wholesaler-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImportPreview, ImportResult } from '../../../core/models/wholesaler.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-import-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    StatusBadgeComponent
  ],
  templateUrl: './import-wizard.component.html'
})
export class ImportWizardComponent {
  private readonly wholesalerService = inject(WholesalerDataService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // State
  currentStep = signal(1);
  loading = signal(false);
  selectedFile = signal<File | null>(null);
  preview = signal<ImportPreview | null>(null);
  importResult = signal<ImportResult | null>(null);

  // Form data
  wholesalerId = signal(0);
  period = signal('');
  notes = signal('');
  columnMapping = signal<Record<string, string>>({});

  // Standard columns we expect
  standardColumns = ['ProductCode', 'ProductName', 'CustomerCode', 'CustomerName', 'Quantity', 'UnitPrice', 'TotalAmount', 'InvoiceDate', 'InvoiceNumber'];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  previewFile(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    this.wholesalerService.previewFile(file).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.preview.set(response.data);
          // Auto-map columns where names match
          const mapping: Record<string, string> = {};
          const detected = response.data.detectedColumns;
          for (const col of detected) {
            const match = this.standardColumns.find(sc =>
              sc.toLowerCase() === col.toLowerCase() ||
              sc.toLowerCase().replace(/\s/g, '') === col.toLowerCase().replace(/\s/g, '')
            );
            if (match) mapping[col] = match;
          }
          this.columnMapping.set(mapping);
          this.currentStep.set(2);
        } else {
          this.notification.error(response.message || this.translate.instant('wholesalerData.previewError'));
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('wholesalerData.previewError'));
        this.loading.set(false);
      }
    });
  }

  updateMapping(detectedCol: string, standardCol: string): void {
    this.columnMapping.update(m => ({ ...m, [detectedCol]: standardCol }));
  }

  startImport(): void {
    const file = this.selectedFile();
    if (!file || !this.wholesalerId()) return;

    this.loading.set(true);
    const mappingJson = JSON.stringify(this.columnMapping());
    this.wholesalerService.importFile(
      file,
      this.wholesalerId(),
      this.period() || undefined,
      mappingJson,
      this.notes() || undefined
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.importResult.set(response.data);
          this.currentStep.set(3);
          this.notification.success(this.translate.instant('wholesalerData.importSuccess'));
        } else {
          this.notification.error(response.message || this.translate.instant('wholesalerData.importError'));
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error(this.translate.instant('wholesalerData.importError'));
        this.loading.set(false);
      }
    });
  }

  goToImport(): void {
    const result = this.importResult();
    if (result) {
      this.router.navigate(['/wholesaler-data', result.importId]);
    }
  }
}
