'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { OutreachItem } from '@/lib/supabase';

// Mock data for initial development
const mockOutreachItems: OutreachItem[] = [
  {
    id: '1',
    contact_name: 'Sarah Johnson',
    outlet: 'TechCrunch',
    email: 'sarah.johnson@techcrunch.com',
    pitch_date: '2024-03-18',
    status: 'pending',
    notes: 'Sent initial pitch about new product launch',
    created_at: '2024-03-18T09:30:00Z'
  },
  {
    id: '2',
    contact_name: 'Michael Chen',
    outlet: 'The Verge',
    email: 'michael.chen@theverge.com',
    pitch_date: '2024-03-15',
    status: 'responded',
    notes: 'Interested in an interview with CEO',
    created_at: '2024-03-15T14:25:00Z'
  },
  {
    id: '3',
    contact_name: 'Jessica Lee',
    outlet: 'Business Insider',
    email: 'jessica.lee@businessinsider.com',
    pitch_date: '2024-03-10',
    status: 'scheduled',
    notes: 'Interview scheduled for March 25th',
    created_at: '2024-03-10T11:15:00Z'
  },
  {
    id: '4',
    contact_name: 'Robert Taylor',
    outlet: 'Forbes',
    email: 'robert.taylor@forbes.com',
    pitch_date: '2024-03-05',
    status: 'rejected',
    notes: 'Not interested at this time, follow up in Q3',
    created_at: '2024-03-05T16:45:00Z'
  },
  {
    id: '5',
    contact_name: 'Amanda Rodriguez',
    outlet: 'Wall Street Journal',
    email: 'amanda.rodriguez@wsj.com',
    pitch_date: '2024-03-20',
    status: 'pending',
    notes: 'Pitched for industry trends piece',
    created_at: '2024-03-20T10:20:00Z'
  }
];

export default function OutreachPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Outreach table columns
  const outreachColumns = [
    {
      header: 'Date',
      accessorKey: 'pitch_date',
    },
    {
      header: 'Contact',
      accessorKey: 'contact_name',
    },
    {
      header: 'Outlet',
      accessorKey: 'outlet',
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (row: OutreachItem) => (
        <a 
          href={`mailto:${row.email}`}
          className="text-blue-600 hover:underline"
        >
          {row.email}
        </a>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: OutreachItem) => {
        const statusClasses = {
          pending: 'bg-yellow-100 text-yellow-800',
          responded: 'bg-blue-100 text-blue-800',
          scheduled: 'bg-green-100 text-green-800',
          rejected: 'bg-gray-100 text-gray-800'
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[row.status]}`}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
    }
  ];

  // Count items by status
  const statusCounts = mockOutreachItems.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {} as Record<OutreachItem['status'], number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold mb-2">Media Outreach</h1>
          <p className="text-gray-600">
            Track your outreach efforts to journalists and media outlets.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="bg-indigo-700 text-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-2">Outreach Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-indigo-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Pending</h3>
                <p className="text-2xl font-bold">{statusCounts.pending || 0}</p>
              </div>
              <div className="bg-indigo-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Responded</h3>
                <p className="text-2xl font-bold">{statusCounts.responded || 0}</p>
              </div>
              <div className="bg-indigo-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Scheduled</h3>
                <p className="text-2xl font-bold">{statusCounts.scheduled || 0}</p>
              </div>
              <div className="bg-indigo-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Rejected</h3>
                <p className="text-2xl font-bold">{statusCounts.rejected || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            data={mockOutreachItems}
            columns={outreachColumns}
            title="All Outreach Attempts"
            emptyMessage="No outreach data found"
          />
        </div>
        
        {isClient && (
          <p className="text-gray-500 text-sm mt-8">
            Last updated: {new Date().toLocaleString()}
          </p>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-6">
          <p className="text-center text-gray-400 text-sm">
            &copy; 2024 "Oh S#!T, We're Famous" PR Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 