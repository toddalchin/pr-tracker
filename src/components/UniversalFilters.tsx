'use client';

import { useState, useEffect } from 'react';
import { Calendar, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

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
  showSearchBar?: boolean;
}

export default function UniversalFilters({
  filters,
  onFiltersChange,
  availableYears = ['2025', '2024'],
  showTierFilter = false,
  showClientFilter = false,
  showEntryTypeFilter = false,
  showStatusFilter = false,
  showSearchBar = false
}: UniversalFiltersProps) {
  const [showQuarterExpanded, setShowQuarterExpanded] = useState(false);
  const currentYear = new Date().getFullYear().toString();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3).toString() as '1' | '2' | '3' | '4';

  // Check if any filters are active (for Reset button styling)
  const hasActiveFilters = 
    filters.dateRange !== 'all' || 
    filters.year !== undefined || 
    filters.quarter !== undefined ||
    (filters.tier && filters.tier !== 'all') || 
    (filters.client && filters.client.trim() !== '') ||
    (filters.entryType && filters.entryType !== 'all') ||
    (filters.status && filters.status !== 'all');

  const resetFilters = () => {
    onFiltersChange({
      dateRange: 'all',
      year: undefined,
      quarter: undefined,
      tier: 'all',
      client: '',
      entryType: 'all',
      status: 'all'
    });
    setShowQuarterExpanded(false);
  };

  const handleDateRangeChange = (range: FilterState['dateRange']) => {
    const newFilters = { ...filters, dateRange: range };
    
    if (range === 'all') {
      newFilters.year = undefined;
      newFilters.quarter = undefined;
    } else if (range === 'ytd') {
      newFilters.year = currentYear;
      newFilters.quarter = undefined;
    } else if (range === 'quarter') {
      newFilters.year = currentYear;
      newFilters.quarter = currentQuarter;
      setShowQuarterExpanded(true);
    } else if (range === 'month') {
      newFilters.year = currentYear;
      newFilters.quarter = undefined;
    }
    
    onFiltersChange(newFilters);
  };

  const handleYearChange = (year: string) => {
    onFiltersChange({
      ...filters,
      year: year,
      dateRange: 'ytd'
    });
  };

  const handleQuarterChange = (quarter: '1' | '2' | '3' | '4') => {
    onFiltersChange({
      ...filters,
      quarter: quarter,
      dateRange: 'quarter',
      year: filters.year || currentYear
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="space-y-4">
        {/* Date Range Filters - Fixed Order: All, YTD, 2024, Quarter, Month */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Time Period:</span>
          
          {/* All - FIRST */}
          <button
            onClick={() => handleDateRangeChange('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              filters.dateRange === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>

          {/* YTD - SECOND */}
          <button
            onClick={() => handleDateRangeChange('ytd')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              filters.dateRange === 'ytd'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            YTD
          </button>

          {/* 2024 - THIRD (hardcoded as requested) */}
          <button
            onClick={() => handleYearChange('2024')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              filters.year === '2024'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            2024
          </button>

          {/* Quarter - FOURTH */}
          <div className="relative">
            <button
              onClick={() => handleDateRangeChange('quarter')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                filters.dateRange === 'quarter'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quarter
              {showQuarterExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {showQuarterExpanded && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10 p-2">
                <div className="flex gap-1">
                  {['1', '2', '3', '4'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuarterChange(q as '1' | '2' | '3' | '4')}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        filters.quarter === q
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Q{q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Month - FIFTH */}
          <button
            onClick={() => handleDateRangeChange('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              filters.dateRange === 'month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>

          {/* Reset - Separated */}
          <div className="ml-4 pl-4 border-l border-gray-200">
            <button
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                hasActiveFilters
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Always Visible Additional Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
          {/* Tier Filter */}
          {showTierFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Tier:</span>
              <select
                value={filters.tier || 'all'}
                onChange={(e) => onFiltersChange({ ...filters, tier: e.target.value as FilterState['tier'] })}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="tier1">Tier 1</option>
                <option value="tier2">Tier 2</option>
                <option value="tier3">Tier 3</option>
              </select>
            </div>
          )}

          {/* Entry Type Filter */}
          {showEntryTypeFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <select
                value={filters.entryType || 'all'}
                onChange={(e) => onFiltersChange({ ...filters, entryType: e.target.value as FilterState['entryType'] })}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="agency">Agency</option>
                <option value="client">Client</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={filters.status || 'all'}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as FilterState['status'] })}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="won">Won</option>
                <option value="submitted">Submitted</option>
                <option value="upcoming">Upcoming</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}

          {/* Search Bar */}
          {(showClientFilter || showSearchBar) && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Search:</span>
              <input
                type="text"
                placeholder="Search outlets, reporters, articles, clients..."
                value={filters.client || ''}
                onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
          )}
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