'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
}

export default function WorksheetsPage() {
  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');

  useEffect(() => {
    fetchAllWorksheets();
  }, []);

  const fetchAllWorksheets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sheets/all');
      if (!response.ok) {
        throw new Error('Failed to fetch worksheet data');
      }
      const result = await response.json();
      setWorksheetData(result);
      
      // Set first worksheet as default
      if (result.sheetNames && result.sheetNames.length > 0) {
        setSelectedWorksheet(result.sheetNames[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load worksheets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading worksheets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Worksheets</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchAllWorksheets}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!worksheetData || !worksheetData.sheetNames.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Worksheets Found</h2>
            <p className="text-gray-600">No worksheets were found in the Google Sheet.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentData = selectedWorksheet ? worksheetData.sheets[selectedWorksheet] || [] : [];
  const headers = currentData.length > 0 ? Object.keys(currentData[0]).filter(key => key !== 'id') : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Worksheets</h1>
          <p className="text-gray-600">
            View data from all {worksheetData.sheetNames.length} worksheets in your Google Sheet
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(worksheetData.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Worksheet Selector */}
        <div className="mb-6">
          <label htmlFor="worksheet-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Worksheet:
          </label>
          <select
            id="worksheet-select"
            value={selectedWorksheet}
            onChange={(e) => setSelectedWorksheet(e.target.value)}
            className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {worksheetData.sheetNames.map((sheetName) => (
              <option key={sheetName} value={sheetName}>
                {sheetName} ({worksheetData.sheets[sheetName]?.length || 0} rows)
              </option>
            ))}
          </select>
        </div>

        {/* Data Display */}
        {selectedWorksheet && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedWorksheet}
              </h2>
              <p className="text-sm text-gray-500">
                {currentData.length} {currentData.length === 1 ? 'row' : 'rows'}
              </p>
            </div>
            
            <div className="p-6">
              {currentData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header) => (
                          <th
                            key={header}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentData.slice(0, 50).map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {headers.map((header) => (
                            <td
                              key={header}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {String(row[header] || '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {currentData.length > 50 && (
                    <div className="bg-gray-50 px-4 py-3 text-center">
                      <p className="text-sm text-gray-500">
                        Showing first 50 rows of {currentData.length} total rows
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data found in this worksheet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 