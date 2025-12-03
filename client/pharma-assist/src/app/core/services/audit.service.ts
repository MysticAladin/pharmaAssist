import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  AuditLog,
  AuditLogFilters,
  AuditSummary,
  AuditAction,
  AuditEntityType,
  AuditSeverity
} from '../models/audit.model';
import { environment } from '../../../environments/environment';

interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/audit`;

  // Local cache for demo
  private auditLogs = signal<AuditLog[]>(this.generateMockLogs());

  // Reactive state
  readonly recentLogs = computed(() => this.auditLogs().slice(0, 50));
  readonly criticalLogs = computed(() =>
    this.auditLogs().filter(log => log.severity === 'critical')
  );

  /**
   * Log an action
   */
  log(
    action: AuditAction,
    entityType: AuditEntityType,
    description: string,
    options?: {
      entityId?: string;
      entityName?: string;
      details?: Record<string, unknown>;
      previousValue?: unknown;
      newValue?: unknown;
      severity?: AuditSeverity;
      success?: boolean;
      errorMessage?: string;
    }
  ): void {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: 'current-user', // Would come from auth service
      userName: 'Admin User',
      userEmail: 'admin@pharmaassist.com',
      action,
      entityType,
      description,
      entityId: options?.entityId,
      entityName: options?.entityName,
      details: options?.details,
      previousValue: options?.previousValue,
      newValue: options?.newValue,
      severity: options?.severity || 'info',
      success: options?.success ?? true,
      errorMessage: options?.errorMessage
    };

    // Add to local cache
    this.auditLogs.update(logs => [log, ...logs]);

    // In production, would also POST to backend
    // this.http.post(this.apiUrl, log).subscribe();
  }

  /**
   * Get paginated audit logs
   */
  getLogs(filters: AuditLogFilters): Observable<PagedResponse<AuditLog>> {
    // In production, would call backend
    // let params = new HttpParams()
    //   .set('page', filters.page.toString())
    //   .set('pageSize', filters.pageSize.toString());
    // return this.http.get<PagedResponse<AuditLog>>(this.apiUrl, { params });

    // Demo: filter local data
    let logs = [...this.auditLogs()];

    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters.entityType) {
      logs = logs.filter(l => l.entityType === filters.entityType);
    }
    if (filters.severity) {
      logs = logs.filter(l => l.severity === filters.severity);
    }
    if (filters.success !== undefined) {
      logs = logs.filter(l => l.success === filters.success);
    }
    if (filters.startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= filters.startDate!);
    }
    if (filters.endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= filters.endDate!);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      logs = logs.filter(l =>
        l.description.toLowerCase().includes(search) ||
        l.userName.toLowerCase().includes(search) ||
        l.entityName?.toLowerCase().includes(search)
      );
    }

    const totalCount = logs.length;
    const start = (filters.page - 1) * filters.pageSize;
    const data = logs.slice(start, start + filters.pageSize);

    return of({
      data,
      totalCount,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(totalCount / filters.pageSize)
    });
  }

  /**
   * Get audit log by ID
   */
  getById(id: string): Observable<AuditLog | undefined> {
    const log = this.auditLogs().find(l => l.id === id);
    return of(log);
  }

  /**
   * Get audit summary/statistics
   */
  getSummary(startDate?: Date, endDate?: Date): Observable<AuditSummary> {
    let logs = this.auditLogs();

    if (startDate) {
      logs = logs.filter(l => new Date(l.timestamp) >= startDate);
    }
    if (endDate) {
      logs = logs.filter(l => new Date(l.timestamp) <= endDate);
    }

    const actionsByType = {} as Record<AuditAction, number>;
    const actionsByEntity = {} as Record<AuditEntityType, number>;
    const userActions: Record<string, { userId: string; userName: string; count: number }> = {};

    logs.forEach(log => {
      // Count by action type
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

      // Count by entity type
      actionsByEntity[log.entityType] = (actionsByEntity[log.entityType] || 0) + 1;

      // Count by user
      if (!userActions[log.userId]) {
        userActions[log.userId] = { userId: log.userId, userName: log.userName, count: 0 };
      }
      userActions[log.userId].count++;
    });

    const summary: AuditSummary = {
      totalActions: logs.length,
      actionsByType,
      actionsByEntity,
      recentCriticalEvents: logs.filter(l => l.severity === 'critical').slice(0, 5),
      mostActiveUsers: Object.values(userActions)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(u => ({ userId: u.userId, userName: u.userName, actionCount: u.count })),
      failedOperations: logs.filter(l => !l.success).length
    };

    return of(summary);
  }

  /**
   * Export audit logs
   */
  exportLogs(filters: AuditLogFilters, format: 'csv' | 'json'): void {
    this.getLogs({ ...filters, page: 1, pageSize: 10000 }).subscribe(result => {
      const data = result.data;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `audit-logs-${this.formatDate(new Date())}.json`);
      } else {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, `audit-logs-${this.formatDate(new Date())}.csv`);
      }
    });
  }

  private convertToCSV(logs: AuditLog[]): string {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity', 'Description', 'Severity', 'Success'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.userName,
      log.action,
      log.entityType,
      log.entityName || log.entityId || '',
      log.description,
      log.severity,
      log.success ? 'Yes' : 'No'
    ]);

    return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate mock audit logs for demo
   */
  private generateMockLogs(): AuditLog[] {
    const users = [
      { id: 'user-1', name: 'Admin User', email: 'admin@pharmaassist.com' },
      { id: 'user-2', name: 'Pharmacist One', email: 'pharm1@pharmaassist.com' },
      { id: 'user-3', name: 'Manager Smith', email: 'manager@pharmaassist.com' }
    ];

    const actions: Array<{ action: AuditAction; entityType: AuditEntityType; desc: string; severity: AuditSeverity }> = [
      { action: 'create', entityType: 'product', desc: 'Created new product', severity: 'info' },
      { action: 'update', entityType: 'product', desc: 'Updated product details', severity: 'info' },
      { action: 'delete', entityType: 'product', desc: 'Deleted product', severity: 'warning' },
      { action: 'create', entityType: 'order', desc: 'Created new order', severity: 'info' },
      { action: 'update', entityType: 'order', desc: 'Updated order status', severity: 'info' },
      { action: 'status_change', entityType: 'order', desc: 'Order status changed to Completed', severity: 'info' },
      { action: 'create', entityType: 'customer', desc: 'Added new customer', severity: 'info' },
      { action: 'update', entityType: 'customer', desc: 'Updated customer info', severity: 'info' },
      { action: 'view', entityType: 'prescription', desc: 'Viewed prescription details', severity: 'info' },
      { action: 'print', entityType: 'prescription', desc: 'Printed prescription label', severity: 'info' },
      { action: 'export', entityType: 'product', desc: 'Exported product list to CSV', severity: 'info' },
      { action: 'login', entityType: 'system', desc: 'User logged in', severity: 'info' },
      { action: 'logout', entityType: 'system', desc: 'User logged out', severity: 'info' },
      { action: 'permission_change', entityType: 'user', desc: 'User permissions modified', severity: 'critical' },
      { action: 'setting_change', entityType: 'setting', desc: 'System settings updated', severity: 'warning' },
      { action: 'bulk_operation', entityType: 'product', desc: 'Bulk price update applied', severity: 'warning' }
    ];

    const logs: AuditLog[] = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const actionInfo = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days

      logs.push({
        id: `log-${i}`,
        timestamp,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: actionInfo.action,
        entityType: actionInfo.entityType,
        entityId: `${actionInfo.entityType}-${Math.floor(Math.random() * 1000)}`,
        entityName: `${actionInfo.entityType.charAt(0).toUpperCase() + actionInfo.entityType.slice(1)} #${Math.floor(Math.random() * 1000)}`,
        description: actionInfo.desc,
        severity: actionInfo.severity,
        success: Math.random() > 0.05, // 95% success rate
        errorMessage: Math.random() > 0.95 ? 'Operation timed out' : undefined
      });
    }

    // Sort by timestamp descending
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
