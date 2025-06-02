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

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters
    if (key === 'dateRange') {
      if (value !== 'quarter') newFilters.quarter = undefined;
      if (value !== 'custom') {
        newFilters.customStart = undefined;
        newFilters.customEnd = undefined;
      }
    }
    
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    onFiltersChange({
      dateRange: 'ytd',
      year: undefined,
      quarter: undefined,
      customStart: undefined,
      customEnd: undefined,
      tier: 'all',
      client: '',
      entryType: 'all',
      status: 'all'
    });
  };

  const hasActiveFilters = () => {
    return filters.dateRange !== 'ytd' || 
           filters.year || 
           filters.quarter || 
           filters.tier !== 'all' || 
           filters.client ||
           filters.entryType !== 'all' ||
           filters.status !== 'all';
  };

  if (!mounted) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-6">
          {/* Time Period - Horizontal Radio Buttons */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <div className="flex gap-2">
              {[
                { value: 'ytd', label: 'YTD' },
                { value: 'quarter', label: 'Quarter' },
                { value: 'month', label: 'Month' },
                { value: 'all', label: 'All' }
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    value={value}
                    checked={filters.dateRange === value}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="sr-only"
                  />
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    filters.dateRange === value
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Year Selection - Only if years available */}
          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Year:</span>
              <div className="flex gap-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="year"
                    value=""
                    checked={!filters.year}
                    onChange={() => handleFilterChange('year', undefined)}
                    className="sr-only"
                  />
                  <span className={`px-2 py-1 text-xs rounded border transition-colors ${
                    !filters.year
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}>
                    All
                  </span>
                </label>
                {availableYears.map(year => (
                  <label key={year} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="year"
                      value={year}
                      checked={filters.year === year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="sr-only"
                    />
                    <span className={`px-2 py-1 text-xs rounded border transition-colors ${
                      filters.year === year
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}>
                      {year}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quarter Selection - Only when quarter is selected */}
          {filters.dateRange === 'quarter' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Q:</span>
              <div className="flex gap-1">
                {['1', '2', '3', '4'].map(q => (
                  <label key={q} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="quarter"
                      value={q}
                      checked={filters.quarter === q}
                      onChange={(e) => handleFilterChange('quarter', e.target.value)}
                      className="sr-only"
                    />
                    <span className={`w-7 h-7 flex items-center justify-center text-xs rounded border transition-colors ${
                      filters.quarter === q
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}>
                      {q}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expand/Reset Controls */}
        <div className="flex items-center gap-3">
          {/* Additional Filters Toggle */}
          {(showTierFilter || showClientFilter || showEntryTypeFilter || showStatusFilter) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Filter className="w-4 h-4" />
              More
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters()}
            className={`flex items-center gap-1 px-3 py-1 text-sm transition-colors ${
              hasActiveFilters()
                ? 'text-gray-600 hover:text-gray-800'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (showTierFilter || showClientFilter || showEntryTypeFilter || showStatusFilter) && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Tier Filter */}
            {showTierFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Tier:</span>
                <div className="flex gap-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'tier1', label: 'T1' },
                    { value: 'tier2', label: 'T2' },
                    { value: 'tier3', label: 'T3' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="tier"
                        value={value}
                        checked={filters.tier === value}
                        onChange={(e) => handleFilterChange('tier', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`px-2 py-1 text-xs rounded border transition-colors ${
                        filters.tier === value
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Entry Type Filter */}
            {showEntryTypeFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Type:</span>
                <div className="flex gap-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'agency', label: 'Agency' },
                    { value: 'client', label: 'Client' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="entryType"
                        value={value}
                        checked={filters.entryType === value}
                        onChange={(e) => handleFilterChange('entryType', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`px-2 py-1 text-xs rounded border transition-colors ${
                        filters.entryType === value
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            {showStatusFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex gap-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'won', label: 'Won' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'upcoming', label: 'Upcoming' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={value}
                        checked={filters.status === value}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="sr-only"
                      />
                      <span className={`px-2 py-1 text-xs rounded border transition-colors ${
                        filters.status === value
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Search Filter */}
            {showClientFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Search:</span>
                <input
                  type="text"
                  value={filters.client || ''}
                  onChange={(e) => handleFilterChange('client', e.target.value)}
                  placeholder="Search..."
                  className="w-32 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Date Range - Only when custom is selected */}
      {filters.dateRange === 'custom' && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Custom Range:</span>
            <input
              type="date"
              value={filters.customStart || ''}
              onChange={(e) => handleFilterChange('customStart', e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.customEnd || ''}
              onChange={(e) => handleFilterChange('customEnd', e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
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