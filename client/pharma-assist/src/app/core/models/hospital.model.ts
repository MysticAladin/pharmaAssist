// Department & Physician models matching backend DTOs

export enum PhysicianSpecialty {
  GeneralPractice = 1,
  InternalMedicine = 2,
  Cardiology = 3,
  Neurology = 4,
  Oncology = 5,
  Pediatrics = 6,
  Surgery = 7,
  Orthopedics = 8,
  Dermatology = 9,
  Psychiatry = 10,
  Gastroenterology = 11,
  Pulmonology = 12,
  Endocrinology = 13,
  Nephrology = 14,
  Rheumatology = 15,
  Ophthalmology = 16,
  ENT = 17,
  Urology = 18,
  Gynecology = 19,
  Anesthesiology = 20,
  Radiology = 21,
  Pathology = 22,
  Pharmacology = 23,
  Other = 99
}

export enum KOLStatus {
  None = 0,
  Potential = 1,
  Active = 2,
  Senior = 3
}

export const SPECIALTY_LABELS: Record<PhysicianSpecialty, string> = {
  [PhysicianSpecialty.GeneralPractice]: 'HOSPITAL.SPECIALTY.GENERAL_PRACTICE',
  [PhysicianSpecialty.InternalMedicine]: 'HOSPITAL.SPECIALTY.INTERNAL_MEDICINE',
  [PhysicianSpecialty.Cardiology]: 'HOSPITAL.SPECIALTY.CARDIOLOGY',
  [PhysicianSpecialty.Neurology]: 'HOSPITAL.SPECIALTY.NEUROLOGY',
  [PhysicianSpecialty.Oncology]: 'HOSPITAL.SPECIALTY.ONCOLOGY',
  [PhysicianSpecialty.Pediatrics]: 'HOSPITAL.SPECIALTY.PEDIATRICS',
  [PhysicianSpecialty.Surgery]: 'HOSPITAL.SPECIALTY.SURGERY',
  [PhysicianSpecialty.Orthopedics]: 'HOSPITAL.SPECIALTY.ORTHOPEDICS',
  [PhysicianSpecialty.Dermatology]: 'HOSPITAL.SPECIALTY.DERMATOLOGY',
  [PhysicianSpecialty.Psychiatry]: 'HOSPITAL.SPECIALTY.PSYCHIATRY',
  [PhysicianSpecialty.Gastroenterology]: 'HOSPITAL.SPECIALTY.GASTROENTEROLOGY',
  [PhysicianSpecialty.Pulmonology]: 'HOSPITAL.SPECIALTY.PULMONOLOGY',
  [PhysicianSpecialty.Endocrinology]: 'HOSPITAL.SPECIALTY.ENDOCRINOLOGY',
  [PhysicianSpecialty.Nephrology]: 'HOSPITAL.SPECIALTY.NEPHROLOGY',
  [PhysicianSpecialty.Rheumatology]: 'HOSPITAL.SPECIALTY.RHEUMATOLOGY',
  [PhysicianSpecialty.Ophthalmology]: 'HOSPITAL.SPECIALTY.OPHTHALMOLOGY',
  [PhysicianSpecialty.ENT]: 'HOSPITAL.SPECIALTY.ENT',
  [PhysicianSpecialty.Urology]: 'HOSPITAL.SPECIALTY.UROLOGY',
  [PhysicianSpecialty.Gynecology]: 'HOSPITAL.SPECIALTY.GYNECOLOGY',
  [PhysicianSpecialty.Anesthesiology]: 'HOSPITAL.SPECIALTY.ANESTHESIOLOGY',
  [PhysicianSpecialty.Radiology]: 'HOSPITAL.SPECIALTY.RADIOLOGY',
  [PhysicianSpecialty.Pathology]: 'HOSPITAL.SPECIALTY.PATHOLOGY',
  [PhysicianSpecialty.Pharmacology]: 'HOSPITAL.SPECIALTY.PHARMACOLOGY',
  [PhysicianSpecialty.Other]: 'HOSPITAL.SPECIALTY.OTHER'
};

export const KOL_STATUS_LABELS: Record<KOLStatus, string> = {
  [KOLStatus.None]: 'HOSPITAL.KOL.NONE',
  [KOLStatus.Potential]: 'HOSPITAL.KOL.POTENTIAL',
  [KOLStatus.Active]: 'HOSPITAL.KOL.ACTIVE',
  [KOLStatus.Senior]: 'HOSPITAL.KOL.SENIOR'
};

export interface Department {
  id: number;
  customerId: number;
  customerName: string;
  name: string;
  nameLocal?: string;
  floor?: string;
  headPhysicianId?: number;
  headPhysicianName?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  sortOrder: number;
  physicianCount: number;
  createdAt: string;
}

export interface DepartmentDetail extends Department {
  physicians: PhysicianSummary[];
}

export interface PhysicianSummary {
  id: number;
  fullName: string;
  specialty: PhysicianSpecialty;
  specialtyName?: string;
  kolStatus: KOLStatus;
  isActive: boolean;
}

export interface Physician {
  id: number;
  fullName: string;
  fullNameLocal?: string;
  specialty: PhysicianSpecialty;
  specialtyName?: string;
  specialtyOther?: string;
  institutionId: number;
  institutionName: string;
  departmentId?: number;
  departmentName?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  kolStatus: KOLStatus;
  kolStatusName?: string;
  notes?: string;
  isActive: boolean;
  prescriptionCount: number;
  createdAt: string;
}

export interface CreateDepartmentRequest {
  customerId: number;
  name: string;
  nameLocal?: string;
  floor?: string;
  headPhysicianId?: number;
  contactPhone?: string;
  contactEmail?: string;
  sortOrder: number;
}

export interface UpdateDepartmentRequest extends CreateDepartmentRequest {
  id: number;
}

export interface CreatePhysicianRequest {
  fullName: string;
  fullNameLocal?: string;
  specialty: PhysicianSpecialty;
  specialtyOther?: string;
  institutionId: number;
  departmentId?: number;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  kolStatus: KOLStatus;
  notes?: string;
}

export interface UpdatePhysicianRequest extends CreatePhysicianRequest {
  id: number;
}

export interface CustomerVisitHistory {
  customerId: number;
  customerName: string;
  customerType?: string;
  visits: CrossRepVisit[];
  totalVisits: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CrossRepVisit {
  id: number;
  repId: number;
  repName: string;
  checkInTime: string;
  checkOutTime?: string;
  actualDurationMinutes?: number;
  locationVerified: boolean;
  visitType?: string;
  outcome?: string;
  summary?: string;
  productsDiscussed?: string;
  competitionNotes?: string;
  agreedDeals?: string;
  followUpRequired: boolean;
  nextVisitDate?: string;
}
