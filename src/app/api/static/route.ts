import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const htmlPath = path.join(process.cwd(), 'src', 'app', 'minimal.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error serving static HTML:', error);
    return new NextResponse('Error loading page', { status: 500 });
  }
} 