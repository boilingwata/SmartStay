import { RoomStatus } from "./Room";

export type TenantStatus = 'Active' | 'CheckedOut' | 'Blacklisted';

export interface Tenant {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  cccd: string;
  status: TenantStatus;
  currentRoomId?: string;
  currentRoomCode?: string;
  currentBuildingId?: string;
  avatarUrl?: string;
  onboardingPercent: number;
}

export interface TenantProfile extends Tenant {
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // ISO format
  cccdIssuedDate: string;
  cccdIssuedPlace: string;
  nationality: string;
  occupation: string;
  permanentAddress: string;
  vehiclePlates: string[]; // JSON array mapped to string[]
  notes: string;
}

export interface EmergencyContact {
  id: string;
  tenantId: string;
  contactName: string;
  relationship: 'Vo/Chong' | 'Cha/Me' | 'Anh/Chi/Em' | 'Ban be' | 'Khac';
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface OnboardingStep {
  name: string;
  status: boolean;
  actionLabel: string;
  route?: string;
  actionKey: keyof OnboardingProgress;
}

export interface OnboardingProgress {
  tenantId: string;
  isPersonalInfoConfirmed: boolean;
  isCCCDUploaded: boolean;
  isEmergencyContactAdded: boolean;
  isContractSigned: boolean;
  isDepositPaid: boolean;
  isRoomHandovered: boolean;
  completionPercent: number;
}

export interface TenantFeedback {
  id: string;
  tenantId: string;
  feedbackType: 'Complaint' | 'Compliment' | 'Suggestion';
  content: string;
  referenceId?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface NPSSurvey {
  id: string;
  tenantId: string;
  score: number; // 0-10
  triggerType: 'Monthly' | 'PostCheckOut' | 'PostMaintenance';
  comment: string;
  scoreDate: string;
}

export interface TenantSummary extends Tenant {
  hasActiveContract: boolean;
  isRepresentative?: boolean;
}

export interface ContactGroup {
  id: string;
  name: string;
  memberCount: number;
  description?: string;
}

export * from './TenantBalance';
