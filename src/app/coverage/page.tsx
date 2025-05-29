'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { CoverageItem } from '@/lib/supabase';
import Link from 'next/link';

// Mock data for initial development
const mockCoverageItems: CoverageItem[] = [
  {
    id: '1',
    outlet: 'TechCrunch',
    title: 'New Product Launch Makes Waves',
    url: 'https://example.com/article1',
    date: '2024-03-15',
    reach: 50000,
    notes: 'Positive coverage with detailed product review',
    created_at: '2024-03-15T10:30:00Z'
  },
  {
    id: '2',
    outlet: 'The Verge',
    title: 'Industry Leaders Announce Partnership',
    url: 'https://example.com/article2',
    date: '2024-03-10',
    reach: 75000,
    notes: 'Feature article about the partnership',
    created_at: '2024-03-10T14:25:00Z'
  },
  {
    id: '3',
    outlet: 'Business Insider',
    title: 'Q1 Results Exceed Expectations',
    url: 'https://example.com/article3',
    date: '2024-02-28',
    reach: 100000,
    notes: 'Financial report coverage',
    created_at: '2024-02-28T09:15:00Z'
  },
  {
    id: '4',
    outlet: 'Forbes',
    title: 'Top 10 Startups to Watch',
    url: 'https://example.com/article4',
    date: '2024-03-20',
    reach: 120000,
    notes: 'Company featured in list article',
    created_at: '2024-03-20T16:45:00Z'
  },
  {
    id: '5',
    outlet: 'Wall Street Journal',
    title: 'Industry Trends Analysis',
    url: 'https://example.com/article5',
    date: '2024-03-05',
    reach: 200000,
    notes: 'Company mentioned as industry leader',
    created_at: '2024-03-05T11:20:00Z'
  }
];

export default function CoveragePage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Coverage table columns with full details
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
      cell: (row: CoverageItem) => row.reach.toLocaleString(),
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
    }
  ];

  // Calculate total reach
  const totalReach = mockCoverageItems.reduce((sum, item) => sum + item.reach, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Media Coverage</h1>
          <Link href="/" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold mb-2">Media Coverage</h1>
          <p className="text-gray-600">
            Track all media mentions and publications about your company.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="bg-blue-700 text-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-2">Coverage Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Total Articles</h3>
                <p className="text-2xl font-bold">{mockCoverageItems.length}</p>
              </div>
              <div className="bg-blue-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Total Reach</h3>
                <p className="text-2xl font-bold">{totalReach.toLocaleString()}</p>
              </div>
              <div className="bg-blue-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Avg. Reach Per Article</h3>
                <p className="text-2xl font-bold">
                  {(totalReach / mockCoverageItems.length).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            data={mockCoverageItems}
            columns={coverageColumns}
            title="All Media Coverage"
            emptyMessage="No coverage found"
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