import { google } from 'googleapis';
import { CoverageItem, OutreachItem, EventItem } from './supabase';

// Define a type for credentials
type GoogleCredentials = {
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

// Helper to safely parse JSON
function safeJsonParse(jsonString: string): Record<string, unknown> {
  try {
    return JSON.parse(jsonString) as Record<string, unknown>;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return {};
  }
}

/**
 * Get Google Sheets client
 */
function getGoogleSheetsClient() {
  try {
    // Only parse when needed, not at module load time
    const credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS || '{}';
    const credentials: GoogleCredentials = safeJsonParse(credentialsStr);
    
    // Only create auth if credentials are valid
    if (!credentials.client_email || !credentials.private_key) {
      console.error('Invalid Google Sheets credentials');
      return null;
    }
    
    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );
    
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error creating Google Sheets client:', error);
    return null;
  }
}

/**
 * Fetch data from all Google Sheets worksheets
 */
export async function getGoogleSheetsData(): Promise<{
  success: boolean;
  sheets: Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
}> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheets || !spreadsheetId) {
      console.error('Google Sheets client or spreadsheet ID not available');
      return { success: false, sheets: {}, sheetNames: [] };
    }
    
    // Get spreadsheet metadata to see all available sheets
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const sheetNames = (spreadsheetInfo.data.sheets || [])
      .map(sheet => sheet.properties?.title)
      .filter((name): name is string => Boolean(name));
    
    console.log('Available sheets:', sheetNames);

    // Fetch data from all sheets
    const allSheetsData: Record<string, Record<string, unknown>[]> = {};
    
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
            const rowData: Record<string, unknown> = { id: index.toString() };
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

    return {
      success: true,
      sheets: allSheetsData,
      sheetNames
    };
  } catch (error) {
    console.error('Error fetching all sheets data:', error);
    return { success: false, sheets: {}, sheetNames: [] };
  }
}

/**
 * Fetch coverage data from Google Sheets
 */
export async function fetchCoverageData(): Promise<CoverageItem[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheets || !spreadsheetId) {
      console.error('Google Sheets client or spreadsheet ID not available');
      return [];
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Coverage!A2:G', // Adjust based on your sheet structure
    });

    const rows = response.data.values || [];
    
    return rows.map((row, index) => ({
      id: index.toString(),
      outlet: row[0] || '',
      title: row[1] || '',
      url: row[2] || '',
      date: row[3] || '',
      reach: parseInt(row[4] || '0', 10),
      notes: row[5] || '',
      created_at: row[6] || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching coverage data:', error);
    return [];
  }
}

/**
 * Fetch outreach data from Google Sheets
 */
export async function fetchOutreachData(): Promise<OutreachItem[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheets || !spreadsheetId) {
      console.error('Google Sheets client or spreadsheet ID not available');
      return [];
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Outreach!A2:G', // Adjust based on your sheet structure
    });

    const rows = response.data.values || [];
    
    return rows.map((row, index) => ({
      id: index.toString(),
      contact_name: row[0] || '',
      outlet: row[1] || '',
      email: row[2] || '',
      pitch_date: row[3] || '',
      status: (row[4] || 'pending') as OutreachItem['status'],
      notes: row[5] || '',
      created_at: row[6] || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching outreach data:', error);
    return [];
  }
}

/**
 * Fetch events data from Google Sheets
 */
export async function fetchEventsData(): Promise<EventItem[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheets || !spreadsheetId) {
      console.error('Google Sheets client or spreadsheet ID not available');
      return [];
    }
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Events!A2:F', // Adjust based on your sheet structure
    });

    const rows = response.data.values || [];
    
    return rows.map((row, index) => ({
      id: index.toString(),
      name: row[0] || '',
      date: row[1] || '',
      location: row[2] || '',
      description: row[3] || '',
      status: (row[4] || 'upcoming') as EventItem['status'],
      created_at: row[5] || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching events data:', error);
    return [];
  }
} 