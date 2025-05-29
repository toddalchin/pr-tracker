// Shared type definitions for the PR Dashboard

export interface CoverageItem extends Record<string, unknown> {
  id: string;
  outlet: string;
  title: string;
  url: string;
  date: string;
  reach: string;
  notes: string;
  created_at: string;
  // Enhanced fields for publication data
  estimatedReach?: number;
  tier?: string;
  category?: string;
}

export interface OutreachItem extends Record<string, unknown> {
  id: string;
  outlet: string;
  reporter: string;
  date: string;
  topic: string;
  status: 'pending' | 'sent' | 'responded' | 'declined';
  type: string;
  notes?: string;
}

export interface EventItem extends Record<string, unknown> {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  description: string;
  attendees?: number;
}

export interface Column {
  header: string;
  accessorKey: string;
  cell?: (row: Record<string, unknown>) => React.ReactNode;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
} 