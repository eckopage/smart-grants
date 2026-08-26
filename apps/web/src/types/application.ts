import type { Grant } from './grant';

export type ApplicationStatus =
  | 'intent'
  | 'matched'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'rejected'
  | 'withdrawn';

export type PartyRole = 'user' | 'company';
export type TimelineItemStatus = 'pending' | 'done' | 'overdue';

export interface TimelineItem {
  _id: string;
  title: string;
  dueDate?: string;
  assignedTo: PartyRole;
  status: TimelineItemStatus;
  description?: string;
}

export interface ApplicationDocumentItem {
  _id: string;
  fileName: string;
  category: string;
  uploadedAt: string;
  version: number;
}

export interface ApplicationMessage {
  _id: string;
  senderId: string;
  senderRole: PartyRole;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
  readAt: string | null;
}

export interface Application {
  _id: string;
  grantId: Grant | string;
  userId: string;
  companyId: string | null;
  status: ApplicationStatus;
  timeline: TimelineItem[];
  documents: ApplicationDocumentItem[];
  messages: ApplicationMessage[];
  createdAt: string;
}

export interface RecommendedCompany {
  _id: string;
  name: string;
  description?: string;
  servicesOffered: string[];
  contactEmail: string;
  isVerified: boolean;
}
