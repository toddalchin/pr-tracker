import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Parse credentials
    let credentials;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
      } catch (parseError) {
        return NextResponse.json({ 
          error: 'Invalid Google Sheets credentials format' 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Missing Google Sheets configuration' 
      }, { status: 500 });
    }

    if (!spreadsheetId) {
      return NextResponse.json({ 
        error: 'Missing Google Sheet ID' 
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

    // Get spreadsheet metadata to see all available sheets
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const sheetNames = (spreadsheetInfo.data.sheets || [])
      .map(sheet => sheet.properties?.title)
      .filter((name): name is string => Boolean(name));
    
    console.log('Available sheets:', sheetNames);

    // Fetch data from all sheets
    const allSheetsData: Record<string, any[]> = {};
    
    for (const sheetName of sheetNames) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:Z`, // Get all columns
        });

        const rows = response.data.values || [];
        
        if (rows.length > 0) {
          const headers = rows[0];
          const data = rows.slice(1).map((row, index) => {
            const rowData: Record<string, any> = { id: index.toString() };
            headers.forEach((header, colIndex) => {
              if (header && typeof header === 'string') {
                rowData[header] = row[colIndex] || '';
              }
            });
            return rowData;
          });
          
          allSheetsData[sheetName] = data;
          console.log(`Fetched ${data.length} rows from ${sheetName}`);
        } else {
          allSheetsData[sheetName] = [];
        }
      } catch (sheetError) {
        console.error(`Error fetching data from sheet ${sheetName}:`, sheetError);
        allSheetsData[sheetName] = [];
      }
    }

    return NextResponse.json({ 
      success: true,
      sheets: allSheetsData,
      sheetNames,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching all sheets data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data from Google Sheets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 