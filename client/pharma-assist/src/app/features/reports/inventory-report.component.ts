import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface InventoryItem {
  name: string;
  sku: string;
  category: string;
  stock: number;
  value: number;
  status: 'ok' | 'low' | 'critical';
}

@Component({
  selector: 'app-inventory-report',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, FormsModule],
  template: `
    <div class="inventory-report">
      <div class="page-header">
        <div class="breadcrumb">
          <a routerLink="/reports">{{ 'reports.title' | translate }}</a>
          <span class="separator">/</span>
          <span>{{ 'reports.inventory.title' | translate }}</span>
        </div>
        <div class="header-main">
          <div class="header-content">
            <h1 class="page-title">{{ 'reports.inventory.title' | translate }}</h1>
            <p class="page-description">{{ 'reports.inventory.subtitle' | translate }}</p>
          </div>
          <div class="header-actions">
            <button class="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ 'reports.actions.export' | translate }}
            </button>
            <button class="btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              {{ 'reports.actions.refresh' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon items"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.inventory.totalItems' | translate }}</span>
            <span class="stat-value">{{ totalItems() | number }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon value"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.inventory.totalValue' | translate }}</span>
            <span class="stat-value">{{ totalValue() | number:'1.2-2' }} KM</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon in"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.inventory.stockIn' | translate }}</span>
            <span class="stat-value positive">+{{ stockIn() | number }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon out"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
          <div class="stat-content">
            <span class="stat-label">{{ 'reports.inventory.stockOut' | translate }}</span>
            <span class="stat-value negative">-{{ stockOut() | number }}</span>
          </div>
        </div>
      </div>

      <!-- Stock Status Overview -->
      <div class="status-section">
        <h3 class="section-title">{{ 'reports.inventory.status' | translate }}</h3>
        <div class="status-cards">
          <div class="status-card ok">
            <div class="status-count">{{ statusCounts().ok }}</div>
            <div class="status-label">In Stock</div>
            <div class="status-bar"><div class="bar-fill" [style.width.%]="(statusCounts().ok / totalItems()) * 100"></div></div>
          </div>
          <div class="status-card low">
            <div class="status-count">{{ statusCounts().low }}</div>
            <div class="status-label">Low Stock</div>
            <div class="status-bar"><div class="bar-fill" [style.width.%]="(statusCounts().low / totalItems()) * 100"></div></div>
          </div>
          <div class="status-card critical">
            <div class="status-count">{{ statusCounts().critical }}</div>
            <div class="status-label">Critical</div>
            <div class="status-bar"><div class="bar-fill" [style.width.%]="(statusCounts().critical / totalItems()) * 100"></div></div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="breakdown-section">
        <div class="breakdown-card">
          <h3 class="section-title">{{ 'reports.inventory.byCategory' | translate }}</h3>
          <div class="breakdown-list">
            @for (cat of categoryBreakdown(); track cat.name) {
              <div class="breakdown-item">
                <div class="breakdown-info">
                  <span class="breakdown-name">{{ cat.name }}</span>
                  <span class="breakdown-count">{{ cat.count }} items</span>
                </div>
                <div class="breakdown-bar">
                  <div class="bar-fill" [style.width.%]="cat.percentage" [style.background]="cat.color"></div>
                </div>
                <span class="breakdown-value">{{ cat.value | number:'1.0-0' }} KM</span>
              </div>
            }
          </div>
        </div>
        <div class="breakdown-card">
          <h3 class="section-title">{{ 'reports.inventory.byManufacturer' | translate }}</h3>
          <div class="breakdown-list">
            @for (mfr of manufacturerBreakdown(); track mfr.name) {
              <div class="breakdown-item">
                <div class="breakdown-info">
                  <span class="breakdown-name">{{ mfr.name }}</span>
                  <span class="breakdown-count">{{ mfr.count }} items</span>
                </div>
                <div class="breakdown-bar">
                  <div class="bar-fill" [style.width.%]="mfr.percentage" [style.background]="mfr.color"></div>
                </div>
                <span class="breakdown-value">{{ mfr.value | number:'1.0-0' }} KM</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Low Stock Alert List -->
      <div class="alerts-section">
        <h3 class="section-title">{{ 'reports.inventory.lowStock' | translate }}</h3>
        <div class="alerts-table">
          <div class="table-header">
            <span>Product</span>
            <span>SKU</span>
            <span>Category</span>
            <span>Stock</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          @for (item of lowStockItems(); track item.sku) {
            <div class="table-row">
              <span class="cell-name">{{ item.name }}</span>
              <span class="cell-sku">{{ item.sku }}</span>
              <span class="cell-category">{{ item.category }}</span>
              <span class="cell-stock">{{ item.stock }}</span>
              <span class="cell-value">{{ item.value | number:'1.2-2' }} KM</span>
              <span class="cell-status">
                <span class="status-badge" [class]="item.status">{{ item.status === 'critical' ? 'Critical' : 'Low' }}</span>
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{--c1:#1a1a2e;--c2:#6b7280;--c3:#e5e7eb;--c4:#f3f4f6;--c5:#0aaaaa;--c6:#088888;--c7:#dc2626;--c8:#f59e0b}
    .inventory-report{padding:1.5rem;max-width:1400px;margin:0 auto}
    .page-header{margin-bottom:1.5rem}
    .breadcrumb{font-size:.875rem;color:var(--c2);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
    .breadcrumb a{color:var(--c5);text-decoration:none}
    .breadcrumb a:hover{text-decoration:underline}
    .separator{color:var(--c3)}
    .header-main{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap}
    .page-title{font-size:1.5rem;font-weight:600;color:var(--c1);margin:0 0 .25rem}
    .page-description{color:var(--c2);margin:0;font-size:.9rem}
    .header-actions{display:flex;gap:.75rem}
    .btn-primary,.btn-secondary{display:flex;align-items:center;gap:.5rem;padding:.625rem 1rem;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;transition:all .2s}
    .btn-primary{background:var(--c5);color:#fff;border:none}
    .btn-primary:hover{background:#088888}
    .btn-secondary{background:#fff;color:var(--c1);border:1px solid var(--c3)}
    .btn-secondary:hover{border-color:var(--c5);color:var(--c5)}
    .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem}
    @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:640px){.stats-grid{grid-template-columns:1fr}}
    .stat-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3);display:flex;align-items:flex-start;gap:1rem}
    .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
    .stat-icon.items{background:#3b82f6}
    .stat-icon.value{background:var(--c6)}
    .stat-icon.in{background:#10b981}
    .stat-icon.out{background:var(--c8)}
    .stat-content{display:flex;flex-direction:column;gap:.125rem}
    .stat-label{font-size:.8rem;color:var(--c2)}
    .stat-value{font-size:1.375rem;font-weight:600;color:var(--c1)}
    .stat-value.positive{color:var(--c6)}
    .stat-value.negative{color:var(--c8)}
    .section-title{font-size:1rem;font-weight:600;color:var(--c1);margin:0 0 1rem}
    .status-section{margin-bottom:1.5rem}
    .status-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
    @media(max-width:768px){.status-cards{grid-template-columns:1fr}}
    .status-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .status-card.ok .status-count{color:var(--c6)}
    .status-card.ok .bar-fill{background:var(--c6)}
    .status-card.low .status-count{color:var(--c8)}
    .status-card.low .bar-fill{background:var(--c8)}
    .status-card.critical .status-count{color:var(--c7)}
    .status-card.critical .bar-fill{background:var(--c7)}
    .status-count{font-size:2rem;font-weight:700}
    .status-label{font-size:.875rem;color:var(--c2);margin:.25rem 0 .75rem}
    .status-bar{height:6px;background:var(--c4);border-radius:3px;overflow:hidden}
    .status-bar .bar-fill{height:100%;border-radius:3px;transition:width .3s}
    .breakdown-section{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem}
    @media(max-width:768px){.breakdown-section{grid-template-columns:1fr}}
    .breakdown-card{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .breakdown-list{display:flex;flex-direction:column;gap:.75rem}
    .breakdown-item{display:grid;grid-template-columns:1fr 100px 80px;gap:.75rem;align-items:center}
    .breakdown-info{display:flex;flex-direction:column;gap:.125rem}
    .breakdown-name{font-size:.875rem;font-weight:500;color:var(--c1)}
    .breakdown-count{font-size:.75rem;color:var(--c2)}
    .breakdown-bar{height:8px;background:var(--c4);border-radius:4px;overflow:hidden}
    .breakdown-bar .bar-fill{height:100%;border-radius:4px}
    .breakdown-value{font-size:.875rem;font-weight:600;color:var(--c1);text-align:right}
    .alerts-section{background:#fff;border-radius:12px;padding:1.25rem;border:1px solid var(--c3)}
    .alerts-table{margin-top:.5rem}
    .table-header,.table-row{display:grid;grid-template-columns:2fr 1fr 1fr .75fr 1fr .75fr;gap:1rem;padding:.75rem 0;align-items:center}
    .table-header{font-size:.75rem;text-transform:uppercase;font-weight:600;color:var(--c2);border-bottom:1px solid var(--c3)}
    .table-row{border-bottom:1px solid var(--c4);font-size:.875rem}
    .table-row:last-child{border-bottom:none}
    .cell-name{font-weight:500;color:var(--c1)}
    .cell-sku{color:var(--c2);font-family:monospace}
    .cell-category{color:var(--c2)}
    .cell-stock{font-weight:600}
    .cell-value{font-weight:500}
    .status-badge{padding:.25rem .625rem;border-radius:999px;font-size:.75rem;font-weight:500}
    .status-badge.low{background:#fef3c7;color:#d97706}
    .status-badge.critical{background:#fee2e2;color:var(--c7)}
    @media(max-width:768px){.table-header,.table-row{grid-template-columns:1fr 1fr;gap:.5rem}.table-header span:nth-child(n+3),.table-row span:nth-child(n+3){display:none}}
    @media(max-width:640px){.inventory-report{padding:1rem}.header-main{flex-direction:column}}
  `]
})
export class InventoryReportComponent implements OnInit {
  totalItems = signal(1245);
  totalValue = signal(456780.50);
  stockIn = signal(342);
  stockOut = signal(215);

  statusCounts = signal({ ok: 1102, low: 98, critical: 45 });

  categoryBreakdown = signal([
    { name: 'Pain Relief', count: 245, value: 89450, percentage: 100, color: '#0aaaaa' },
    { name: 'Antibiotics', count: 189, value: 76230, percentage: 85, color: '#3b82f6' },
    { name: 'Vitamins', count: 312, value: 54120, percentage: 60, color: '#8b5cf6' },
    { name: 'Cardiovascular', count: 156, value: 98540, percentage: 70, color: '#f59e0b' },
    { name: 'Dermatology', count: 98, value: 32450, percentage: 36, color: '#ec4899' }
  ]);

  manufacturerBreakdown = signal([
    { name: 'Bosnalijek', count: 312, value: 124500, percentage: 100, color: '#0aaaaa' },
    { name: 'Hemofarm', count: 245, value: 98760, percentage: 79, color: '#3b82f6' },
    { name: 'Alkaloid', count: 189, value: 76430, percentage: 61, color: '#8b5cf6' },
    { name: 'Pliva', count: 156, value: 65890, percentage: 53, color: '#f59e0b' },
    { name: 'Galenika', count: 134, value: 54230, percentage: 44, color: '#ec4899' }
  ]);

  lowStockItems = signal<InventoryItem[]>([
    { name: 'Amoxicillin 500mg', sku: 'AMX-500', category: 'Antibiotics', stock: 12, value: 156.00, status: 'critical' },
    { name: 'Metformin 850mg', sku: 'MTF-850', category: 'Diabetes', stock: 28, value: 89.50, status: 'low' },
    { name: 'Lisinopril 10mg', sku: 'LSP-010', category: 'Cardiovascular', stock: 8, value: 234.00, status: 'critical' },
    { name: 'Omeprazole 20mg', sku: 'OMP-020', category: 'Gastrointestinal', stock: 35, value: 178.50, status: 'low' },
    { name: 'Amlodipine 5mg', sku: 'AML-005', category: 'Cardiovascular', stock: 15, value: 145.00, status: 'critical' }
  ]);

  ngOnInit(): void {}
}
