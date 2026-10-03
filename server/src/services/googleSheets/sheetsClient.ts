import { google } from 'googleapis';
import { config } from '../../config/index';
import { generateRealisticRawSheet, SheetRowData } from './mockData';

export class GoogleSheetsClient {
  private sheetsApi: any = null;
  private authType: 'service_account' | 'api_key' | 'mock' = 'mock';

  constructor() {
    this.initClient();
  }

  public initClient() {
    if (!config.useMockData) {
      if (config.google.serviceAccountEmail && config.google.privateKey) {
        try {
          const auth = new google.auth.JWT({
            email: config.google.serviceAccountEmail,
            key: config.google.privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });
          this.sheetsApi = google.sheets({ version: 'v4', auth });
          this.authType = 'service_account';
          console.log(`✅ Google Sheets API initialized with Service Account (${config.google.serviceAccountEmail}).`);
          return;
        } catch (err: any) {
          console.warn('⚠️ Service Account initialization error:', err.message);
        }
      } else if (config.google.apiKey) {
        try {
          this.sheetsApi = google.sheets({ version: 'v4', auth: config.google.apiKey });
          this.authType = 'api_key';
          console.log('✅ Google Sheets API initialized with API Key.');
          return;
        } catch (err: any) {
          console.warn('⚠️ API Key initialization error:', err.message);
        }
      }
    }

    this.sheetsApi = null;
    this.authType = 'mock';
    console.log('ℹ️ Running in Mock Data mode (Realistic 4-Branch ARCS Data Provider).');
  }

  getAuthStatus() {
    return {
      authType: this.authType,
      isLive: this.authType !== 'mock' && !config.useMockData,
      serviceAccountEmail: config.google.serviceAccountEmail || null,
      hasApiKey: Boolean(config.google.apiKey),
      useMockData: config.useMockData,
    };
  }

  async fetchRawSheetData(branchId: string, spreadsheetId: string, range = 'A1:ZZ100'): Promise<SheetRowData> {
    if (this.sheetsApi && !config.useMockData) {
      try {
        console.log(`📡 Fetching live data from Google Sheets: [${branchId}] ${spreadsheetId}...`);

        const requestParams: any = {
          spreadsheetId,
          range,
          valueRenderOption: 'UNFORMATTED_VALUE',
          dateTimeRenderOption: 'FORMATTED_STRING',
        };

        if (this.authType === 'api_key') {
          requestParams.key = config.google.apiKey;
        }

        const response = await this.sheetsApi.spreadsheets.values.get(requestParams);
        const values = response.data.values || [];

        console.log(`✅ Received ${values.length} raw rows from Google Sheets for [${branchId}].`);

        return {
          branchId,
          spreadsheetId,
          values,
        };
      } catch (error: any) {
        console.error(`❌ Google Sheets API error for ${branchId} (${spreadsheetId}):`, error.message);
        throw new Error(
          `Google Sheets fetch error for ${branchId}: ${error.message}. ` +
          `Make sure the sheet is shared with your Service Account (${config.google.serviceAccountEmail || 'your-service-account'}) as Viewer.`
        );
      }
    }

    if (config.useMockData) {
      return generateRealisticRawSheet(branchId, spreadsheetId);
    }

    throw new Error(`Google Sheets API is not initialized. Please ensure credentials are provided in server/service-account.json or .env.`);
  }
}

export const sheetsClient = new GoogleSheetsClient();
