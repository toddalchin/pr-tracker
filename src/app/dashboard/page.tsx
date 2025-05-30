'use client';

import Header from '@/components/Header';
import { useWorksheetData } from '@/hooks/useWorksheetData';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { getPublicationInfo, getPublicationLogo } from '@/lib/publicationData';

export default function DashboardPage() {
  const { data, loading, error } = useWorksheetData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <ErrorState error="No data available" />;

  const coverageItems = data.sheets['Media Tracker'] || [];
  const recentCoverage = coverageItems.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Coverage</h2>
            
            <div className="space-y-4">
              {recentCoverage.map((item, index) => {
                const outlet = String(item.Outlet || 'Unknown');
                const title = String(item.Title || 'Untitled');
                const date = String(item.Date || '');
                const publicationInfo = getPublicationInfo(outlet);
                
                return (
                  <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0">
                      <img 
                        src={getPublicationLogo(outlet)} 
                        alt={outlet}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/oswf.png';
                        }}
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900">{title}</h3>
                      <p className="text-sm text-gray-600">{outlet}</p>
                      {publicationInfo && (
                        <p className="text-xs text-blue-600">
                          Est. reach: {publicationInfo.estimatedReach.toLocaleString()} 
                          ({publicationInfo.tier})
                        </p>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 