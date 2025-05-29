import { NextResponse } from 'next/server';
import { syncAllData } from '@/lib/sync';

// POST handler to trigger data synchronization
export async function POST() {
  try {
    const result = await syncAllData();
    
    if (result.success) {
      return NextResponse.json(
        { message: 'Data synchronized successfully', ...result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Data synchronization failed', ...result },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in sync API:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

// GET handler to check sync status (for health checks)
export async function GET() {
  return NextResponse.json({ message: 'Sync API is running' });
} 