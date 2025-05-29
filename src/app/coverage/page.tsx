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
      const response = await fetch('/api/sheets/all');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      const mediaTracker = result.sheets['Media Tracker'] || [];
      
      // Convert to CoverageItem format
      const coverageData = mediaTracker.map((item: Record<string, unknown>, index: number) => ({
        id: index.toString(),
        outlet: String(item.Outlet || ''),
        title: String(item.Title || item.Topic || ''),
        url: String(item.URL || item.Link || ''),
        date: String(item.Date || ''),
        reach: String(item.Reach || item.Audience || ''),
        notes: String(item.Notes || ''),
        created_at: new Date().toISOString(),
      }));
      
      setData(coverageData);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">📰 Loading your media empire...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😱</div>
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md">
              <p className="font-bold text-gray-900 text-lg">Oops! Coverage data went missing</p>
              <p className="text-gray-600 mt-2">{error}</p>
              <button 
                onClick={fetchData}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              📰 Media Coverage
            </h1>
            <p className="text-gray-700 mt-2">All the places you&apos;re making headlines!</p>
          </div>
          <Link href="/" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg">
            🏠 Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DataTable
            data={data}
            columns={coverageColumns}
            title="🎉 All Your Media Wins"
            emptyMessage="No coverage found yet - time to get famous!"
          />
        </div>
      </main>
    </div>
  );
} 