'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterState {
  dateRange: 'ytd' | 'quarter' | 'month' | 'all' | 'custom';
  year?: string;
  quarter?: '1' | '2' | '3' | '4';
  customStart?: string;
  customEnd?: string;
  tier?: 'all' | 'tier1' | 'tier2' | 'tier3';
  client?: string;
  entryType?: 'all' | 'agency' | 'client';
  status?: 'all' | 'won' | 'submitted' | 'upcoming' | 'closed';
}

interface UniversalFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableYears?: string[];
  showTierFilter?: boolean;
  showClientFilter?: boolean;
  showEntryTypeFilter?: boolean;
  showStatusFilter?: boolean;
  compactMode?: boolean;
}

export default function UniversalFilters({
  filters,
  onFiltersChange,
  availableYears = [],
  showTierFilter = false,
  showClientFilter = false,
  showEntryTypeFilter = false,
  showStatusFilter = false,
  compactMode = false
}: UniversalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const resetFilters = () => {
    onFiltersChange({
      dateRange: 'ytd',
      year: new Date().getFullYear().toString(),
      tier: 'all',
      client: '',
      entryType: 'all',
      status: 'all'
    });
  };

  const hasActiveFilters = () => {
    return filters.dateRange !== 'ytd' || 
           filters.tier !== 'all' || 
           (filters.client && filters.client.trim() !== '') ||
           filters.entryType !== 'all' ||
           filters.status !== 'all';
  };

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3).toString() as '1' | '2' | '3' | '4';
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      {/* Mobile Toggle Header */}
      <div className="md:hidden p-4 border-b">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Filters</span>
            {hasActiveFilters() && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Filter Content */}
      <div className={`${!isExpanded ? 'hidden md:block' : ''} p-4 md:p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Date Range Filter */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Time Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilters({ 
                  dateRange: e.target.value as FilterState['dateRange'],
                  year: currentYear,
                  quarter: currentQuarter
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ytd">Year to Date</option>
                <option value="quarter">Quarter</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </select>

              {filters.dateRange !== 'all' && filters.dateRange !== 'month' && (
                <select
                  value={filters.year || currentYear}
                  onChange={(e) => updateFilters({ year: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {availableYears.length > 0 ? (
                    availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))
                  ) : (
                    [2024, 2025].map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* Quarter Selection */}
            {filters.dateRange === 'quarter' && (
              <div className="mt-2">
                <select
                  value={filters.quarter || currentQuarter}
                  onChange={(e) => updateFilters({ quarter: e.target.value as FilterState['quarter'] })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Q1 (Jan-Mar)</option>
                  <option value="2">Q2 (Apr-Jun)</option>
                  <option value="3">Q3 (Jul-Sep)</option>
                  <option value="4">Q4 (Oct-Dec)</option>
                </select>
              </div>
            )}

            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.customStart || ''}
                  onChange={(e) => updateFilters({ customStart: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={filters.customEnd || ''}
                  onChange={(e) => updateFilters({ customEnd: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End Date"
                />
              </div>
            )}
          </div>

          {/* Status Filter */}
          {showStatusFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => updateFilters({ status: e.target.value as FilterState['status'] })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="won">Approved/Won</option>
                <option value="submitted">Pending/Submitted</option>
                <option value="upcoming">Upcoming/Scheduled</option>
                <option value="closed">Closed/Draft</option>
              </select>
            </div>
          )}

          {/* Tier Filter */}
          {showTierFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publication Tier</label>
              <select
                value={filters.tier || 'all'}
                onChange={(e) => updateFilters({ tier: e.target.value as FilterState['tier'] })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Tiers</option>
                <option value="tier1">Tier 1 (Major)</option>
                <option value="tier2">Tier 2 (Regional)</option>
                <option value="tier3">Tier 3 (Niche)</option>
              </select>
            </div>
          )}

          {/* Entry Type Filter */}
          {showEntryTypeFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entry Type</label>
              <select
                value={filters.entryType || 'all'}
                onChange={(e) => updateFilters({ entryType: e.target.value as FilterState['entryType'] })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="agency">Agency Entries</option>
                <option value="client">Client Entries</option>
              </select>
            </div>
          )}

          {/* Search Filter */}
          {showClientFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.client || ''}
                onChange={(e) => updateFilters({ client: e.target.value })}
                placeholder="Search by name, client, topic..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters()}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                hasActiveFilters()
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to apply date filtering
export function applyDateFilter<T extends Record<string, unknown>>(
  data: T[],
  filters: FilterState,
  dateField: string = 'Date'
): T[] {
  if (filters.dateRange === 'all') return data;

  const now = new Date();
  const year = parseInt(filters.year || now.getFullYear().toString());

  return data.filter(item => {
    const dateValue = item[dateField];
    if (!dateValue) return false;

    const itemDate = new Date(String(dateValue));
    if (isNaN(itemDate.getTime())) return false;

    switch (filters.dateRange) {
      case 'ytd':
        return itemDate.getFullYear() === year && itemDate <= now;
      
      case 'quarter': {
        const quarter = parseInt(filters.quarter || '1');
        const quarterStart = new Date(year, (quarter - 1) * 3, 1);
        const quarterEnd = new Date(year, quarter * 3, 0);
        return itemDate >= quarterStart && itemDate <= quarterEnd;
      }
      
      case 'month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return itemDate >= monthStart && itemDate <= monthEnd;
      }
      
      case 'custom': {
        if (!filters.customStart || !filters.customEnd) return true;
        const start = new Date(filters.customStart);
        const end = new Date(filters.customEnd);
        return itemDate >= start && itemDate <= end;
      }
      
      default:
        return true;
    }
  });
} 