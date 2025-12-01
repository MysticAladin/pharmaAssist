/**
 * User and Authentication Models
 */

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  avatar?: string;
  isActive: boolean;
  roles: string[];
  permissions?: string[];
}

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ILoginResponse {
  succeeded: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  user?: IUser;
  errors?: string[];
}

export interface IRefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface IRefreshTokenResponse {
  succeeded: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  message?: string;
}

export interface IRegisterRequest {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * User Roles Enum - matches backend
 */
export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin',
  Manager = 'Manager',
  Pharmacist = 'Pharmacist',
  SalesRep = 'SalesRep',
  Warehouse = 'Warehouse',
  Customer = 'Customer'
}

/**
 * Permissions - granular access control
 */
export enum Permission {
  // Dashboard
  ViewDashboard = 'dashboard.view',
  ViewAdminDashboard = 'dashboard.admin',

  // Products
  ViewProducts = 'products.view',
  CreateProducts = 'products.create',
  EditProducts = 'products.edit',
  DeleteProducts = 'products.delete',

  // Orders
  ViewOrders = 'orders.view',
  CreateOrders = 'orders.create',
  EditOrders = 'orders.edit',
  DeleteOrders = 'orders.delete',
  ProcessOrders = 'orders.process',

  // Inventory
  ViewInventory = 'inventory.view',
  ManageInventory = 'inventory.manage',

  // Customers
  ViewCustomers = 'customers.view',
  CreateCustomers = 'customers.create',
  EditCustomers = 'customers.edit',
  DeleteCustomers = 'customers.delete',

  // Prescriptions
  ViewPrescriptions = 'prescriptions.view',
  CreatePrescriptions = 'prescriptions.create',
  ApprovePrescriptions = 'prescriptions.approve',
  RejectPrescriptions = 'prescriptions.reject',
  DispensePrescriptions = 'prescriptions.dispense',

  // Users
  ViewUsers = 'users.view',
  CreateUsers = 'users.create',
  EditUsers = 'users.edit',
  DeleteUsers = 'users.delete',
  ManageRoles = 'users.roles',

  // Reports
  ViewReports = 'reports.view',
  ExportReports = 'reports.export',
  ViewFinancialReports = 'reports.financial',

  // Settings
  ViewSettings = 'settings.view',
  ManageSettings = 'settings.manage',

  // Audit
  ViewAuditLogs = 'audit.view',

  // Files
  UploadFiles = 'files.upload',
  DeleteFiles = 'files.delete',

  // Email
  SendEmails = 'email.send',
  ViewEmailLogs = 'email.logs'
}

/**
 * Role to Permissions mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SuperAdmin]: Object.values(Permission),

  [UserRole.Admin]: [
    Permission.ViewDashboard,
    Permission.ViewAdminDashboard,
    Permission.ViewProducts, Permission.CreateProducts, Permission.EditProducts, Permission.DeleteProducts,
    Permission.ViewOrders, Permission.CreateOrders, Permission.EditOrders, Permission.DeleteOrders, Permission.ProcessOrders,
    Permission.ViewInventory, Permission.ManageInventory,
    Permission.ViewCustomers, Permission.CreateCustomers, Permission.EditCustomers, Permission.DeleteCustomers,
    Permission.ViewPrescriptions, Permission.CreatePrescriptions, Permission.ApprovePrescriptions, Permission.RejectPrescriptions, Permission.DispensePrescriptions,
    Permission.ViewUsers, Permission.CreateUsers, Permission.EditUsers,
    Permission.ViewReports, Permission.ExportReports, Permission.ViewFinancialReports,
    Permission.ViewSettings,
    Permission.ViewAuditLogs,
    Permission.UploadFiles, Permission.DeleteFiles,
    Permission.SendEmails, Permission.ViewEmailLogs
  ],

  [UserRole.Manager]: [
    Permission.ViewDashboard,
    Permission.ViewAdminDashboard,
    Permission.ViewProducts, Permission.EditProducts,
    Permission.ViewOrders, Permission.CreateOrders, Permission.EditOrders, Permission.ProcessOrders,
    Permission.ViewInventory, Permission.ManageInventory,
    Permission.ViewCustomers, Permission.CreateCustomers, Permission.EditCustomers,
    Permission.ViewPrescriptions, Permission.ApprovePrescriptions,
    Permission.ViewUsers,
    Permission.ViewReports, Permission.ExportReports,
    Permission.ViewAuditLogs,
    Permission.UploadFiles
  ],

  [UserRole.Pharmacist]: [
    Permission.ViewDashboard,
    Permission.ViewProducts,
    Permission.ViewOrders, Permission.EditOrders,
    Permission.ViewInventory,
    Permission.ViewCustomers,
    Permission.ViewPrescriptions, Permission.CreatePrescriptions, Permission.ApprovePrescriptions, Permission.RejectPrescriptions, Permission.DispensePrescriptions,
    Permission.ViewReports,
    Permission.UploadFiles
  ],

  [UserRole.SalesRep]: [
    Permission.ViewDashboard,
    Permission.ViewProducts,
    Permission.ViewOrders, Permission.CreateOrders, Permission.EditOrders,
    Permission.ViewCustomers, Permission.CreateCustomers, Permission.EditCustomers,
    Permission.ViewReports,
    Permission.UploadFiles
  ],

  [UserRole.Warehouse]: [
    Permission.ViewDashboard,
    Permission.ViewProducts,
    Permission.ViewOrders,
    Permission.ViewInventory, Permission.ManageInventory,
    Permission.UploadFiles
  ],

  [UserRole.Customer]: [
    Permission.ViewDashboard,
    Permission.ViewProducts,
    Permission.ViewOrders, Permission.CreateOrders,
    Permission.ViewPrescriptions, Permission.CreatePrescriptions,
    Permission.UploadFiles
  ]
};
