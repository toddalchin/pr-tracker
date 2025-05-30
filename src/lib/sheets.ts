import { google } from 'googleapis';
import { sheets_v4 } from 'googleapis';

type SheetsAPI = sheets_v4.Sheets;
type SpreadsheetResponse = sheets_v4.Schema$Spreadsheet;
type ValueRange = sheets_v4.Schema$ValueRange;

// Validate and parse Google credentials
function getGoogleCredentials() {
  const credentialsStr = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credentialsStr) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS environment variable is not set');
  }

  try {
    const credentials = JSON.parse(credentialsStr);
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid Google Sheets credentials format - missing client_email or private_key');
    }
    return credentials;
  } catch (error) {
    throw new Error(`Failed to parse Google Sheets credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Initialize Google Sheets API with validation
function initializeGoogleSheets(): SheetsAPI {
  const credentials = getGoogleCredentials();
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Add timeout wrapper for API calls
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
};

export interface PRData {
  publication: string;
  date: string;
  title: string;
  link: string;
  status: string;
  reach: string;
  notes: string;
}

export interface EventData {
  Name?: string;
  Title?: string;
  Date?: string;
  Description?: string;
  Location?: string;
}

export interface OutreachData {
  Name?: string;
  Organization?: string;
  Email?: string;
  Status?: string;
  LastContact?: string;
  Notes?: string;
}

export interface WorksheetData {
  success: boolean;
  sheets: {
    'Media Tracker'?: Record<string, unknown>[];
    'Awards'?: Record<string, unknown>[];
    'Media Relations'?: Record<string, unknown>[];
    'Events'?: EventData[];
    'Outreach'?: OutreachData[];
  } | Record<string, Record<string, unknown>[]>;
  sheetNames: string[];
  timestamp: string;
  error?: string;
}

export async function getGoogleSheetsData() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set');
    }

    // Initialize sheets API with proper error handling
    const sheets = initializeGoogleSheets();

    // Get spreadsheet metadata with timeout
    const spreadsheetInfo = await withTimeout(
      sheets.spreadsheets.get({ spreadsheetId }),
      15000 // 15 second timeout for metadata
    ) as { data: SpreadsheetResponse };

    const sheetNames = spreadsheetInfo.data.sheets?.map(sheet => 
      sheet.properties?.title || ''
    ).filter(Boolean) || [];
    
    const sheetsData: Record<string, Record<string, unknown>[]> = {};

    // Fetch data from each sheet with timeout
    for (const sheetName of sheetNames) {
      try {
        const range = `${sheetName}!A:Z`;
        const response = await withTimeout(
          sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
          }),
          20000 // 20 second timeout for each sheet
        ) as { data: ValueRange };

        const rows = response.data.values;
        if (rows && rows.length > 1) {
          const headers = rows[0] as string[];
          const dataRows = rows.slice(1) as string[][];
          
          const sheetData = dataRows.map(row => {
            const rowData: Record<string, unknown> = {};
            headers.forEach((header: string, index: number) => {
              rowData[header] = row[index] || '';
            });
            return rowData;
          });
          
          sheetsData[sheetName] = sheetData;
        }
      } catch (sheetError) {
        console.error(`Error fetching ${sheetName}:`, sheetError);
        sheetsData[sheetName] = [];
      }
    }

    return {
      success: true,
      sheets: sheetsData,
      sheetNames,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getGoogleSheetsData:', error);
    return {
      success: false,
      sheets: {},
      sheetNames: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

export async function fetchPRData(): Promise<PRData[]> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is not set');
    }
    
    const sheets = initializeGoogleSheets();
    console.log('Fetching from spreadsheet:', spreadsheetId);
    
    // First, get available sheet names
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    }) as { data: SpreadsheetResponse };
    
    const sheetNames = spreadsheetInfo.data.sheets?.map(sheet => 
      sheet.properties?.title || ''
    ).filter(Boolean) || [];
    
    console.log('Available sheets:', sheetNames);
    
    // Try multiple possible sheet names
    const possibleSheets = ['Sheet1', 'Coverage', 'PR Tracker', 'PR', sheetNames[0]].filter(Boolean);
    
    for (const sheetName of possibleSheets) {
      try {
        console.log(`Trying sheet: ${sheetName}`);
        const range = `${sheetName}!A:G`;
        
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        }) as { data: ValueRange };

        const rows = response.data.values;
        console.log(`Sheet ${sheetName} has ${rows?.length || 0} rows`);
        
        if (rows && rows.length > 1) {
          console.log('Header row:', rows[0]);
          console.log('First data row:', rows[1]);
          
          // Skip header row and map data
          return rows.slice(1).map((row: string[]) => ({
            publication: row[0] || '',
            date: row[1] || '',
            title: row[2] || '',
            link: row[3] || '',
            status: row[4] || '',
            reach: row[5] || '',
            notes: row[6] || '',
          }));
        }
      } catch (sheetError) {
        console.log(`Sheet ${sheetName} not found or error:`, (sheetError as Error).message);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching PR data:', error);
    return [];
  }
}