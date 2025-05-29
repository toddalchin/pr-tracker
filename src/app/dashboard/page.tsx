'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import { getPublicationInfo, getPublicationLogo } from '@/lib/publicationData';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

interface CoverageWithInfo {
  outlet: string;
  title: string;
  url: string;
  date: string;
  estimatedReach: number;
  logo: string;
  tier: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentCoverage, setRecentCoverage] = useState<CoverageWithInfo[]>([]);

  const fetchAllSheetsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets/all');
      if (!response.ok) {
        throw new Error('Failed to fetch worksheet data');
      }
      const result = await response.json();
      setData(result);
      
      // Process recent coverage
      const mediaTracker = result.sheets['Media Tracker'] || [];
      const coverageWithInfo = mediaTracker
        .map((item: Record<string, unknown>) => {
          const outlet = String(item.Outlet || '');
          const pubInfo = getPublicationInfo(outlet);
          return {
            outlet,
            title: String(item.Title || item.Topic || ''),
            url: String(item.URL || item.Link || ''),
            date: String(item.Date || ''),
            estimatedReach: pubInfo.estimatedReach,
            logo: getPublicationLogo(outlet),
            tier: pubInfo.tier
          };
        })
        .sort((a: CoverageWithInfo, b: CoverageWithInfo) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);
      
      setRecentCoverage(coverageWithInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSheetsData();
  }, [fetchAllSheetsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 text-lg font-medium">🚀 Loading your fame dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 via-pink-100 to-orange-100">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😱</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchAllSheetsData}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalReach = recentCoverage.reduce((sum, item) => sum + item.estimatedReach, 0);
  const tier1Count = recentCoverage.filter(item => item.tier === 'tier1').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-4">
            🎉 Your Fame Dashboard 🎉
          </h1>
          <p className="text-gray-700 text-xl font-medium">Recent coverage highlights - you&apos;re crushing it!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">📰 Recent Coverage</p>
                <p className="text-3xl font-bold text-gray-900">{recentCoverage.length}</p>
                <p className="text-sm text-purple-600">Last 8 pieces</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">🌟 Estimated Reach</p>
                <p className="text-3xl font-bold text-gray-900">{(totalReach / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-green-600">Total audience</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-pink-500 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">🏆 Tier 1 Outlets</p>
                <p className="text-3xl font-bold text-gray-900">{tier1Count}</p>
                <p className="text-sm text-pink-600">Major publications</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Coverage Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🔥 Recent Coverage</h2>
            <Link 
              href="/coverage" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              View All Coverage →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentCoverage.map((item, index) => (
              <div key={index} className="group hover:shadow-lg transition-all rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  {/* Publication Logo */}
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 overflow-hidden">
                      <Image
                        src={item.logo}
                        alt={`${item.outlet} logo`}
                        width={32}
                        height={32}
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden text-xs font-bold text-gray-500">
                        {item.outlet.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.outlet}</p>
                      <p className="text-xs text-gray-500">
                        {(item.estimatedReach / 1000000).toFixed(1)}M reach
                      </p>
                    </div>
                    {item.tier === 'tier1' && (
                      <span className="text-yellow-500 text-sm">⭐</span>
                    )}
                  </div>
                  
                  {/* Article Title */}
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {item.title}
                  </h3>
                  
                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-3">
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                  
                  {/* Link */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Read Article →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/analytics" className="group">
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all transform hover:scale-105 border-l-4 border-purple-500">
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600">Analytics</h3>
                <p className="text-sm text-gray-600">Deep dive into your metrics</p>
              </div>
            </div>
          </Link>

          <Link href="/coverage" className="group">
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all transform hover:scale-105 border-l-4 border-green-500">
              <div className="text-center">
                <div className="text-4xl mb-3">📰</div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600">All Coverage</h3>
                <p className="text-sm text-gray-600">Complete media coverage list</p>
              </div>
            </div>
          </Link>

          <Link href="/outreach" className="group">
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all transform hover:scale-105 border-l-4 border-pink-500">
              <div className="text-center">
                <div className="text-4xl mb-3">📧</div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600">Outreach</h3>
                <p className="text-sm text-gray-600">PR pitches and contacts</p>
              </div>
            </div>
          </Link>

          <Link href="/events" className="group">
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all transform hover:scale-105 border-l-4 border-orange-500">
              <div className="text-center">
                <div className="text-4xl mb-3">🎤</div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600">Events</h3>
                <p className="text-sm text-gray-600">Speaking opportunities</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
} 