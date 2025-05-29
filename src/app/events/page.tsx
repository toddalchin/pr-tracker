'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { EventItem } from '@/lib/supabase';

// Mock data for initial development
const mockEventItems: EventItem[] = [
  {
    id: '1',
    name: 'Product Launch Press Conference',
    date: '2024-04-15',
    location: 'Virtual Event',
    description: 'Official launch of our new product with Q&A session',
    status: 'upcoming',
    created_at: '2024-03-01T10:30:00Z'
  },
  {
    id: '2',
    name: 'Tech Industry Summit',
    date: '2024-05-20',
    location: 'San Francisco, CA',
    description: 'Panel discussion on industry trends',
    status: 'confirmed',
    created_at: '2024-02-10T14:25:00Z'
  },
  {
    id: '3',
    name: 'Annual Media Breakfast',
    date: '2024-03-10',
    location: 'New York, NY',
    description: 'Networking event with key media contacts',
    status: 'completed',
    created_at: '2024-01-15T11:15:00Z'
  },
  {
    id: '4',
    name: 'Interview with Tech Today',
    date: '2024-04-05',
    location: 'Company Headquarters',
    description: 'CEO interview for major tech publication',
    status: 'upcoming',
    created_at: '2024-03-05T16:45:00Z'
  },
  {
    id: '5',
    name: 'Regional Partner Showcase',
    date: '2024-03-25',
    location: 'Chicago, IL',
    description: 'Presentation for regional partners and press',
    status: 'cancelled',
    created_at: '2024-02-20T10:20:00Z'
  }
];

export default function EventsPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Events table columns
  const eventColumns = [
    {
      header: 'Date',
      accessorKey: 'date',
    },
    {
      header: 'Event Name',
      accessorKey: 'name',
    },
    {
      header: 'Location',
      accessorKey: 'location',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: EventItem) => {
        const statusClasses = {
          upcoming: 'bg-blue-100 text-blue-800',
          confirmed: 'bg-green-100 text-green-800',
          completed: 'bg-gray-100 text-gray-800',
          cancelled: 'bg-red-100 text-red-800'
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[row.status]}`}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Description',
      accessorKey: 'description',
    }
  ];

  // Count items by status
  const statusCounts = mockEventItems.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {} as Record<EventItem['status'], number>);

  // Filter upcoming events
  const upcomingEvents = mockEventItems.filter(
    item => item.status === 'upcoming' || item.status === 'confirmed'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold mb-2">PR Events</h1>
          <p className="text-gray-600">
            Track and manage your PR events, media interviews, and press conferences.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="bg-purple-700 text-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold mb-2">Event Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-purple-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Upcoming</h3>
                <p className="text-2xl font-bold">{statusCounts.upcoming || 0}</p>
              </div>
              <div className="bg-purple-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Confirmed</h3>
                <p className="text-2xl font-bold">{statusCounts.confirmed || 0}</p>
              </div>
              <div className="bg-purple-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Completed</h3>
                <p className="text-2xl font-bold">{statusCounts.completed || 0}</p>
              </div>
              <div className="bg-purple-600 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Cancelled</h3>
                <p className="text-2xl font-bold">{statusCounts.cancelled || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {upcomingEvents.length > 0 && (
          <div className="mb-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Next Upcoming Event</h2>
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <h3 className="font-medium text-lg">{upcomingEvents[0].name}</h3>
                <p className="text-gray-600 mt-1">
                  <span className="font-medium">Date:</span> {upcomingEvents[0].date}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Location:</span> {upcomingEvents[0].location}
                </p>
                {upcomingEvents[0].description && (
                  <p className="text-gray-600 mt-2">{upcomingEvents[0].description}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <DataTable
            data={mockEventItems}
            columns={eventColumns}
            title="All Events"
            emptyMessage="No events found"
          />
        </div>
        
        {isClient && (
          <p className="text-gray-500 text-sm mt-8">
            Last updated: {new Date().toLocaleString()}
          </p>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-6">
          <p className="text-center text-gray-400 text-sm">
            &copy; 2024 "Oh S#!T, We're Famous" PR Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 