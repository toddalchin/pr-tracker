import { NextResponse } from 'next/server';
import { getGoogleSheetsData } from '@/lib/sheets';

const API_TIMEOUT = 45000; // 45 seconds

// Simple in-memory cache with request deduplication
let cache: {
  data: any;
  timestamp: number;
  ttl: number;
} | null = null;

let pendingRequest: Promise<any> | null = null;

const CACHE_TTL = 300000; // 5 minutes cache (increased from 1 minute)

export async function GET() {
  // Check cache first - use longer cache during development
  if (cache && (Date.now() - cache.timestamp) < cache.ttl) {
    console.log('Returning cached data');
    return NextResponse.json({
      ...cache.data,
      cached: true,
      cacheAge: Math.round((Date.now() - cache.timestamp) / 1000)
    });
  }

  // If there's already a pending request, wait for it instead of making a new one
  if (pendingRequest) {
    console.log('Request already in progress, waiting...');
    try {
      const result = await pendingRequest;
      return NextResponse.json(result);
    } catch (error) {
      // If the pending request failed, continue to make a new one
      pendingRequest = null;
    }
  }

  // Create the request promise
  pendingRequest = (async () => {
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
            return {
              ...cache.data,
              cached: true,
              stale: true,
              quotaExceeded: true,
              message: 'Using cached data due to API limits'
            };
          }
          
          throw new Error('Google Sheets API quota exceeded and no cached data available. Please wait 1-2 minutes and try again.');
        }
        
        throw new Error('Failed to fetch data from Google Sheets');
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
      return response;

    } finally {
      // Clear the pending request
      pendingRequest = null;
    }
  })();

  try {
    const result = await pendingRequest;
    return NextResponse.json(result);
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