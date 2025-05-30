'use client';

import Header from '@/components/Header';
import { useWorksheetData } from '@/hooks/useWorksheetData';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';

export default function WorksheetsPage() {
  const { data, loading, error } = useWorksheetData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <ErrorState error="No data available" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">All Worksheet Data</h1>
          
          <div className="grid gap-6">
            {Object.entries(data.sheets).map(([sheetName, sheetData]) => (
              <div key={sheetName} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {sheetName} ({sheetData.length} items)
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {sheetData.length > 0 && Object.keys(sheetData[0] || {}).map((key) => (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sheetData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {String(value || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sheetData.length > 10 && (
                    <p className="text-gray-500 text-sm mt-2 text-center">
                      Showing 10 of {sheetData.length} items
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 