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
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">📧 Loading your outreach empire...</p>
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
              <p className="font-bold text-gray-900 text-lg">Oops! Outreach data went missing</p>
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

  const totalPitches = data.length;
  const responsesReceived = data.filter(item => 
    !String(item.status || '').toLowerCase().includes('didn\'t get')
  ).length;
  const responseRate = totalPitches > 0 ? Math.round((responsesReceived / totalPitches) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              📧 PR Outreach
            </h1>
            <p className="text-gray-700 mt-2">Your pitch game is strong - keep those emails flying!</p>
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
              <span>📊 Total Pitches: <strong>{totalPitches}</strong></span>
              <span>💬 Response Rate: <strong>{responseRate}%</strong></span>
              <span>✅ Responses: <strong>{responsesReceived}</strong></span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard" className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg">
              🏠 Dashboard
            </Link>
            <Link href="/" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg">
              📊 Analytics
            </Link>
          </div>
        </div>
        
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DataTable
            data={data}
            columns={outreachColumns}
            title="🎯 All Your PR Pitches"
            emptyMessage="No outreach found - time to start pitching!"
          />
        </div>
      </main>
    </div>
  );
} 