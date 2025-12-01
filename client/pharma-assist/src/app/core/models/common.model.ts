/**
 * API Response Models
 */

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface IPagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface IQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string | number | boolean>;
}

/**
 * Common Entity Models
 */
export interface IBaseEntity {
  id: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IAuditableEntity extends IBaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Select Option for dropdowns
 */
export interface ISelectOption<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Table Column Definition
 */
export interface ITableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'badge' | 'actions';
  format?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Notification/Toast
 */
export interface INotification {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Confirmation Dialog
 */
export interface IConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

/**
 * Breadcrumb
 */
export interface IBreadcrumb {
  label: string;
  route?: string;
  icon?: string;
}

/**
 * Navigation Menu Item
 */
export interface IMenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children?: IMenuItem[];
  roles?: string[];
  permissions?: string[];
  featureFlag?: string;
  badge?: {
    text: string;
    type: 'primary' | 'success' | 'warning' | 'danger';
  };
  expanded?: boolean;
}
