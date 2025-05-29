'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { EventItem } from '@/types';
import Link from 'next/link';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

export default function EventsPage() {
  const [data, setData] = useState<EventItem[]>([]);
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
      const result: WorksheetData = await response.json();
      const speakingOpps = result.sheets['Speaking Opps'] || [];
      
      // Convert to EventItem format
      const eventData = speakingOpps.map((item: Record<string, unknown>, index: number) => ({
        id: index.toString(),
        name: String(item.Event || item.Name || ''),
        date: String(item.Date || item['Date / Deadline'] || ''),
        location: String(item.Location || item.Venue || ''),
        description: String(item.Topic || item.Description || ''),
        status: String(item.Status || 'upcoming') as EventItem['status'],
        created_at: new Date().toISOString(),
      }));
      
      setData(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Events table columns
  const eventColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (row: Record<string, unknown>) => {
        const dateStr = String(row.date || '');
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        }
        return dateStr;
      },
    },
    {
      header: 'Event Name',
      accessorKey: 'name',
      cell: (row: Record<string, unknown>) => (
        <span className="font-medium text-purple-900">{String(row.name || '')}</span>
      ),
    },
    {
      header: 'Location',
      accessorKey: 'location',
      cell: (row: Record<string, unknown>) => (
        <span className="text-gray-600">{String(row.location || '')}</span>
      ),
    },
    {
      header: 'Description/Topic',
      accessorKey: 'description',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: Record<string, unknown>) => {
        const status = String(row.status || '');
        const colorClass = status.toLowerCase().includes('confirmed') ? 'bg-green-100 text-green-800' :
                          status.toLowerCase().includes('pending') ? 'bg-yellow-100 text-yellow-800' :
                          status.toLowerCase().includes('cancelled') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        );
      },
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">🎤 Loading your speaking empire...</p>
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
              <p className="font-bold text-gray-900 text-lg">Oops! Events data went missing</p>
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

  const upcomingEvents = data.filter(event => {
    const date = new Date(event.date);
    return !isNaN(date.getTime()) && date >= new Date();
  }).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              🎤 Speaking Events
            </h1>
            <p className="text-gray-700 mt-2">Your stage awaits - time to shine!</p>
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
              <span>📅 Total Events: <strong>{data.length}</strong></span>
              <span>🎯 Upcoming: <strong>{upcomingEvents.length}</strong></span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href="/dashboard" className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg">
              🏠 Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <DataTable
            data={data}
            columns={eventColumns}
            title="🎉 All Your Speaking Opportunities"
            emptyMessage="No events found - time to get on stage!"
          />
        </div>
      </main>
    </div>
  );
}