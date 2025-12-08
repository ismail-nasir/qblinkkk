export interface QueueMetric {
  waiting: number;
  served: number;
  avgWaitTime: number; // in minutes
}

export interface ActivityLog {
  ticket: number;
  time: string;
  action: 'call' | 'skip' | 'complete';
}

export interface QueueData {
  currentTicket: number;
  metrics: QueueMetric;
  recentActivity: ActivityLog[];
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
  AUTH = 'AUTH'
}