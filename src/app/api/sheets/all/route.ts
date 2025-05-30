import { NextResponse } from 'next/server';
import { getGoogleSheetsData } from '@/lib/sheets';

const API_TIMEOUT = 45000; // 45 seconds

export async function GET() {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
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
      return NextResponse.json(
        { error: 'Failed to fetch data from Google Sheets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sheets: data.sheets,
      sheetNames: data.sheetNames,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/sheets/all:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const status = errorMessage.includes('timed out') ? 504 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
} 