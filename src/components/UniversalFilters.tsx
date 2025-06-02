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

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value
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

          {/* Reset Button - Less dominating when active */}
          <div className="flex items-center">
            <button
              onClick={resetFilters}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                hasActiveFilters
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Additional Filters - Always Visible */}
        {(showTierFilter || showClientFilter || showEntryTypeFilter || showStatusFilter) && (
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
            
            {/* Tier Filter - Radio Buttons instead of dropdown */}
            {showTierFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Tier:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'tier1', label: 'Tier 1' },
                    { value: 'tier2', label: 'Tier 2' },
                    { value: 'tier3', label: 'Tier 3' }
                  ].map(tier => (
                    <button
                      key={tier.value}
                      onClick={() => handleFilterChange('tier', tier.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        filters.tier === tier.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Client Filter */}
            {showClientFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Client:</span>
                <input
                  type="text"
                  placeholder="Filter by client..."
                  value={filters.client || ''}
                  onChange={(e) => handleFilterChange('client', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                />
              </div>
            )}

            {/* Entry Type Filter */}
            {showEntryTypeFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'agency', label: 'Agency' },
                    { value: 'client', label: 'Client' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => handleFilterChange('entryType', type.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        filters.entryType === type.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            {showStatusFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'won', label: 'Won' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'upcoming', label: 'Upcoming' },
                    { value: 'closed', label: 'Closed' }
                  ].map(status => (
                    <button
                      key={status.value}
                      onClick={() => handleFilterChange('status', status.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        filters.status === status.value
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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