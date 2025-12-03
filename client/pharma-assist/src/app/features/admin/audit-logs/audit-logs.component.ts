import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuditService } from '../../../core/services/audit.service';
import {
  AuditLog,
  AuditLogFilters,
  AuditAction,
  AuditEntityType,
  AuditSeverity,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  AUDIT_ACTION_ICONS
} from '../../../core/models/audit.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="audit-logs-page">
      <header class="page-header">
        <div class="header-content">
          <h1>{{ 'audit.title' | translate }}</h1>
          <p class="subtitle">{{ 'audit.subtitle' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportLogs('csv')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ 'audit.exportCSV' | translate }}
          </button>
          <button class="btn btn-secondary" (click)="exportLogs('json')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {{ 'audit.exportJSON' | translate }}
          </button>
        </div>
      </header>

      <!-- Summary Cards -->
      <section class="summary-cards">
        <div class="summary-card">
          <span class="card-icon">📊</span>
          <div class="card-content">
            <span class="card-value">{{ totalActions() }}</span>
            <span class="card-label">{{ 'audit.totalActions' | translate }}</span>
          </div>
        </div>
        <div class="summary-card warning">
          <span class="card-icon">⚠️</span>
          <div class="card-content">
            <span class="card-value">{{ criticalEvents() }}</span>
            <span class="card-label">{{ 'audit.criticalEvents' | translate }}</span>
          </div>
        </div>
        <div class="summary-card danger">
          <span class="card-icon">❌</span>
          <div class="card-content">
            <span class="card-value">{{ failedOperations() }}</span>
            <span class="card-label">{{ 'audit.failedOperations' | translate }}</span>
          </div>
        </div>
        <div class="summary-card success">
          <span class="card-icon">👥</span>
          <div class="card-content">
            <span class="card-value">{{ activeUsers() }}</span>
            <span class="card-label">{{ 'audit.activeUsers' | translate }}</span>
          </div>
        </div>
      </section>

      <!-- Filters -->
      <section class="filters-section">
        <div class="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            [placeholder]="'audit.searchPlaceholder' | translate"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange()"
          />
        </div>

        <div class="filter-group">
          <select [(ngModel)]="selectedAction" (ngModelChange)="applyFilters()">
            <option value="">{{ 'audit.allActions' | translate }}</option>
            @for (action of actionOptions; track action) {
              <option [value]="action">{{ getActionLabel(action) }}</option>
            }
          </select>

          <select [(ngModel)]="selectedEntity" (ngModelChange)="applyFilters()">
            <option value="">{{ 'audit.allEntities' | translate }}</option>
            @for (entity of entityOptions; track entity) {
              <option [value]="entity">{{ getEntityLabel(entity) }}</option>
            }
          </select>

          <select [(ngModel)]="selectedSeverity" (ngModelChange)="applyFilters()">
            <option value="">{{ 'audit.allSeverities' | translate }}</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <input
            type="date"
            [(ngModel)]="startDate"
            (ngModelChange)="applyFilters()"
            [placeholder]="'common.from' | translate"
          />

          <input
            type="date"
            [(ngModel)]="endDate"
            (ngModelChange)="applyFilters()"
            [placeholder]="'common.to' | translate"
          />

          <button class="btn btn-text" (click)="clearFilters()">
            {{ 'common.clearFilters' | translate }}
          </button>
        </div>
      </section>

      <!-- Logs Table -->
      <section class="logs-section">
        @if (loading()) {
          <div class="loading-indicator">
            <div class="spinner"></div>
            <span>{{ 'common.loading' | translate }}</span>
          </div>
        } @else if (logs().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <h3>{{ 'audit.noLogs' | translate }}</h3>
            <p>{{ 'audit.noLogsMessage' | translate }}</p>
          </div>
        } @else {
          <div class="table-container">
            <table class="logs-table">
              <thead>
                <tr>
                  <th>{{ 'audit.columns.timestamp' | translate }}</th>
                  <th>{{ 'audit.columns.user' | translate }}</th>
                  <th>{{ 'audit.columns.action' | translate }}</th>
                  <th>{{ 'audit.columns.entity' | translate }}</th>
                  <th>{{ 'audit.columns.description' | translate }}</th>
                  <th>{{ 'audit.columns.severity' | translate }}</th>
                  <th>{{ 'audit.columns.status' | translate }}</th>
                  <th>{{ 'common.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logs(); track log.id) {
                  <tr [class.failed]="!log.success" [class.critical]="log.severity === 'critical'">
                    <td class="timestamp">{{ formatTimestamp(log.timestamp) }}</td>
                    <td class="user">
                      <span class="user-avatar">{{ log.userName.charAt(0) }}</span>
                      <span class="user-name">{{ log.userName }}</span>
                    </td>
                    <td class="action">
                      <span class="action-icon">{{ getActionIcon(log.action) }}</span>
                      <span class="action-label">{{ getActionLabel(log.action) }}</span>
                    </td>
                    <td class="entity">
                      <span class="entity-type">{{ getEntityLabel(log.entityType) }}</span>
                      @if (log.entityName) {
                        <span class="entity-name">{{ log.entityName }}</span>
                      }
                    </td>
                    <td class="description">{{ log.description }}</td>
                    <td>
                      <span class="severity-badge" [class]="log.severity">
                        {{ log.severity }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class.success]="log.success" [class.failed]="!log.success">
                        {{ log.success ? ('audit.success' | translate) : ('audit.failed' | translate) }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-icon" (click)="viewDetails(log)" [title]="'common.details' | translate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <span class="page-info">
              {{ 'common.showing' | translate }} {{ startItem() }}-{{ endItem() }} {{ 'common.of' | translate }} {{ totalItems() }}
            </span>
            <div class="page-controls">
              <button
                class="btn btn-icon"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              @for (page of visiblePages(); track page) {
                <button
                  class="btn page-btn"
                  [class.active]="page === currentPage()"
                  (click)="goToPage(page)"
                >
                  {{ page }}
                </button>
              }
              <button
                class="btn btn-icon"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
            <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()">
              <option [value]="10">10 {{ 'common.perPage' | translate }}</option>
              <option [value]="25">25 {{ 'common.perPage' | translate }}</option>
              <option [value]="50">50 {{ 'common.perPage' | translate }}</option>
              <option [value]="100">100 {{ 'common.perPage' | translate }}</option>
            </select>
          </div>
        }
      </section>

      <!-- Details Modal -->
      @if (selectedLog()) {
        <div class="modal-backdrop" (click)="closeDetails()">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h2>{{ 'audit.logDetails' | translate }}</h2>
              <button class="btn btn-icon" (click)="closeDetails()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </header>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <label>{{ 'audit.columns.timestamp' | translate }}</label>
                  <span>{{ formatTimestamp(selectedLog()!.timestamp) }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ 'audit.columns.user' | translate }}</label>
                  <span>{{ selectedLog()!.userName }} ({{ selectedLog()!.userEmail }})</span>
                </div>
                <div class="detail-item">
                  <label>{{ 'audit.columns.action' | translate }}</label>
                  <span>{{ getActionIcon(selectedLog()!.action) }} {{ getActionLabel(selectedLog()!.action) }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ 'audit.columns.entity' | translate }}</label>
                  <span>{{ getEntityLabel(selectedLog()!.entityType) }}: {{ selectedLog()!.entityName || selectedLog()!.entityId }}</span>
                </div>
                <div class="detail-item full-width">
                  <label>{{ 'audit.columns.description' | translate }}</label>
                  <span>{{ selectedLog()!.description }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ 'audit.columns.severity' | translate }}</label>
                  <span class="severity-badge" [class]="selectedLog()!.severity">{{ selectedLog()!.severity }}</span>
                </div>
                <div class="detail-item">
                  <label>{{ 'audit.columns.status' | translate }}</label>
                  <span class="status-badge" [class.success]="selectedLog()!.success" [class.failed]="!selectedLog()!.success">
                    {{ selectedLog()!.success ? ('audit.success' | translate) : ('audit.failed' | translate) }}
                  </span>
                </div>
                @if (selectedLog()!.errorMessage) {
                  <div class="detail-item full-width error">
                    <label>{{ 'audit.errorMessage' | translate }}</label>
                    <span>{{ selectedLog()!.errorMessage }}</span>
                  </div>
                }
                @if (selectedLog()!.details) {
                  <div class="detail-item full-width">
                    <label>{{ 'audit.additionalDetails' | translate }}</label>
                    <pre>{{ selectedLog()!.details | json }}</pre>
                  </div>
                }
              </div>
            </div>
            <footer class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDetails()">{{ 'common.close' | translate }}</button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-logs-page {
      padding: 1.5rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      background: var(--bg-hover);
    }

    .btn-icon {
      padding: 0.5rem;
      background: transparent;
    }

    .btn-icon:hover {
      background: var(--bg-hover);
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-text {
      background: transparent;
      color: var(--primary);
    }

    .btn-text:hover {
      background: rgba(79, 70, 229, 0.1);
    }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }

    .summary-card.warning {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }

    .summary-card.danger {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .summary-card.success {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    .card-icon {
      font-size: 2rem;
    }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .card-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Filters */
    .filters-section {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 250px;
      padding: 0.5rem 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .search-box svg {
      color: var(--text-muted);
    }

    .search-box input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .search-box input:focus {
      outline: none;
    }

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .filter-group select,
    .filter-group input[type="date"] {
      padding: 0.5rem 0.75rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    /* Table */
    .logs-section {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
    }

    .table-container {
      overflow-x: auto;
    }

    .logs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .logs-table th,
    .logs-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .logs-table th {
      background: var(--bg-secondary);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .logs-table tr:hover {
      background: var(--bg-hover);
    }

    .logs-table tr.failed {
      background: rgba(239, 68, 68, 0.05);
    }

    .logs-table tr.critical {
      background: rgba(245, 158, 11, 0.05);
    }

    .timestamp {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-name {
      font-weight: 500;
    }

    .action {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-icon {
      font-size: 1rem;
    }

    .action-label {
      font-size: 0.875rem;
    }

    .entity {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .entity-type {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .entity-name {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .description {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .severity-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .severity-badge.info {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .severity-badge.warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .severity-badge.critical {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .status-badge.failed {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .page-info {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .page-controls {
      display: flex;
      gap: 0.25rem;
    }

    .page-btn {
      min-width: 32px;
      padding: 0.25rem 0.5rem;
    }

    .page-btn.active {
      background: var(--primary);
      color: white;
    }

    .pagination select {
      padding: 0.375rem 0.5rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 0.875rem;
    }

    /* Loading and Empty States */
    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
    }

    .spinner {
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

    .empty-state {
      text-align: center;
      padding: 3rem;
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0;
      color: var(--text-secondary);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: var(--bg-primary);
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-item.error {
      background: rgba(239, 68, 68, 0.1);
      padding: 0.75rem;
      border-radius: 8px;
    }

    .detail-item label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .detail-item span, .detail-item pre {
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .detail-item pre {
      margin: 0;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.8125rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .filters-section {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly translateService = inject(TranslateService);

  // State
  loading = signal(false);
  logs = signal<AuditLog[]>([]);
  selectedLog = signal<AuditLog | null>(null);

  // Filters
  searchTerm = '';
  selectedAction: AuditAction | '' = '';
  selectedEntity: AuditEntityType | '' = '';
  selectedSeverity: AuditSeverity | '' = '';
  startDate = '';
  endDate = '';

  // Pagination
  currentPage = signal(1);
  pageSize = 25;
  totalItems = signal(0);
  totalPages = signal(1);

  // Options
  actionOptions: AuditAction[] = [
    'create', 'update', 'delete', 'view', 'login', 'logout',
    'export', 'import', 'print', 'status_change', 'bulk_operation',
    'permission_change', 'setting_change'
  ];

  entityOptions: AuditEntityType[] = [
    'product', 'order', 'customer', 'prescription', 'user',
    'setting', 'manufacturer', 'category', 'batch', 'system'
  ];

  // Summary stats
  totalActions = signal(0);
  criticalEvents = signal(0);
  failedOperations = signal(0);
  activeUsers = signal(0);

  // Computed
  startItem = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  endItem = computed(() => Math.min(this.currentPage() * this.pageSize, this.totalItems()));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(5, total);
      } else {
        start = Math.max(1, total - 4);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadLogs();
    this.loadSummary();
  }

  loadLogs(): void {
    this.loading.set(true);

    const filters: AuditLogFilters = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      action: this.selectedAction || undefined,
      entityType: this.selectedEntity || undefined,
      severity: this.selectedSeverity || undefined,
      startDate: this.startDate ? new Date(this.startDate) : undefined,
      endDate: this.endDate ? new Date(this.endDate) : undefined
    };

    this.auditService.getLogs(filters).subscribe({
      next: (result) => {
        this.logs.set(result.data);
        this.totalItems.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit logs:', err);
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.auditService.getSummary().subscribe(summary => {
      this.totalActions.set(summary.totalActions);
      this.criticalEvents.set(summary.recentCriticalEvents.length);
      this.failedOperations.set(summary.failedOperations);
      this.activeUsers.set(summary.mostActiveUsers.length);
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadLogs();
    }, 300);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedAction = '';
    this.selectedEntity = '';
    this.selectedSeverity = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage.set(1);
    this.loadLogs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadLogs();
    }
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  viewDetails(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  closeDetails(): void {
    this.selectedLog.set(null);
  }

  exportLogs(format: 'csv' | 'json'): void {
    const filters: AuditLogFilters = {
      page: 1,
      pageSize: 10000,
      search: this.searchTerm || undefined,
      action: this.selectedAction || undefined,
      entityType: this.selectedEntity || undefined,
      severity: this.selectedSeverity || undefined,
      startDate: this.startDate ? new Date(this.startDate) : undefined,
      endDate: this.endDate ? new Date(this.endDate) : undefined
    };

    this.auditService.exportLogs(filters, format);
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleString(this.translateService.currentLang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getActionLabel(action: AuditAction): string {
    return AUDIT_ACTION_LABELS[action] || action;
  }

  getActionIcon(action: AuditAction): string {
    return AUDIT_ACTION_ICONS[action] || '📌';
  }

  getEntityLabel(entity: AuditEntityType): string {
    return AUDIT_ENTITY_LABELS[entity] || entity;
  }
}
