import { NextResponse } from 'next/server';
import { getGoogleSheetsData } from '@/lib/sheets';

const API_TIMEOUT = 45000; // 45 seconds

// Simple in-memory cache
let cache: {
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
} | null = null;

const CACHE_TTL = 60000; // 1 minute cache

export async function GET() {
  // Check cache first
  if (cache && (Date.now() - cache.timestamp) < cache.ttl) {
    console.log('Returning cached data');
    return NextResponse.json({
      ...cache.data,
      cached: true,
      cacheAge: Math.round((Date.now() - cache.timestamp) / 1000)
    });
  }

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('API request timed out'));
      }, API_TIMEOUT);
    });

    // Race between the data fetch and timeout
    const data = await Promise.race([
      getGoogleSheetsData(),
      timeoutPromise
    ]);
    
    if (!data.success) {
      // Check if it's a quota error
      const errorMessage = data.error || 'Unknown error';
      
      if (errorMessage.includes('Quota exceeded') || errorMessage.includes('rateLimitExceeded')) {
        // If we have cached data, return it even if stale
        if (cache) {
          console.log('Quota exceeded, returning stale cached data');
          return NextResponse.json({
            ...cache.data,
            cached: true,
            stale: true,
            quotaExceeded: true,
            message: 'Using cached data due to API limits'
          });
        }
        
        return NextResponse.json(
          { 
            error: 'Google Sheets API quota exceeded and no cached data available. Please wait 1-2 minutes and try again.',
            quotaError: true,
            retryAfter: 60
          },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch data from Google Sheets' },
        { status: 500 }
      );
    }

    // Cache the successful response
    const response = {
      success: true,
      sheets: data.sheets,
      sheetNames: data.sheetNames,
      timestamp: new Date().toISOString()
    };
    
    cache = {
      data: response,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    };
    
    console.log('Data fetched successfully and cached');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in /api/sheets/all:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Check if it's a quota-related error
    if (errorMessage.includes('Quota exceeded') || 
        errorMessage.includes('rateLimitExceeded') || 
        errorMessage.includes('Too Many Requests')) {
      
      // If we have cached data, return it
      if (cache) {
        console.log('Quota exceeded, returning stale cached data');
        return NextResponse.json({
          ...cache.data,
          cached: true,
          stale: true,
          quotaExceeded: true,
          message: 'Using cached data due to API limits'
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Google Sheets API quota exceeded and no cached data available. Please wait 1-2 minutes and try again.',
          quotaError: true,
          retryAfter: 60
        },
        { status: 429 }
      );
    }
    
    const status = errorMessage.includes('timed out') ? 504 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
} 