// Sales Representative interfaces matching backend DTOs

export enum RepresentativeType {
  Commercial = 1,
  Medical = 2
}

export enum RepresentativeStatus {
  Active = 1,
  Inactive = 2,
  OnLeave = 3,
  Terminated = 4
}

export interface SalesRepresentative {
  id: number;
  userId: string;
  repType: RepresentativeType;
  repTypeName: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobile?: string;
  hireDate: string;
  status: RepresentativeStatus;
  statusName: string;
  territoryDescription?: string;
  createdAt: string;
  updatedAt?: string;
  managers: ManagerAssignment[];
  assignedCustomersCount: number;
}

export interface SalesRepresentativeSummary {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  repType: RepresentativeType;
  repTypeName: string;
  status: RepresentativeStatus;
  statusName: string;
  territoryDescription?: string;
  primaryManagerName?: string;
  assignedCustomersCount: number;
}

export interface ManagerAssignment {
  assignmentId: number;
  managerId: number;
  managerName: string;
  managerEmployeeCode: string;
  isPrimary: boolean;
  isActive: boolean;
  assignmentDate: string;
}

export interface CustomerAssignment {
  assignmentId: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  city?: string;
  isActive: boolean;
  assignmentDate: string;
}

export interface CreateSalesRepresentative {
  userId: string;
  repType: RepresentativeType;
  employeeCode: string;
  mobile?: string;
  hireDate: string;
  territoryDescription?: string;
  managerIds: number[];
  primaryManagerId?: number;
}

export interface UpdateSalesRepresentative {
  repType: RepresentativeType;
  mobile?: string;
  hireDate: string;
  status: RepresentativeStatus;
  territoryDescription?: string;
}

export interface UpdateManagerAssignments {
  managerIds: number[];
  primaryManagerId?: number;
}

export interface AssignCustomers {
  customerIds: number[];
}

export interface RepHierarchy {
  managerId: number;
  managerName: string;
  managerEmployeeCode: string;
  managerRepType: RepresentativeType;
  teamMembers: SalesRepresentativeSummary[];
}

export interface SalesRepQuery {
  search?: string;
  repType?: RepresentativeType;
  status?: RepresentativeStatus;
  managerId?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedSalesReps {
  items: SalesRepresentativeSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
