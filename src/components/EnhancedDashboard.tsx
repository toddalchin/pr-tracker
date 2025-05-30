'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, Users, Clock } from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

interface DashboardMetrics {
  totalCoverage: number;
  totalAwards: number;
  responseRate: number;
  upcomingDeadlines: number;
  coverageTrend: number;
  awardsTrend: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  secondary: '#6B7280',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

const STATUS_COLORS = {
  'Submitted': COLORS.warning,
  'Secured': COLORS.success,
  'Declined': COLORS.danger,
  'In Progress': COLORS.primary,
  'Pending': COLORS.secondary
};

export default function EnhancedDashboard() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  // Memoize data processing functions
  const processMediaTracker = useCallback((mediaTracker: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const currentMonthCoverage = mediaTracker.filter(item => {
      const date = new Date(String(item.Date || ''));
      return !isNaN(date.getTime()) && date.getMonth() === currentMonth;
    }).length;
    
    const lastMonthCoverage = mediaTracker.filter(item => {
      const date = new Date(String(item.Date || ''));
      return !isNaN(date.getTime()) && date.getMonth() === lastMonth;
    }).length;
    
    return {
      totalCoverage: mediaTracker.length,
      coverageTrend: lastMonthCoverage > 0 ? 
        Math.round(((currentMonthCoverage - lastMonthCoverage) / lastMonthCoverage) * 100) : 0
    };
  }, []);

  const processAwards = useCallback((awards: any[]) => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
    
    const currentQuarterAwards = awards.filter(item => {
      const date = new Date(String(item['Date Announced'] || item['Date / Deadline'] || ''));
      return !isNaN(date.getTime()) && Math.floor(date.getMonth() / 3) === currentQuarter;
    }).length;
    
    const lastQuarterAwards = awards.filter(item => {
      const date = new Date(String(item['Date Announced'] || item['Date / Deadline'] || ''));
      return !isNaN(date.getTime()) && Math.floor(date.getMonth() / 3) === lastQuarter;
    }).length;
    
    return {
      totalAwards: awards.length,
      awardsTrend: lastQuarterAwards > 0 ? 
        Math.round(((currentQuarterAwards - lastQuarterAwards) / lastQuarterAwards) * 100) : 0
    };
  }, []);

  const processMediaRelations = useCallback((mediaRelations: any[]) => {
    const submitted = mediaRelations.filter(item => {
      const status = String(item.Status || '').toLowerCase();
      return status.includes('submitted') || status.includes('response');
    }).length;
    
    const responses = mediaRelations.filter(item => {
      const status = String(item.Status || '').toLowerCase();
      return !status.includes('didn\'t get') && status.includes('submitted');
    }).length;
    
    return {
      responseRate: submitted > 0 ? Math.round((responses / submitted) * 100) : 0
    };
  }, []);

  const calculateMetrics = useCallback((data: WorksheetData) => {
    const mediaTracker = data.sheets['Media Tracker'] || [];
    const awards = data.sheets['Awards'] || [];
    const mediaRelations = data.sheets['Media Relations'] || [];
    
    const mediaMetrics = processMediaTracker(mediaTracker);
    const awardsMetrics = processAwards(awards);
    const relationMetrics = processMediaRelations(mediaRelations);
    
    // Calculate upcoming deadlines
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = [...mediaRelations, ...awards].filter(item => {
      const dateStr = String(item['Date / Deadline'] || item['Date Announced'] || '');
      const deadline = new Date(dateStr);
      return !isNaN(deadline.getTime()) && deadline >= now && deadline <= thirtyDaysFromNow;
    }).length;

    setMetrics({
      ...mediaMetrics,
      ...awardsMetrics,
      ...relationMetrics,
      upcomingDeadlines
    });
  }, [processMediaTracker, processAwards, processMediaRelations]);

  const fetchAllSheetsData = useCallback(async () => {
    try {
      console.log('🚀 Starting to fetch data...');
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('/api/sheets/all', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Response received:', response.status, response.ok);
      if (!response.ok) {
        throw new Error(`Failed to fetch worksheet data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 Data received');
      
      setData(result);
      calculateMetrics(result);
      console.log('✅ Data processing complete');
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      console.log('🏁 Loading state set to false');
    }
  }, [calculateMetrics]);

  // Fetch data on mount
  useEffect(() => {
    fetchAllSheetsData();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(fetchAllSheetsData, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [fetchAllSheetsData]);

  const getOutletData = (): ChartData[] => {
    if (!data) return [];
    
    const mediaTracker = data.sheets['Media Tracker'] || [];
    const outletCounts: Record<string, number> = {};
    
    mediaTracker.forEach(item => {
      const outlet = String(item.Outlet || 'Unknown');
      outletCounts[outlet] = (outletCounts[outlet] || 0) + 1;
    });
    
    return Object.entries(outletCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  const getStatusData = (): ChartData[] => {
    if (!data) return [];
    
    const mediaRelations = data.sheets['Media Relations'] || [];
    const statusCounts: Record<string, number> = {};
    
    mediaRelations.forEach(item => {
      let status = 'Other';
      const statusText = String(item.Status || '').toLowerCase();
      
      if (statusText.includes('submitted') && statusText.includes('didn\'t get')) {
        status = 'Declined';
      } else if (statusText.includes('submitted')) {
        status = 'Submitted';
      } else if (statusText.includes('scheduled')) {
        status = 'Secured';
      } else if (statusText.includes('drafting')) {
        status = 'In Progress';
      }
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || COLORS.secondary
    }));
  };

  const getMonthlyTrend = (): ChartData[] => {
    if (!data) return [];
    
    const mediaTracker = data.sheets['Media Tracker'] || [];
    const monthCounts: Record<string, number> = {};
    
    mediaTracker.forEach(item => {
      const dateStr = String(item.Date || '');
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });
    
    return Object.entries(monthCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-6);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg font-medium">🚀 Loading your fame analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isCredentialsError = error.toLowerCase().includes('credentials');
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{isCredentialsError ? '🔑' : '😱'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isCredentialsError ? 'Google Sheets Configuration Required' : 'Oops! Something went wrong'}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          {isCredentialsError ? (
            <div className="text-left bg-gray-50 p-4 rounded-lg mb-4 text-sm">
              <p className="font-medium mb-2">Required Environment Variables:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>GOOGLE_SHEETS_CREDENTIALS - Service account credentials JSON</li>
                <li>GOOGLE_SHEET_ID - ID of your Google Sheet</li>
              </ul>
            </div>
          ) : null}
          <button 
            onClick={fetchAllSheetsData}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  const outletData = getOutletData();
  const statusData = getStatusData();
  const trendData = getMonthlyTrend();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-4">
          🎉 Fame Command Center 🎉
        </h1>
        <p className="text-gray-700 text-xl font-medium">Your PR empire at a glance - because you&apos;re kind of a big deal!</p>
        <p className="text-sm text-gray-500 mt-2">
          📊 Last updated: {data ? new Date(data.timestamp).toLocaleString() : 'Never'}
        </p>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">📰 Media Coverage</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalCoverage}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {metrics.coverageTrend > 0 ? '+' : ''}{metrics.coverageTrend}% this month
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-pink-500 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">🏆 Awards Submitted</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalAwards}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {metrics.awardsTrend > 0 ? '+' : ''}{metrics.awardsTrend}% this quarter
                </p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">💬 Response Rate</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.responseRate}%</p>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  Industry avg: 12%
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-orange-500 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">⏰ Upcoming Deadlines</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.upcomingDeadlines}</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  Next 30 days
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Media Coverage by Outlet */}
        <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            📊 Coverage by Outlet
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={outletData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pitch Status Distribution */}
        <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            🎯 Pitch Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coverage Trend */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 hover:shadow-2xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          📈 Coverage Trend (Last 6 Months)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#8B5CF6" 
              fill="url(#areaGradient)"
              fillOpacity={0.6}
            />
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EC4899" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 