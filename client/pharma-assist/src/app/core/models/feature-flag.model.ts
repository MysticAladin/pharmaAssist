/**
 * Feature Flags Model
 * Used for upselling and feature gating
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
  CustomIntegrations = 'custom_integrations'
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
  }
};
