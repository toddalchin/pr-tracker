'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { OutreachItem } from '@/types';
import Link from 'next/link';

export default function OutreachPage() {
  const [data, setData] = useState<OutreachItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets/all');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      const mediaRelations = result.sheets['Media Relations'] || [];
      
      // Convert to OutreachItem format
      const outreachData = mediaRelations.map((item: Record<string, unknown>, index: number) => ({
        id: index.toString(),
        contact_name: String(item.Reporter || item.Contact || ''),
        outlet: String(item.Outlet || ''),
        email: String(item.Email || ''),
        pitch_date: String(item['Date / Deadline'] || item.Date || ''),
        status: String(item.Status || 'pending') as OutreachItem['status'],
        notes: String(item.Topic || item.Notes || ''),
        created_at: new Date().toISOString(),
      }));
      
      setData(outreachData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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
      header: 'Status',
      accessorKey: 'status',
      cell: (row: Record<string, unknown>) => {
        const status = String(row.status || '');
        const colorClass = status.toLowerCase().includes('submitted') ? 'text-blue-600' :
                          status.toLowerCase().includes('scheduled') ? 'text-green-600' :
                          status.toLowerCase().includes('didn\'t get') ? 'text-red-600' :
                          'text-gray-600';
        return <span className={colorClass}>{status}</span>;
      },
    },
    {
      header: 'Topic/Notes',
      accessorKey: 'notes',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading outreach data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error loading outreach data</p>
              <p>{error}</p>
              <button 
                onClick={fetchData}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">PR Outreach</h1>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            data={data}
            columns={outreachColumns}
            title="All PR Outreach"
            emptyMessage="No outreach found"
          />
        </div>
      </main>
    </div>
  );
} 