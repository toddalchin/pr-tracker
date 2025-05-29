'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { CoverageItem } from '@/types';
import Link from 'next/link';

export default function CoveragePage() {
  const [data, setData] = useState<CoverageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Coverage table columns
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
      cell: (row: Record<string, unknown>) => (
        <a 
          href={String(row.url || '')} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {String(row.title || '')}
        </a>
      ),
    },
    {
      header: 'Reach',
      accessorKey: 'reach',
      cell: (row: Record<string, unknown>) => {
        const reach = typeof row.reach === 'string' ? 
          parseInt(String(row.reach).replace(/,/g, '') || '0') : 
          Number(row.reach || 0);
        return reach.toLocaleString();
      },
    },
    {
      header: 'Reporter',
      accessorKey: 'reporter',
    },
    {
      header: 'Type',
      accessorKey: 'type',
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading coverage data...</p>
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
              <p className="font-bold">Error loading coverage data</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Media Coverage</h1>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            data={data}
            columns={coverageColumns}
            title="All Media Coverage"
            emptyMessage="No coverage found"
          />
        </div>
      </main>
    </div>
  );
} 