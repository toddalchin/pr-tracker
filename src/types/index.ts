// Shared type definitions for the PR Dashboard

export interface CoverageItem {
  outlet: string;
  title: string;
  date: string;
  reach: string | number;
  url: string;
  reporter?: string;
  type?: string;
}

export interface OutreachItem {
  id: string;
  outlet: string;
  reporter: string;
  date: string;
  topic: string;
  status: 'pending' | 'sent' | 'responded' | 'declined';
  type: string;
  notes?: string;
}

export interface EventItem {
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