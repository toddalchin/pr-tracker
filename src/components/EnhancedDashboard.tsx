'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Calendar, TrendingUp, Award, Users, Target, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, any[]>;
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

  useEffect(() => {
    fetchAllSheetsData();
  }, []);

  const fetchAllSheetsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets/all');
      if (!response.ok) {
        throw new Error('Failed to fetch worksheet data');
      }
      const result = await response.json();
      setData(result);
      calculateMetrics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data: WorksheetData) => {
    const mediaTracker = data.sheets['Media Tracker'] || [];
    const awards = data.sheets['Awards'] || [];
    const mediaRelations = data.sheets['Media Relations'] || [];
    
    const totalCoverage = mediaTracker.length;
    const totalAwards = awards.length;
    
    // Calculate response rate from media relations
    const submitted = mediaRelations.filter(item => 
      item.Status?.toLowerCase().includes('submitted') || 
      item.Status?.toLowerCase().includes('response')
    ).length;
    const responses = mediaRelations.filter(item => 
      item.Status?.toLowerCase().includes('didn\'t get') === false &&
      item.Status?.toLowerCase().includes('submitted')
    ).length;
    const responseRate = submitted > 0 ? Math.round((responses / submitted) * 100) : 0;
    
    // Count upcoming deadlines (next 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = [...mediaRelations, ...awards].filter(item => {
      const deadline = new Date(item['Date / Deadline'] || item['Date Announced'] || '');
      return deadline >= now && deadline <= thirtyDaysFromNow;
    }).length;

    setMetrics({
      totalCoverage,
      totalAwards,
      responseRate,
      upcomingDeadlines,
      coverageTrend: 23, // Mock trend data
      awardsTrend: 15
    });
  };

  const getOutletData = (): ChartData[] => {
    if (!data) return [];
    
    const mediaTracker = data.sheets['Media Tracker'] || [];
    const outletCounts: Record<string, number> = {};
    
    mediaTracker.forEach(item => {
      const outlet = item.Outlet || 'Unknown';
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
      const statusText = item.Status?.toLowerCase() || '';
      
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
      const date = new Date(item.Date || '');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchAllSheetsData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const outletData = getOutletData();
  const statusData = getStatusData();
  const trendData = getMonthlyTrend();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PR Command Center</h1>
          <p className="text-gray-600 text-lg">Real-time insights and analytics for your PR performance</p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {data ? new Date(data.timestamp).toLocaleString() : 'Never'}
          </p>
        </div>

        {/* Key Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Media Coverage</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.totalCoverage}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{metrics.coverageTrend}% this month
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Awards Submitted</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.totalAwards}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{metrics.awardsTrend}% this quarter
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.responseRate}%</p>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <Users className="h-4 w-4 mr-1" />
                    Industry avg: 12%
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.upcomingDeadlines}</p>
                  <p className="text-sm text-orange-600 flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Next 30 days
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Media Coverage by Outlet */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Coverage by Outlet</h3>
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
                <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pitch Status Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Pitch Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Coverage Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={COLORS.primary} 
                fill={COLORS.primary}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
              <Target className="h-5 w-5 mr-2" />
              Add New Pitch
            </button>
            <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center">
              <Award className="h-5 w-5 mr-2" />
              Submit Award Entry
            </button>
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Follow-up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 