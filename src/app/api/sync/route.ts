import { NextResponse } from 'next/server';

// POST handler - placeholder for future sync functionality
export async function POST() {
  try {
    // TODO: Implement sync functionality when needed
    return NextResponse.json(
      { message: 'Sync functionality not yet implemented', success: true },
      { status: 200 }
    );
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