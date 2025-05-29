'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface WorksheetData {
  success: boolean;
  sheets: Record<string, any[]>;
  sheetNames: string[];
  timestamp: string;
}

export default function WorksheetsPage() {
  const [data, setData] = useState<WorksheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

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
      if (result.sheetNames && result.sheetNames.length > 0) {
        setSelectedSheet(result.sheetNames[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load worksheet data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading all worksheets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error loading worksheet data</p>
              <p>{error}</p>
              <button 
                onClick={fetchAllSheetsData}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const currentSheetData = selectedSheet ? data.sheets[selectedSheet] || [] : [];
  const headers = currentSheetData.length > 0 ? Object.keys(currentSheetData[0]).filter(key => key !== 'id') : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Worksheets</h1>
            <p className="text-gray-600">View data from all {data.sheetNames.length} worksheets in your Google Sheet</p>
            <p className="text-sm text-gray-500 mt-1">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
          </div>

          {/* Worksheet Selector */}
          <div className="mb-6">
            <label htmlFor="worksheet-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Worksheet:
            </label>
            <select
              id="worksheet-select"
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {data.sheetNames.map((sheetName) => (
                <option key={sheetName} value={sheetName}>
                  {sheetName} ({data.sheets[sheetName]?.length || 0} rows)
                </option>
              ))}
            </select>
          </div>

          {/* Worksheet Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {data.sheetNames.map((sheetName) => (
              <div
                key={sheetName}
                className={`bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedSheet === sheetName 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedSheet(sheetName)}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {sheetName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {sheetName}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {data.sheets[sheetName]?.length || 0} rows
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Worksheet Data */}
          {selectedSheet && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {selectedSheet} Data
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {currentSheetData.length} rows of data
                </p>
              </div>
              
              {currentSheetData.length > 0 ? (
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
                      {currentSheetData.slice(0, 50).map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {headers.map((header) => (
                            <td
                              key={header}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {row[header] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {currentSheetData.length > 50 && (
                    <div className="bg-gray-50 px-4 py-3 text-center">
                      <p className="text-sm text-gray-500">
                        Showing first 50 rows of {currentSheetData.length} total rows
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No data found in this worksheet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 