// Audit Log Models

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'print'
  | 'status_change'
  | 'bulk_operation'
  | 'permission_change'
  | 'setting_change';

export type AuditEntityType =
  | 'product'
  | 'order'
  | 'customer'
  | 'prescription'
  | 'user'
  | 'setting'
  | 'manufacturer'
  | 'category'
  | 'batch'
  | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  details?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  severity: AuditSeverity;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogFilters {
  page: number;
  pageSize: number;
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  success?: boolean;
}

export interface AuditSummary {
  totalActions: number;
  actionsByType: Record<AuditAction, number>;
  actionsByEntity: Record<AuditEntityType, number>;
  recentCriticalEvents: AuditLog[];
  mostActiveUsers: Array<{ userId: string; userName: string; actionCount: number }>;
  failedOperations: number;
}

// For display in UI
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  view: 'Viewed',
  login: 'Logged In',
  logout: 'Logged Out',
  export: 'Exported',
  import: 'Imported',
  print: 'Printed',
  status_change: 'Status Changed',
  bulk_operation: 'Bulk Operation',
  permission_change: 'Permission Changed',
  setting_change: 'Setting Changed'
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  product: 'Product',
  order: 'Order',
  customer: 'Customer',
  prescription: 'Prescription',
  user: 'User',
  setting: 'Setting',
  manufacturer: 'Manufacturer',
  category: 'Category',
  batch: 'Batch',
  system: 'System'
};

export const AUDIT_ACTION_ICONS: Record<AuditAction, string> = {
  create: '➕',
  update: '✏️',
  delete: '🗑️',
  view: '👁️',
  login: '🔑',
  logout: '🚪',
  export: '📤',
  import: '📥',
  print: '🖨️',
  status_change: '🔄',
  bulk_operation: '📦',
  permission_change: '🛡️',
  setting_change: '⚙️'
};
