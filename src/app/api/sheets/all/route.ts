import { NextResponse } from 'next/server';
import { getGoogleSheetsData } from '@/lib/sheets';

export async function GET() {
  try {
    const data = await getGoogleSheetsData();
    
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 