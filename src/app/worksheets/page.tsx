'use client';

import Header from '@/components/Header';
import { useWorksheetData } from '@/hooks/useWorksheetData';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Table, Database } from 'lucide-react';

export default function WorksheetsPage() {
  const { data, loading, error } = useWorksheetData();
  const [expandedSheets, setExpandedSheets] = useState<Record<string, boolean>>({});
  const [showAllRows, setShowAllRows] = useState<Record<string, boolean>>({});

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <ErrorState error="No data available" />;

  const toggleSheet = (sheetName: string) => {
    setExpandedSheets(prev => ({
      ...prev,
      [sheetName]: !prev[sheetName]
    }));
  };

  const toggleShowAllRows = (sheetName: string) => {
    setShowAllRows(prev => ({
      ...prev,
      [sheetName]: !prev[sheetName]
    }));
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {Object.entries(data.sheets).map(([sheetName, sheetData]) => {
              const isExpanded = expandedSheets[sheetName];
              const showAll = showAllRows[sheetName];
              const rowsToShow = showAll ? sheetData : sheetData.slice(0, 5);
              const columns = sheetData.length > 0 ? Object.keys(sheetData[0] || {}) : [];

              return (
                <div key={sheetName} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Sheet Header */}
                  <div 
                    className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
                    onClick={() => toggleSheet(sheetName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Table className="w-5 h-5 text-blue-600" />
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {sheetName}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {sheetData.length} rows • {columns.length} columns
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {isExpanded ? 'Click to collapse' : 'Click to expand'}
                        </span>
                        {isExpanded ? 
                          <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Sheet Content */}
                  {isExpanded && sheetData.length > 0 && (
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-200">
                              {columns.map((key, index) => (
                                <th 
                                  key={key} 
                                  className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-50 border-r border-gray-100 last:border-r-0"
                                >
                                  <div className="flex flex-col">
                                    <span className="truncate max-w-[120px]" title={key}>
                                      {key}
                                    </span>
                                    <span className="text-gray-500 font-normal capitalize text-xs mt-1">
                                      Col {index + 1}
                                    </span>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rowsToShow.map((row, rowIndex) => (
                              <tr 
                                key={rowIndex} 
                                className="hover:bg-gray-50 transition-colors"
                              >
                                {columns.map((key, cellIndex) => (
                                  <td 
                                    key={cellIndex} 
                                    className="px-4 py-3 text-sm text-gray-900 border-r border-gray-50 last:border-r-0"
                                  >
                                    <div 
                                      className="max-w-[200px] break-words"
                                      title={String(row[key] || '')}
                                    >
                                      {formatCellValue(row[key])}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Show More/Less Controls */}
                      {sheetData.length > 5 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Showing {rowsToShow.length} of {sheetData.length} rows
                          </div>
                          <button
                            onClick={() => toggleShowAllRows(sheetName)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            {showAll ? 'Show Less' : `Show All ${sheetData.length} Rows`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {isExpanded && sheetData.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="text-gray-400 text-4xl mb-2">📋</div>
                      <p className="text-gray-500">No data in this sheet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(data.sheets).length}
                </div>
                <div className="text-sm text-blue-800">Total Sheets</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(data.sheets).reduce((sum, sheet) => sum + sheet.length, 0)}
                </div>
                <div className="text-sm text-green-800">Total Rows</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown'}
                </div>
                <div className="text-sm text-purple-800">Last Updated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 