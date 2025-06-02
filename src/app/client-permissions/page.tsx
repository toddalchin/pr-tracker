'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Download,
  FileText,
  Building,
  Users,
  Calendar,
  ExternalLink,
  Search,
  Filter as FilterIcon
} from 'lucide-react';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

interface ClientPermission {
  client: string;
  connectionStatus: string;
  notes: string;
  clientLead: string;
  approvalProcess: string;
  mainContact: string;
  reintroduce: string;
  // Legacy fields for compatibility
  project: string;
  assetType: string;
  status: string;
  dateRequested: string;
  dateApproved: string;
  expiryDate: string;
  usage: string;
  contact: string;
  permissionType: string;
  id: number;
  [key: string]: unknown;
}

interface PermissionMetrics {
  totalPermissions: number;
  approved: number;
  pending: number;
  expired: number;
  denied: number;
  approvalRate: number;
  avgProcessingTime: number;
  upcomingExpirations: number;
  timeRangeLabel: string;
}

export default function ClientPermissionsPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<ClientPermission[]>([]);
  const [metrics, setMetrics] = useState<PermissionMetrics | null>(null);

  const processPermissionsData = useCallback((data: WorksheetData) => {
    console.log('Available sheet names:', data.sheetNames);
    console.log('Available sheets:', Object.keys(data.sheets));
    
    // Use exact sheet name from user's mapping
    const permissionsSheet = data.sheets['Client Permissions'] || [];
    
    console.log('Client Permissions sheet found:', permissionsSheet.length, 'rows');
    console.log('First row sample:', permissionsSheet[0]);
    
    if (permissionsSheet.length === 0) {
      setPermissions([]);
      return;
    }

    // Use exact field mappings provided:
    // A: Client, B: Have We Connected with their PR/comms team?, C: NOTES / UPDATES, 
    // D: Client lead, E: Approval Process, F: Main point of contact, G: reintroduce?
    const processedPermissions = permissionsSheet.map((item, index) => ({
      client: String(item.Client || item.A || ''),
      connectionStatus: String(item['Have We Connected with their PR/comms team?'] || item.B || ''),
      notes: String(item['NOTES / UPDATES'] || item.C || ''),
      clientLead: String(item['Client lead'] || item.D || ''),
      approvalProcess: String(item['Approval Process'] || item.E || ''),
      mainContact: String(item['Main point of contact'] || item.F || ''),
      reintroduce: String(item['reintroduce?'] || item.G || ''),
      // Legacy fields for compatibility - use connectionStatus as status
      project: String(item.Project || ''),
      assetType: String(item['Asset Type'] || ''),
      status: String(item.Status || item['Have We Connected with their PR/comms team?'] || item.B || ''),
      dateRequested: String(item['Date Requested'] || ''),
      dateApproved: String(item['Date Approved'] || ''),
      expiryDate: String(item['Expiry Date'] || ''),
      usage: String(item.Usage || ''),
      contact: String(item.Contact || item['Main point of contact'] || item.F || ''),
      permissionType: String(item['Permission Type'] || ''),
      id: index + 1,
      ...item
    }));
    
    setPermissions(processedPermissions);
  }, []);

  // Show all permissions since this page doesn't have filters - no useMemo needed
  const filteredPermissions = permissions;

  // Calculate metrics whenever filtered permissions change
  useEffect(() => {
    if (filteredPermissions.length === 0) {
      setMetrics({
        totalPermissions: 0,
        approved: 0,
        pending: 0,
        expired: 0,
        denied: 0,
        approvalRate: 0,
        avgProcessingTime: 0,
        upcomingExpirations: 0,
        timeRangeLabel: getTimeRangeLabel()
      });
      return;
    }

    const approved = filteredPermissions.filter(p => {
      const status = p.status.toLowerCase();
      return status.includes('approved') || status.includes('granted') || status.includes('yes');
    }).length;

    const pending = filteredPermissions.filter(p => {
      const status = p.status.toLowerCase();
      return status.includes('pending') || status.includes('review') || status.includes('waiting');
    }).length;

    const denied = filteredPermissions.filter(p => {
      const status = p.status.toLowerCase();
      return status.includes('denied') || status.includes('rejected') || status.includes('no');
    }).length;

    // Check for expired permissions
    const now = new Date();
    const expired = filteredPermissions.filter(p => {
      if (!p.expiryDate) return false;
      const expiryDate = new Date(p.expiryDate);
      return !isNaN(expiryDate.getTime()) && expiryDate < now;
    }).length;

    // Check for upcoming expirations (next 30 days)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingExpirations = filteredPermissions.filter(p => {
      if (!p.expiryDate) return false;
      const expiryDate = new Date(p.expiryDate);
      return !isNaN(expiryDate.getTime()) && expiryDate >= now && expiryDate <= thirtyDaysFromNow;
    }).length;

    // Calculate approval rate
    const totalProcessed = approved + denied;
    const approvalRate = totalProcessed > 0 ? Math.round((approved / totalProcessed) * 100) : 0;

    // Calculate average processing time (for approved permissions)
    const approvedWithDates = filteredPermissions.filter(p => 
      p.dateRequested && p.dateApproved && 
      (p.status.toLowerCase().includes('approved') || p.status.toLowerCase().includes('granted'))
    );
    
    let avgProcessingTime = 0;
    if (approvedWithDates.length > 0) {
      const totalDays = approvedWithDates.reduce((sum, p) => {
        const requested = new Date(p.dateRequested);
        const approved = new Date(p.dateApproved);
        if (!isNaN(requested.getTime()) && !isNaN(approved.getTime())) {
          const diffTime = approved.getTime() - requested.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);
      avgProcessingTime = Math.round(totalDays / approvedWithDates.length);
    }

    setMetrics({
      totalPermissions: filteredPermissions.length,
      approved,
      pending,
      expired,
      denied,
      approvalRate,
      avgProcessingTime,
      upcomingExpirations,
      timeRangeLabel: getTimeRangeLabel()
    });
  }, [filteredPermissions]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/sheets/all');
      
      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          if (errorData.quotaError) {
            throw new Error(`API quota exceeded. Please wait ${errorData.retryAfter || 60} seconds and try again.`);
          }
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      if (result.success) {
        processPermissionsData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [processPermissionsData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved') || statusLower.includes('granted') || statusLower.includes('yes')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statusLower.includes('pending') || statusLower.includes('review') || statusLower.includes('waiting')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (statusLower.includes('denied') || statusLower.includes('rejected') || statusLower.includes('no')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved') || statusLower.includes('granted') || statusLower.includes('yes')) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (statusLower.includes('pending') || statusLower.includes('review') || statusLower.includes('waiting')) {
      return <Clock className="w-4 h-4" />;
    }
    if (statusLower.includes('denied') || statusLower.includes('rejected') || statusLower.includes('no')) {
      return <XCircle className="w-4 h-4" />;
    }
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  };

  const isExpiringOrExpired = (expiryDate: string) => {
    if (!expiryDate) return { isExpiring: false, isExpired: false };
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return {
      isExpired: !isNaN(expiry.getTime()) && expiry < now,
      isExpiring: !isNaN(expiry.getTime()) && expiry >= now && expiry <= thirtyDaysFromNow
    };
  };

  const getAvailableYears = () => {
    const years = new Set<string>();
    permissions.forEach(permission => {
      const primaryDate = permission.dateRequested || permission.dateApproved;
      if (primaryDate) {
        const date = new Date(primaryDate);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear().toString());
        }
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  };

  const getTimeRangeLabel = () => {
    return `${new Date().getFullYear()} YTD`;
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!metrics) return <ErrorState message="No permission data available" onRetry={fetchData} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Client Permissions
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalPermissions}</p>
                <p className="text-xs text-gray-500">{metrics.timeRangeLabel}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{metrics.approved}</p>
                <p className="text-xs text-gray-500">{metrics.approvalRate}% approval rate</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.pending}</p>
                <p className="text-xs text-gray-500">Awaiting approval</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.upcomingExpirations}</p>
                <p className="text-xs text-gray-500">Next 30 days</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.avgProcessingTime}</p>
                <p className="text-xs text-gray-500">Days to approval</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Denied</p>
                <p className="text-2xl font-bold text-red-600">{metrics.denied}</p>
                <p className="text-xs text-gray-500">Permission denied</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{metrics.expired}</p>
                <p className="text-xs text-gray-500">Past expiry date</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Permissions List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredPermissions.length} requests
              </h2>
              <div className="text-sm text-gray-500">
                {metrics.timeRangeLabel}
              </div>
            </div>
          </div>
          
          {filteredPermissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client / Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connection Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approval Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPermissions.map((permission) => {
                    return (
                      <tr key={permission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {String(permission.client || 'Unknown Client')}
                            </div>
                            {permission.mainContact && (
                              <div className="text-xs text-gray-500">Contact: {String(permission.mainContact)}</div>
                            )}
                            {permission.clientLead && (
                              <div className="text-xs text-gray-400">Lead: {String(permission.clientLead)}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(String(permission.connectionStatus || ''))}`}>
                            {getStatusIcon(String(permission.connectionStatus || ''))}
                            <span className="ml-2">{String(permission.connectionStatus || 'Unknown')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{String(permission.clientLead || '-')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {String(permission.approvalProcess || 'Not specified')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {String(permission.notes || 'No notes available')}
                          </div>
                          {permission.reintroduce && String(permission.reintroduce) !== 'No' && (
                            <div className="text-xs text-orange-600 mt-1">
                              Reintroduce: {String(permission.reintroduce)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No permissions found</p>
              <p className="text-sm text-gray-400 mb-4">
                No permission data was found in the available sheets
              </p>
              {data && (
                <div className="bg-gray-50 rounded-lg p-4 text-left max-w-2xl mx-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Available sheets:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {data.sheetNames.map((name, index) => (
                      <div key={index} className="bg-white px-2 py-1 rounded border">
                        {name}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Looking for sheets containing: permissions, rights, approval, usage, asset, or expiry data
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 