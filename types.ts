

export interface QueueMetric {
  waiting: number;
  served: number;
  avgWaitTime: number; // in minutes
}

export interface ActivityLog {
  ticket: number;
  time: string;
  action: 'call' | 'skip' | 'complete' | 'join' | 'leave';
  details?: string;
}

export interface AdminAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target?: string;
  timestamp: string;
}

export interface Visitor {
  id: string;
  ticketNumber: number;
  name: string;
  joinTime: string; // ISO string
  status: 'waiting' | 'serving' | 'served' | 'cancelled';
  isAlerting?: boolean; // New flag for sound control
}

export interface QueueInfo {
  id: string;
  userId: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  createdAt: string;
  estimatedWaitTime?: number; // Manual override for wait time
  logo?: string; // Base64 or URL of the queue logo
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
  joinedAt: Date;
  isVerified: boolean;
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