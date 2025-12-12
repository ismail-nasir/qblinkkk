
export interface QueueMetric {
  waiting: number;
  served: number;
  avgWaitTime: number; // in minutes
  averageRating: number; // 0 to 5
}

export interface ActivityLog {
  id: string;
  ticket: number;
  time: string; // Display time
  timestamp: any; // Firestore Timestamp
  action: 'call' | 'skip' | 'complete' | 'join' | 'leave' | 'late';
  details?: string;
  user: string;
}

export interface Visitor {
  id: string;
  ticketNumber: number;
  name: string;
  phoneNumber?: string;
  joinTime: string; // ISO string
  status: 'waiting' | 'serving' | 'served' | 'cancelled' | 'skipped';
  isAlerting?: boolean;
  servedTime?: string;
  servingStartTime?: string;
  calledAt?: string;
  isLate?: boolean;
  source?: 'manual' | 'qr';
  isPriority?: boolean;
  servedBy?: string;
  order?: number;
  rating?: number;
  feedback?: string;
}

export interface QueueSettings {
  soundEnabled: boolean;
  soundVolume: number;
  soundType: 'beep' | 'chime' | 'alarm' | 'ding' | 'success'; 
  autoSkipMinutes?: number; 
  gracePeriodMinutes?: number;
  themeColor?: string;
  enableSMS?: boolean;
}

export type BusinessType = 'general' | 'restaurant' | 'clinic' | 'salon' | 'bank' | 'retail';

export interface QueueFeatures {
  vip: boolean;
  multiCounter: boolean;
  anonymousMode: boolean;
  sms: boolean;
}

export interface LocationInfo {
    id: string;
    name: string;
    address?: string;
}

export interface QueueInfo {
  id: string;
  locationId: string; // Added link to location
  businessId: string; // Added link to business
  name: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
  estimatedWaitTime?: number;
  logo?: string;
  settings: QueueSettings;
  businessType: BusinessType;
  features: QueueFeatures;
  isPaused?: boolean;
  announcement?: string;
  currentTicketSequence?: number; // Internal counter
}

export interface QueueData {
  queueId: string;
  currentTicket: number;
  metrics: QueueMetric;
  recentActivity: ActivityLog[];
  visitors: Visitor[];
  lastCalledNumber: number;
}

export interface User {
  id: string;
  email: string;
  businessName: string;
  joinedAt: string;
  isVerified: boolean;
  role: 'owner' | 'staff' | 'admin' | 'superadmin';
}

export interface AdminAuditLog {
    id: string;
    adminEmail: string;
    action: string;
    target: string;
    timestamp: string;
}

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  ABOUT = 'ABOUT',
  AUTH = 'AUTH',
  CUSTOMER = 'CUSTOMER',
  DISPLAY = 'DISPLAY'
}
