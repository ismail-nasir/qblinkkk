
export interface QueueMetric {
  waiting: number;
  served: number;
  avgWaitTime: number; // in minutes
  averageRating: number; // 0 to 5
}

export interface ActivityLog {
  ticket: number;
  time: string;
  action: 'call' | 'skip' | 'complete' | 'join' | 'leave' | 'late';
  details?: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target?: string;
  timestamp: string;
}

export type UserSource = 'manual' | 'qr';

export interface Visitor {
  id: string;
  ticketNumber: number;
  name: string;
  phoneNumber?: string; // Added for duplicate check
  joinTime: string; // ISO string
  status: 'waiting' | 'serving' | 'served' | 'cancelled' | 'skipped';
  isAlerting?: boolean; // New flag for sound control
  servedTime?: string; // Time when status changed to served
  servingStartTime?: string; // Time when status changed to serving
  calledAt?: string; // Timestamp when call started (grace period start)
  isLate?: boolean; // Flag if they missed the grace period
  source?: UserSource; // Track how visitor was added
  isPriority?: boolean; // New: VIP Status
  servedBy?: string; // Staff member/Counter name
  order?: number; // Added: Order for drag and drop
  rating?: number; // 1-5
  feedback?: string; // Optional text
}

export interface QueueSettings {
  soundEnabled: boolean;
  soundVolume: number; // 0.1 to 1.0
  soundType: 'beep' | 'chime' | 'alarm' | 'ding' | 'success'; 
  autoSkipMinutes?: number; 
  gracePeriodMinutes?: number; // Time to confirm presence
  themeColor?: string; // Custom Branding Color (Hex)
  enableSMS?: boolean; // Placeholder for future SMS
}

export type BusinessType = 'general' | 'restaurant' | 'clinic' | 'salon' | 'bank' | 'retail';

export interface QueueFeatures {
  vip: boolean;
  multiCounter: boolean; // aka Tables for restaurants, Stylists for salons
  anonymousMode: boolean; // Hide names on public display
  sms: boolean;
}

export interface QueueInfo {
  id: string;
  userId: string;
  name: string;
  location?: string; // Added: Multi-location support
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
  estimatedWaitTime?: number; // Manual override for wait time
  logo?: string; // Base64 or URL of the queue logo
  settings: QueueSettings;
  businessType: BusinessType; // Added
  features: QueueFeatures; // Added
  isPaused?: boolean; // New: Pause new joins
  announcement?: string; // New: Global message
}

export interface QueueData {
  queueId: string; // Added queueId
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
  joinedAt: string; // API returns ISO string
  isVerified: boolean;
  role: 'owner' | 'staff' | 'admin' | 'superadmin';
}

export interface Customer {
  id: string;
  ticketNumber: string;
  joinTime: Date;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
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
