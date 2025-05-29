import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Check for credentials in JSON format first
    let credentials;
    let spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
        console.log('Using JSON credentials format');
      } catch (parseError) {
        console.error('Failed to parse GOOGLE_SHEETS_CREDENTIALS:', parseError);
        return NextResponse.json({ 
          error: 'Invalid Google Sheets credentials format',
          details: 'GOOGLE_SHEETS_CREDENTIALS must be valid JSON'
        }, { status: 500 });
      }
    } else if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      // Fallback to separate environment variables
      credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
      console.log('Using separate environment variables');
    } else {
      return NextResponse.json({ 
        error: 'Missing Google Sheets configuration',
        details: 'Please ensure either GOOGLE_SHEETS_CREDENTIALS (JSON) or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY are set in .env.local'
      }, { status: 500 });
    }

    if (!spreadsheetId) {
      return NextResponse.json({ 
        error: 'Missing Google Sheet ID',
        details: 'Please ensure GOOGLE_SHEET_ID is set in .env.local'
      }, { status: 500 });
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // First, try to get the spreadsheet metadata to see available sheets
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      
      const sheetNames = spreadsheetInfo.data.sheets?.map(sheet => sheet.properties?.title) || [];
      console.log('Available sheets:', sheetNames);
      
      // Use the first sheet if available, or default range
      const firstSheetName = sheetNames[0] || 'Sheet1';
      const range = `${firstSheetName}!A:Z`; // Use a wider range to capture all data
      
      console.log('Attempting to fetch from Google Sheets:', { 
        spreadsheetId: spreadsheetId.substring(0, 10) + '...', 
        range,
        hasCredentials: !!credentials.client_email
      });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        return NextResponse.json({ 
          data: [],
          message: 'No data found in the specified range',
          availableSheets: sheetNames
        });
      }

      // Assuming first row is headers
      const headers = rows[0];
      // Map the data based on actual sheet structure
      // Headers: Outlet, Reporter, Date/Deadline, Topic, Status, Type
      const data = rows.slice(1).map(row => ({
        date: row[2] || '', // Date/Deadline column
        outlet: row[0] || '', // Outlet column
        title: row[3] || '', // Topic column
        url: '', // No URL column in this sheet
        reach: row[4] || '', // Status column (repurposed as reach/status)
        reporter: row[1] || '', // Reporter column (additional field)
        type: row[5] || '', // Type column (additional field)
      }));

      console.log('Successfully fetched data:', { rowCount: data.length, headers });

      return NextResponse.json({ 
        data,
        headers,
        rowCount: data.length,
        availableSheets: sheetNames
      });
      
    } catch (rangeError) {
      console.error('Error with range or sheet access:', rangeError);
      return NextResponse.json({ 
        error: 'Failed to access Google Sheet',
        details: rangeError instanceof Error ? rangeError.message : 'Unknown range error',
        suggestion: 'Check if the sheet exists and is shared with the service account'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data from Google Sheets',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 