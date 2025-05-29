'use client';

import StatCard from './StatCard';
import DataTable from './DataTable';
import { CoverageItem, EventItem, OutreachItem } from '@/types';
import Link from 'next/link';

type DashboardProps = {
  coverageItems: CoverageItem[];
  outreachItems: OutreachItem[];
  eventItems: EventItem[];
  lastUpdated?: string;
};

export default function Dashboard({
  coverageItems,
  outreachItems,
  eventItems,
  lastUpdated
}: DashboardProps) {
  // Calculate total reach
  const totalReach = coverageItems.reduce((sum, item) => {
    const reach = typeof item.reach === 'string' ? 
      parseInt(item.reach.replace(/,/g, '') || '0') : 
      item.reach;
    return sum + reach;
  }, 0);
  
  // Calculate pending outreach
  const pendingOutreach = outreachItems.filter(item => item.status === 'pending').length;
  
  // Get upcoming events
  const upcomingEvents = eventItems.filter(item => 
    item.status === 'upcoming' || item.status === 'confirmed'
  ).length;
  
  // Recent coverage for table
  const recentCoverage = [...coverageItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
    
  const coverageColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
    },
    {
      header: 'Outlet',
      accessorKey: 'outlet',
    },
    {
      header: 'Title',
      accessorKey: 'title',
      cell: (row: CoverageItem) => (
        <a 
          href={row.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {row.title}
        </a>
      ),
    },
    {
      header: 'Reach',
      accessorKey: 'reach',
      cell: (row: CoverageItem) => {
        const reach = typeof row.reach === 'string' ? 
          parseInt(row.reach.replace(/,/g, '') || '0') : 
          row.reach;
        return reach.toLocaleString();
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Media Reach"
          value={totalReach.toLocaleString()}
          description="Combined audience reach across all media coverage"
          icon={<span className="text-xl">📈</span>}
        />
        <StatCard
          title="Pending Outreach"
          value={pendingOutreach}
          description="Number of pending outreach attempts"
          icon={<span className="text-xl">📨</span>}
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingEvents}
          description="Scheduled PR events in the pipeline"
          icon={<span className="text-xl">📅</span>}
        />
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Coverage</h2>
          <Link href="/coverage" className="text-blue-600 hover:underline text-sm">
            View all coverage →
          </Link>
        </div>
        
        <DataTable
          data={recentCoverage}
          columns={coverageColumns}
          emptyMessage="No recent coverage found"
        />
      </div>
      
      {lastUpdated && (
        <p className="text-gray-500 text-sm">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
} 