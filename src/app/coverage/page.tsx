'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { getPublicationInfo, getReachMethodologyExplanation, getDataQualityStats } from '@/lib/publicationData';
import { cleanText, formatDate, formatNumber } from '@/lib/dataUtils';
import UniversalFilters from '@/components/UniversalFilters';

interface CoverageItem {
  Date: string;
  Outlet: string;
  'Article '?: string;
  Article?: string;
  Reporter: string;
  'Client (if applicable)'?: string;
  Client?: string;
  Type?: string;
  Link?: string;
  Notes?: string;
}

interface ProcessedCoverageItem extends CoverageItem {
  title: string;
  client: string;
  reachData: ReturnType<typeof getPublicationInfo>;
}

interface FilterState {
  year: string;
  quarter: string;
  tier: string;
  client: string;
}

// Line Chart Component
const LineChart = ({ data, color, label }: { 
  data: Array<{key: string, label: string, value: number}>, 
  color: string, 
  label: string 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (item.value / maxValue) * 80; // 80% of height for chart area
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-48">
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
        {/* Grid lines */}
        {[20, 40, 60, 80].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.2"/>
        ))}
        
        {/* Data line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (item.value / maxValue) * 80;
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
                className="hover:r-3 transition-all cursor-pointer"
                vectorEffect="non-scaling-stroke"
              />
              <title>{item.label}: {item.value.toLocaleString()}</title>
            </g>
          );
        })}
        
        {/* X-axis labels - increased fontSize for better readability */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          return (
            <text
              key={index}
              x={x}
              y="95"
              textAnchor="middle"
              fontSize="4.5"
              fill="#6b7280"
              className="font-medium"
            >
              {item.label.split(' ')[0]}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// Helper function to clean client names
const cleanClientName = (clientName: string): string => {
  if (!clientName || clientName.trim() === '') return 'No Client';
  
  let cleaned = clientName.trim();
  
  // Remove "N/A " prefix (with space) or "N/A" at the start
  if (cleaned.toLowerCase().startsWith('n/a ')) {
    cleaned = cleaned.substring(4).trim();
  } else if (cleaned.toLowerCase() === 'n/a') {
    return 'No Client';
  }
  
  // Capitalize first letter if it exists
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.substring(1);
  }
  
  return cleaned || 'No Client';
};

export default function CoveragePage() {
  const [mounted, setMounted] = useState(false);
  const [allCoverageItems, setAllCoverageItems] = useState<CoverageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{
    cached: boolean;
    stale: boolean;
    quotaExceeded: boolean;
    message?: string;
    cacheAge?: number;
  } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    year: 'all',
    quarter: 'all',
    tier: 'all',
    client: ''
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'methodology'>('overview');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setCacheInfo(null);
        
        const response = await fetch('/api/sheets/all');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch data');
        }
        
        // Handle cache information
        if (data.cached || data.quotaExceeded) {
          setCacheInfo({
            cached: data.cached || false,
            stale: data.stale || false,
            quotaExceeded: data.quotaExceeded || false,
            message: data.message,
            cacheAge: data.cacheAge
          });
        }

        // Extract coverage data from both sheets
        const mediaTracker2025 = data.sheets['Media Tracker (2025)'] || [];
        const mediaTracker2024 = data.sheets['Media Tracker'] || [];
        
        const allItems = [...mediaTracker2025, ...mediaTracker2024];
        
        // Filter out items without dates or outlets
        const filteredItems = allItems.filter(item => 
          item.Date && 
          item.Outlet && 
          item.Date.toString().trim() !== '' && 
          item.Outlet.toString().trim() !== ''
        );
        
        setAllCoverageItems(filteredItems);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted]);

  const processedData: ProcessedCoverageItem[] = useMemo(() => {
    if (!allCoverageItems.length) return [];
    
    return allCoverageItems.map(item => ({
      ...item,
      title: cleanText(item['Article '] || item.Article) || 'Untitled',
      client: cleanClientName(cleanText(item['Client (if applicable)'] || item.Client) || 'No Client'),
      reachData: getPublicationInfo(item.Outlet)
    }));
  }, [allCoverageItems]);

  const filteredData = useMemo(() => {
    let filtered = processedData;

    // Year filter
    if (filters.year !== 'all') {
      filtered = filtered.filter(item => {
        const itemYear = new Date(item.Date).getFullYear().toString();
        return itemYear === filters.year;
      });
    }

    // Quarter filter
    if (filters.quarter !== 'all') {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.Date);
        const month = itemDate.getMonth() + 1;
        const quarter = Math.ceil(month / 3);
        return quarter.toString() === filters.quarter.replace('Q', '');
      });
    }

    // Tier filter
    if (filters.tier !== 'all') {
      filtered = filtered.filter(item => {
        const tier = item.reachData.tier;
        if (filters.tier === 'unknown') {
          return !tier;
        }
        return tier === filters.tier;
      });
    }

    // Enhanced keyword search - searches across outlets, reporters, article titles, and clients
    if (filters.client) {
      const searchTerm = filters.client.toLowerCase();
      filtered = filtered.filter(item => {
        const outlet = (item.Outlet || '').toLowerCase();
        const reporter = cleanText(item.Reporter || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const client = (item.client || '').toLowerCase();
        
        return outlet.includes(searchTerm) || 
               reporter.includes(searchTerm) || 
               title.includes(searchTerm) || 
               client.includes(searchTerm);
      });
    }

    return filtered;
  }, [processedData, filters]);

  // Sort filtered data by date (most recent first)
  const sortedFilteredData = useMemo(() => {
    return [...filteredData].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
  }, [filteredData]);

  const analytics = useMemo(() => {
    const totalItems = filteredData.length;
    const totalReach = filteredData.reduce((sum, item) => sum + (item.reachData.estimatedReach || 0), 0);
    const avgReach = totalItems > 0 ? Math.round(totalReach / totalItems) : 0;
    
    const tierDistribution = filteredData.reduce((acc, item) => {
      const tier = item.reachData.tier;
      const tierKey = tier || 'unknown';
      acc[tierKey] = (acc[tierKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const clientDistribution = filteredData.reduce((acc, item) => {
      const client = item.client || 'No Client';
      acc[client] = (acc[client] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Monthly trends for line charts
    const monthlyData = filteredData.reduce((acc, item) => {
      const date = new Date(item.Date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          key: monthKey,
          label: monthLabel,
          count: 0,
          reach: 0,
          tier1Count: 0,
          tier2Count: 0,
          tier3Count: 0
        };
      }
      
      acc[monthKey].count++;
      acc[monthKey].reach += (item.reachData.estimatedReach || 0);
      
      if (item.reachData.tier === 'tier1') acc[monthKey].tier1Count++;
      else if (item.reachData.tier === 'tier2') acc[monthKey].tier2Count++;
      else if (item.reachData.tier === 'tier3') acc[monthKey].tier3Count++;
      
      return acc;
    }, {} as Record<string, any>);
    
    const monthlyTrends = Object.values(monthlyData)
      .sort((a: any, b: any) => a.key.localeCompare(b.key))
      .map((month: any) => ({
        ...month,
        qualityScore: month.count > 0 
          ? Math.round(((month.tier1Count * 3) + (month.tier2Count * 2) + (month.tier3Count * 1)) / (month.count * 3) * 100)
          : 0
      }));
    
    return {
      totalItems,
      totalReach,
      avgReach,
      tierDistribution,
      clientDistribution,
      monthlyTrends
    };
  }, [filteredData]);

  const qualityScore = useMemo(() => {
    const total = analytics.totalItems;
    if (total === 0) return 0;
    
    const tier1Count = analytics.tierDistribution.tier1 || 0;
    const tier2Count = analytics.tierDistribution.tier2 || 0;
    const tier3Count = analytics.tierDistribution.tier3 || 0;
    
    const weightedScore = (tier1Count * 3) + (tier2Count * 2) + (tier3Count * 1);
    const maxPossibleScore = total * 3;
    
    return Math.round((weightedScore / maxPossibleScore) * 100);
  }, [analytics]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    processedData.forEach(item => {
      years.add(new Date(item.Date).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [processedData]);

  // Check if any filters are active (for Reset button styling)
  const hasActiveFilters = useMemo(() => {
    return filters.year !== 'all' || 
           filters.quarter !== 'all' || 
           filters.tier !== 'all' || 
           filters.client.trim() !== '';
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      year: 'all',
      quarter: 'all',
      tier: 'all',
      client: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cache Warning */}
        {cacheInfo && (
          <div className={`mb-4 px-3 py-2 rounded text-sm border ${
            cacheInfo.quotaExceeded 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-700'
          }`}>
            <span className="font-medium">
              {cacheInfo.quotaExceeded ? '⚠️ Using cached data (quota exceeded)' : '📋 Using cached data'}
            </span>
            {cacheInfo.cacheAge && <span> - {Math.round(cacheInfo.cacheAge / 60)}min ago</span>}
          </div>
        )}

        {/* Filters */}
        <UniversalFilters
          filters={{
            dateRange: filters.year === 'all' ? 'all' : 'ytd',
            year: filters.year !== 'all' ? filters.year : undefined,
            quarter: filters.quarter !== 'all' ? filters.quarter as '1' | '2' | '3' | '4' : undefined,
            tier: filters.tier as 'all' | 'tier1' | 'tier2' | 'tier3',
            client: filters.client
          }}
          onFiltersChange={(newFilters) => {
            setFilters({
              year: newFilters.year || (newFilters.dateRange === 'all' ? 'all' : new Date().getFullYear().toString()),
              quarter: newFilters.quarter || 'all',
              tier: newFilters.tier || 'all',
              client: newFilters.client || ''
            });
          }}
          availableYears={['2025', '2024', ...availableYears.filter(year => !['2025', '2024'].includes(year))]}
          showTierFilter={true}
          showClientFilter={true}
        />

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-1">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'details', label: 'Coverage Details', icon: '📋' },
              { key: 'methodology', label: 'Methodology', icon: '🔬' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold text-sm rounded-md transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-700 shadow-md border border-blue-200 ring-2 ring-blue-100'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Footprint</h3>
                <p className="text-3xl font-bold text-blue-600">{analytics.totalItems}</p>
                <p className="text-sm text-gray-600">Articles</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Reach</h3>
                <p className="text-3xl font-bold text-green-600">{analytics.totalReach.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Estimated readers <span className="text-xs text-gray-400">(includes duplication)</span></p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Average Reach</h3>
                <p className="text-3xl font-bold text-purple-600">{analytics.avgReach.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Per article <span className="text-xs text-gray-400">(3% of publication readership)</span></p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Quality Score</h3>
                <p className="text-3xl font-bold text-orange-600">{qualityScore}%</p>
                <p className="text-sm text-gray-600">Based on tier distribution</p>
              </div>
            </div>

            {/* Trend Charts */}
            {analytics.monthlyTrends.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coverage Volume Trend */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Coverage Volume Over Time</h3>
                  <LineChart
                    data={analytics.monthlyTrends.map(m => ({ key: m.key, label: m.label, value: m.count }))}
                    color="#3b82f6"
                    label="Articles"
                  />
                </div>

                {/* Quality Score Trend */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Quality Score Trend</h3>
                  <LineChart
                    data={analytics.monthlyTrends.map(m => ({ key: m.key, label: m.label, value: m.qualityScore }))}
                    color="#f59e0b"
                    label="Quality %"
                  />
                </div>

                {/* Reach Trend */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Reach Over Time</h3>
                  <LineChart
                    data={analytics.monthlyTrends.map(m => ({ key: m.key, label: m.label, value: m.reach }))}
                    color="#10b981"
                    label="Reach"
                  />
                </div>

                {/* Average Reach Trend */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Average Reach Per Article</h3>
                  <LineChart
                    data={analytics.monthlyTrends.map(m => ({ 
                      key: m.key, 
                      label: m.label, 
                      value: m.count > 0 ? Math.round(m.reach / m.count) : 0 
                    }))}
                    color="#8b5cf6"
                    label="Avg Reach"
                  />
                </div>
              </div>
            )}

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tier Distribution */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Coverage by Tier</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.tierDistribution).map(([tier, count]) => {
                    const percentage = analytics.totalItems > 0 ? (count / analytics.totalItems) * 100 : 0;
                    const tierColors: Record<string, string> = {
                      tier1: 'bg-green-500',
                      tier2: 'bg-blue-500',
                      tier3: 'bg-yellow-500',
                      unknown: 'bg-gray-500'
                    };
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${tierColors[tier] || 'bg-gray-500'}`}></div>
                          <span className="text-sm font-medium capitalize">
                            {tier.startsWith('tier') ? tier.replace('tier', 'Tier ') : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${tierColors[tier] || 'bg-gray-500'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-10">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Client Distribution */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Coverage by Topic</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {Object.entries(analytics.clientDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([client, count]) => {
                      const percentage = analytics.totalItems > 0 ? (count / analytics.totalItems) * 100 : 0;
                      return (
                        <div key={client} className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate flex-1 mr-3">{client}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-10">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <p className="text-lg text-gray-800 font-medium">{sortedFilteredData.length} articles found</p>
              <p className="text-sm text-gray-600">Sorted by most recent first</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Outlet</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Article</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reach</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedFilteredData.map((item, index) => (
                    <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatDate(item.Date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{item.Outlet}</div>
                        <div className="text-sm text-gray-600">{cleanText(item.Reporter)}</div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm text-gray-900 font-medium leading-relaxed" title={item.title}>
                          {item.Link ? (
                            <a 
                              href={item.Link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {item.title}
                            </a>
                          ) : (
                            item.title
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{item.client}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                          item.reachData.tier === 'tier1' ? 'bg-green-100 text-green-800 border border-green-200' :
                          item.reachData.tier === 'tier2' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          item.reachData.tier === 'tier3' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {!item.reachData.tier ? 'Unknown' : item.reachData.tier?.replace('tier', 'Tier ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {(item.reachData.estimatedReach || 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {sortedFilteredData.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📰</div>
                  <p className="text-lg text-gray-500 font-medium">No coverage found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters to see more results</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'methodology' && (
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Reach Calculation Methodology</h3>
            
            <div className="prose max-w-none">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Data Sources</h4>
              <p className="text-gray-700 mb-4">
                Our reach calculations utilize three data sources in order of preference:
              </p>
              <ol className="list-decimal list-inside text-gray-700 mb-6 space-y-2">
                <li><strong>Verified Database:</strong> Industry-confirmed readership data with calculated article reach (1-5% of total publication audience)</li>
                <li><strong>Web Search Enhancement:</strong> Real-time search for circulation data on unknown publications, parsed and validated</li>
                <li><strong>Conservative Estimates:</strong> Pattern-based estimates for publications without available data</li>
              </ol>

              <h4 className="text-lg font-semibold text-gray-800 mb-3">Reach Calculation</h4>
              <p className="text-gray-700 mb-4">
                <strong>Average reach per article is consistently based on 3% of publication readership.</strong> 
                All reach numbers represent realistic article-level engagement, not total publication readership. 
                This 3% rate aligns with industry-standard engagement rates, adjusted by publication tier and content type.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> Total reach numbers include duplication - the same person may read multiple articles. 
                  These figures represent cumulative estimated readership across all coverage.
                </p>
              </div>

              <h4 className="text-lg font-semibold text-gray-800 mb-3">Quality Score Methodology</h4>
              <p className="text-gray-700 mb-4">
                The Quality Score is calculated based on the tier distribution of your coverage:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
                <li><strong>Tier 1 publications:</strong> 3 points (major national/industry publications)</li>
                <li><strong>Tier 2 publications:</strong> 2 points (regional/specialized publications)</li>
                <li><strong>Tier 3 publications:</strong> 1 point (local/niche publications)</li>
                <li><strong>Unknown tier:</strong> 0 points</li>
              </ul>
              <p className="text-gray-700 mb-6">
                The final quality score is expressed as a percentage, where 100% would indicate all coverage from Tier 1 publications.
              </p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Current Data Quality Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(analytics.tierDistribution).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-sm text-green-800 font-medium">Total Articles Analyzed</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{qualityScore}%</div>
                  <div className="text-sm text-blue-800 font-medium">Overall Quality Score</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {((analytics.tierDistribution.tier1 || 0) / Math.max(analytics.totalItems, 1) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-purple-800 font-medium">Tier 1 Coverage</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 