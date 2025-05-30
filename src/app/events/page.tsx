'use client';

import Header from '@/components/Header';
import { useWorksheetData } from '@/hooks/useWorksheetData';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

interface EventData {
  Name?: string;
  Title?: string;
  'Event '?: string;
  'Speaker '?: string;
  Date?: string;
  Description?: string;
  Location?: string;
  Status?: string;
  Submission?: string;
  Type?: string;
  [key: string]: unknown;
}

export default function EventsPage() {
  const { data, loading, error, refetch } = useWorksheetData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return <ErrorState error="No data available" onRetry={refetch} />;

  // Try multiple possible sheet names for events
  const possibleEventSheets = ['Events', 'Speaking Opps', 'Event Tracker', 'Event Planning', 'Upcoming Events'];
  let events: EventData[] = [];
  let sheetName = '';

  for (const name of possibleEventSheets) {
    if (data.sheets[name] && data.sheets[name].length > 0) {
      events = data.sheets[name] as EventData[];
      sheetName = name;
      break;
    }
  }

  // If no specific events sheet, check if any sheet has event-like data
  if (events.length === 0) {
    const allSheets = Object.entries(data.sheets);
    for (const [name, sheetData] of allSheets) {
      if (sheetData.length > 0) {
        const firstRow = sheetData[0];
        const hasEventFields = Object.keys(firstRow).some(key => 
          key.toLowerCase().includes('event') || 
          key.toLowerCase().includes('date') && 
          (key.toLowerCase().includes('name') || key.toLowerCase().includes('title'))
        );
        if (hasEventFields) {
          events = sheetData as EventData[];
          sheetName = name;
          break;
        }
      }
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isUpcoming = (dateString: string | undefined) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date >= new Date();
  };

  const upcomingEvents = events.filter(event => isUpcoming(event.Date));
  const pastEvents = events.filter(event => !isUpcoming(event.Date));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Events & Speaking Engagements
          </h1>
          <p className="text-gray-600">
            Track upcoming and past events, conferences, and speaking opportunities
          </p>
          {sheetName && (
            <p className="text-sm text-gray-500 mt-2">
              📊 Data from: {sheetName} ({events.length} events)
            </p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Past Events</p>
                <p className="text-2xl font-bold text-green-600">{pastEvents.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-purple-600">{events.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any events data in your spreadsheet.
            </p>
            <p className="text-sm text-gray-500">
              Available sheets: {data.sheetNames.join(', ')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                  <p className="text-sm text-gray-600">Events and speaking engagements on the horizon</p>
                </div>
                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {upcomingEvents.map((event, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {event['Event '] || event.Name || event.Title || 'Untitled Event'}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                            {formatDate(event.Date)}
                          </div>
                          {event.Location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-green-500" />
                              {event.Location}
                            </div>
                          )}
                          {event['Speaker '] && (
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-purple-500" />
                              Speaker: {event['Speaker ']}
                            </div>
                          )}
                          {(event.Status || event.Submission) && (
                            <div className="flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              Status: {event.Status || event.Submission || 'Unknown'}
                            </div>
                          )}
                        </div>
                        {event.Description && (
                          <p className="text-gray-700 mt-3 text-sm">{event.Description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Past Events</h2>
                  <p className="text-sm text-gray-600">Completed events and speaking engagements</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Speaker
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pastEvents.map((event, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {event['Event '] || event.Name || event.Title || 'Untitled Event'}
                            </div>
                            {event.Description && (
                              <div className="text-sm text-gray-500">{event.Description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event['Speaker '] || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(event.Date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.Location || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.Status || event.Submission || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 