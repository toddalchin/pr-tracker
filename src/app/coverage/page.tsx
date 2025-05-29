'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { CoverageItem } from '@/types';
import { getPublicationInfo } from '@/lib/publicationData';
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
      
      // Convert to CoverageItem format with enhanced data
      const coverageData = mediaTracker.map((item: Record<string, unknown>, index: number) => {
        const outlet = String(item.Outlet || '');
        const pubInfo = getPublicationInfo(outlet);
        
        return {
          id: index.toString(),
          outlet,
          title: String(item.Title || item.Topic || ''),
          url: String(item.URL || item.Link || ''),
          date: String(item.Date || ''),
          reach: String(item.Reach || pubInfo.estimatedReach.toLocaleString()),
          notes: String(item.Notes || ''),
          created_at: new Date().toISOString(),
          // Add enhanced fields
          estimatedReach: pubInfo.estimatedReach,
          tier: pubInfo.tier,
          category: pubInfo.category
        };
      });
      
      setData(coverageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced coverage table columns
  const coverageColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
      cell: (row: Record<string, unknown>) => {
        const date = new Date(String(row.date || ''));
        return date.toLocaleDateString();
      },
    },
    {
      header: 'Outlet',
      accessorKey: 'outlet',
      cell: (row: Record<string, unknown>) => {
        const tier = String(row.tier || '');
        const outlet = String(row.outlet || '');
        return (
          <div className="flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              tier === 'tier1' ? 'bg-green-500' : 
              tier === 'tier2' ? 'bg-yellow-500' : 'bg-gray-400'
            }`}></span>
            <span className="font-medium">{outlet}</span>
            {tier === 'tier1' && <span className="ml-1 text-yellow-500">⭐</span>}
          </div>
        );
      },
    },
    {
      header: 'Title',
      accessorKey: 'title',
      cell: (row: Record<string, unknown>) => {
        const url = String(row.url || '');
        const title = String(row.title || '');
        
        if (url) {
          return (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 hover:underline font-medium"
            >
              {title} →
            </a>
          );
        }
        return <span className="text-gray-900">{title}</span>;
      },
    },
    {
      header: 'Estimated Reach',
      accessorKey: 'estimatedReach',
      cell: (row: Record<string, unknown>) => {
        const reach = Number(row.estimatedReach || 0);
        return (
          <span className="font-semibold text-green-600">
            {(reach / 1000000).toFixed(1)}M
          </span>
        );
      },
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (row: Record<string, unknown>) => {
        const category = String(row.category || '');
        const colorClass = {
          'tech': 'bg-blue-100 text-blue-800',
          'business': 'bg-green-100 text-green-800',
          'general': 'bg-purple-100 text-purple-800',
          'trade': 'bg-orange-100 text-orange-800',
          'other': 'bg-gray-100 text-gray-800'
        }[category] || 'bg-gray-100 text-gray-800';
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {category}
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

  const totalReach = data.reduce((sum, item) => sum + (Number(item.estimatedReach) || 0), 0);
  const tier1Count = data.filter(item => item.tier === 'tier1').length;

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
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
              <span>📊 Total Reach: <strong>{(totalReach / 1000000).toFixed(1)}M</strong></span>
              <span>⭐ Tier 1 Outlets: <strong>{tier1Count}</strong></span>
              <span>📰 Total Coverage: <strong>{data.length}</strong></span>
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
            columns={coverageColumns}
            title="🎉 All Your Media Wins"
            emptyMessage="No coverage found yet - time to get famous!"
          />
        </div>
      </main>
    </div>
  );
} 