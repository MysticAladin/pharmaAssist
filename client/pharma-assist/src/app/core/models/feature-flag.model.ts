/**
 * Feature Flags Model
 * Used for upselling, feature gating, and runtime configuration
 * Supports both system-level and client-level flags stored in database
 */

export interface IFeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  tier: FeatureTier;
  metadata?: Record<string, unknown>;
}

/**
 * Feature Tiers for upselling
 */
export enum FeatureTier {
  Free = 'free',
  Basic = 'basic',
  Professional = 'professional',
  Enterprise = 'enterprise'
}

// ============================================
// Database-backed Feature Flag System
// ============================================

/**
 * Scope of a feature flag
 * - System: Global flag affecting all clients
 * - Client: Per-client override (pharmacy-specific)
 */
export enum FlagScope {
  System = 'system',
  Client = 'client'
}

/**
 * Type of the flag value
 */
export enum FlagType {
  Boolean = 'boolean',
  String = 'string',
  Number = 'number',
  Json = 'json',
  Percentage = 'percentage' // For gradual rollouts
}

/**
 * Category for organizing flags in the admin UI
 */
export enum FlagCategory {
  Portal = 'portal',
  Billing = 'billing',
  Inventory = 'inventory',
  Orders = 'orders',
  Reports = 'reports',
  Integration = 'integration',
  UI = 'ui',
  Experimental = 'experimental'
}

/**
 * System-level feature flag stored in database
 */
export interface SystemFeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: FlagCategory;
  type: FlagType;
  defaultValue: unknown;
  currentValue: unknown;
  enabled: boolean;
  allowClientOverride: boolean; // Can clients override this flag?
  environment?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Client-level feature flag override
 * References a system flag and provides client-specific value
 */
export interface ClientFeatureFlag {
  id: string;
  customerId: string; // Customer ID (pharmacy)
  customerName?: string;
  systemFlagId: string; // Reference to SystemFeatureFlag
  flagKey: string;
  flagName?: string;
  value: unknown;
  enabled: boolean;
  reason?: string; // Why was this overridden?
  expiresAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Combined view of a flag for a specific client
 * Used for flag evaluation
 */
export interface EvaluatedFlag {
  key: string;
  name: string;
  description: string;
  category: FlagCategory;
  type: FlagType;
  value: unknown;
  enabled: boolean;
  source: FlagScope; // Where did the value come from?
  systemValue: unknown;
  clientOverride?: unknown;
  allowClientOverride: boolean;
}

/**
 * Request to create or update a system flag
 */
export interface SystemFlagRequest {
  key: string;
  name: string;
  description: string;
  category: FlagCategory;
  type: FlagType;
  defaultValue: unknown;
  enabled: boolean;
  allowClientOverride: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Request to create or update a client flag override
 */
export interface ClientFlagRequest {
  customerId: number;
  systemFlagId: number;
  value: string;
  isEnabled: boolean;
  reason?: string;
  expiresAt?: string;
}

/**
 * Bulk update request for multiple flags
 */
export interface BulkFlagUpdateRequest {
  scope: FlagScope;
  updates: Array<{
    key: string;
    enabled?: boolean;
    value?: unknown;
  }>;
  clientId?: string; // Required for client scope
}

/**
 * History entry for flag changes (audit log)
 */
export interface FlagHistoryEntry {
  id: string;
  flagKey: string;
  scope: FlagScope;
  clientId?: string;
  previousValue: unknown;
  newValue: unknown;
  previousEnabled: boolean;
  newEnabled: boolean;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

/**
 * Response for paginated flag lists
 */
export interface FlagListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Filter options for querying flags
 */
export interface FlagFilterOptions {
  category?: FlagCategory;
  enabled?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'key' | 'name' | 'category' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Predefined flag keys for type safety
 */
export const SYSTEM_FLAGS = {
  // Portal Features
  PORTAL_ENABLED: 'portal.enabled',
  PORTAL_SPLIT_INVOICE: 'portal.split_invoice',
  PORTAL_PRESCRIPTION_UPLOAD: 'portal.prescription_upload',
  PORTAL_FAVORITES: 'portal.favorites',
  PORTAL_QUICK_ORDER: 'portal.quick_order',
  PORTAL_ORDER_HISTORY: 'portal.order_history',
  PORTAL_ACCOUNT_SETTINGS: 'portal.account_settings',

  // Billing Features
  BILLING_CREDIT_TERMS: 'billing.credit_terms',
  BILLING_INVOICE_PDF: 'billing.invoice_pdf',
  BILLING_PAYMENT_REMINDER: 'billing.payment_reminder',
  BILLING_AUTO_INVOICE: 'billing.auto_invoice',

  // Inventory Features
  INVENTORY_LOW_STOCK_ALERT: 'inventory.low_stock_alert',
  INVENTORY_EXPIRY_ALERT: 'inventory.expiry_alert',
  INVENTORY_AUTO_REORDER: 'inventory.auto_reorder',
  INVENTORY_BATCH_TRACKING: 'inventory.batch_tracking',

  // Order Features
  ORDERS_BULK_IMPORT: 'orders.bulk_import',
  ORDERS_RECURRING: 'orders.recurring',
  ORDERS_APPROVAL_WORKFLOW: 'orders.approval_workflow',
  ORDERS_DELIVERY_TRACKING: 'orders.delivery_tracking',

  // Report Features
  REPORTS_PDF_EXPORT: 'reports.pdf_export',
  REPORTS_EXCEL_EXPORT: 'reports.excel_export',
  REPORTS_SCHEDULED: 'reports.scheduled',
  REPORTS_CUSTOM: 'reports.custom',

  // Integration Features
  INTEGRATION_API_ACCESS: 'integration.api_access',
  INTEGRATION_WEBHOOK: 'integration.webhook',
  INTEGRATION_SSO: 'integration.sso',

  // UI Features
  UI_DARK_MODE: 'ui.dark_mode',
  UI_COMPACT_VIEW: 'ui.compact_view',
  UI_ADVANCED_FILTERS: 'ui.advanced_filters',

  // Experimental Features
  EXPERIMENTAL_AI_SEARCH: 'experimental.ai_search',
  EXPERIMENTAL_VOICE_ORDER: 'experimental.voice_order',
  EXPERIMENTAL_CHAT_SUPPORT: 'experimental.chat_support'
} as const;

export type SystemFlagKey = typeof SYSTEM_FLAGS[keyof typeof SYSTEM_FLAGS];

/**
 * Feature Keys - all available features
 */
export enum FeatureKey {
  // Core Features (Free)
  BasicDashboard = 'basic_dashboard',
  ProductCatalog = 'product_catalog',
  BasicOrders = 'basic_orders',

  // Basic Tier
  InventoryManagement = 'inventory_management',
  CustomerManagement = 'customer_management',
  BasicReports = 'basic_reports',

  // Professional Tier
  AdvancedDashboard = 'advanced_dashboard',
  PrescriptionManagement = 'prescription_management',
  AdvancedReports = 'advanced_reports',
  ExportReports = 'export_reports',
  BulkOperations = 'bulk_operations',
  EmailNotifications = 'email_notifications',
  LowStockAlerts = 'low_stock_alerts',
  ExpiryAlerts = 'expiry_alerts',

  // Enterprise Tier
  MultiWarehouse = 'multi_warehouse',
  AdvancedAnalytics = 'advanced_analytics',
  CustomReports = 'custom_reports',
  ApiAccess = 'api_access',
  WhiteLabeling = 'white_labeling',
  PrioritySupport = 'priority_support',
  AuditLogs = 'audit_logs',
  SsoIntegration = 'sso_integration',
  CustomIntegrations = 'custom_integrations',
  TenderManagement = 'tender_management'
}

/**
 * Default feature configuration per tier
 */
export const TIER_FEATURES: Record<FeatureTier, FeatureKey[]> = {
  [FeatureTier.Free]: [
    FeatureKey.BasicDashboard,
    FeatureKey.ProductCatalog,
    FeatureKey.BasicOrders
  ],

  [FeatureTier.Basic]: [
    FeatureKey.BasicDashboard,
    FeatureKey.ProductCatalog,
    FeatureKey.BasicOrders,
    FeatureKey.InventoryManagement,
    FeatureKey.CustomerManagement,
    FeatureKey.BasicReports
  ],

  [FeatureTier.Professional]: [
    FeatureKey.BasicDashboard,
    FeatureKey.AdvancedDashboard,
    FeatureKey.ProductCatalog,
    FeatureKey.BasicOrders,
    FeatureKey.InventoryManagement,
    FeatureKey.CustomerManagement,
    FeatureKey.BasicReports,
    FeatureKey.PrescriptionManagement,
    FeatureKey.AdvancedReports,
    FeatureKey.ExportReports,
    FeatureKey.BulkOperations,
    FeatureKey.EmailNotifications,
    FeatureKey.LowStockAlerts,
    FeatureKey.ExpiryAlerts
  ],

  [FeatureTier.Enterprise]: Object.values(FeatureKey)
};

/**
 * Feature metadata for upsell prompts
 */
export const FEATURE_METADATA: Record<FeatureKey, { name: string; description: string; tier: FeatureTier }> = {
  [FeatureKey.BasicDashboard]: {
    name: 'Basic Dashboard',
    description: 'View basic sales and order statistics',
    tier: FeatureTier.Free
  },
  [FeatureKey.ProductCatalog]: {
    name: 'Product Catalog',
    description: 'Browse and manage product listings',
    tier: FeatureTier.Free
  },
  [FeatureKey.BasicOrders]: {
    name: 'Basic Orders',
    description: 'Create and manage orders',
    tier: FeatureTier.Free
  },
  [FeatureKey.InventoryManagement]: {
    name: 'Inventory Management',
    description: 'Track stock levels and movements',
    tier: FeatureTier.Basic
  },
  [FeatureKey.CustomerManagement]: {
    name: 'Customer Management',
    description: 'Manage customer profiles and history',
    tier: FeatureTier.Basic
  },
  [FeatureKey.BasicReports]: {
    name: 'Basic Reports',
    description: 'Generate simple sales and inventory reports',
    tier: FeatureTier.Basic
  },
  [FeatureKey.AdvancedDashboard]: {
    name: 'Advanced Dashboard',
    description: 'Comprehensive analytics with charts and KPIs',
    tier: FeatureTier.Professional
  },
  [FeatureKey.PrescriptionManagement]: {
    name: 'Prescription Management',
    description: 'Handle prescription uploads and approvals',
    tier: FeatureTier.Professional
  },
  [FeatureKey.AdvancedReports]: {
    name: 'Advanced Reports',
    description: 'Detailed financial and inventory reports',
    tier: FeatureTier.Professional
  },
  [FeatureKey.ExportReports]: {
    name: 'Export Reports',
    description: 'Export reports to CSV, PDF formats',
    tier: FeatureTier.Professional
  },
  [FeatureKey.BulkOperations]: {
    name: 'Bulk Operations',
    description: 'Perform bulk updates on products and orders',
    tier: FeatureTier.Professional
  },
  [FeatureKey.EmailNotifications]: {
    name: 'Email Notifications',
    description: 'Automated email alerts and notifications',
    tier: FeatureTier.Professional
  },
  [FeatureKey.LowStockAlerts]: {
    name: 'Low Stock Alerts',
    description: 'Automatic alerts when stock is low',
    tier: FeatureTier.Professional
  },
  [FeatureKey.ExpiryAlerts]: {
    name: 'Expiry Alerts',
    description: 'Notifications for expiring products',
    tier: FeatureTier.Professional
  },
  [FeatureKey.MultiWarehouse]: {
    name: 'Multi-Warehouse',
    description: 'Manage inventory across multiple locations',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.AdvancedAnalytics]: {
    name: 'Advanced Analytics',
    description: 'AI-powered insights and predictions',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.CustomReports]: {
    name: 'Custom Reports',
    description: 'Build custom report templates',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.ApiAccess]: {
    name: 'API Access',
    description: 'Full REST API access for integrations',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.WhiteLabeling]: {
    name: 'White Labeling',
    description: 'Custom branding and theming',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.PrioritySupport]: {
    name: 'Priority Support',
    description: '24/7 priority customer support',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.AuditLogs]: {
    name: 'Audit Logs',
    description: 'Complete audit trail of all actions',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.SsoIntegration]: {
    name: 'SSO Integration',
    description: 'Single Sign-On with Azure AD, Google',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.CustomIntegrations]: {
    name: 'Custom Integrations',
    description: 'Connect with external systems',
    tier: FeatureTier.Enterprise
  },
  [FeatureKey.TenderManagement]: {
    name: 'Tender Management',
    description: 'Manage institutional procurement tenders and bids',
    tier: FeatureTier.Enterprise
  }
};
