import { fetchPRData } from '@/lib/sheets';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await fetchPRData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PR data' },
      { status: 500 }
    );
  }
} 