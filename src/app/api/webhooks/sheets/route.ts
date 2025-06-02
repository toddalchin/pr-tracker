import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsData } from '@/lib/sheets';

// Store for invalidating cache when webhooks are received
const cacheInvalidationStore = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Google Sheets webhook payload contains information about the change
    console.log('Webhook received:', body);
    
    // Invalidate all cached data by updating timestamp
    const timestamp = Date.now();
    cacheInvalidationStore.set('lastUpdate', timestamp);
    
    // You can also be more specific about which sheet was updated
    if (body.eventType === 'SHEET') {
      console.log('Sheet update detected, invalidating cache...');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully',
      timestamp 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Verification endpoint for Google Sheets webhook setup
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook endpoint is active',
    lastUpdate: cacheInvalidationStore.get('lastUpdate') || 0
  });
} 