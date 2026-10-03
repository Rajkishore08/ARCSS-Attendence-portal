"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheetsClient = exports.GoogleSheetsClient = void 0;
const googleapis_1 = require("googleapis");
const index_1 = require("../../config/index");
const mockData_1 = require("./mockData");
class GoogleSheetsClient {
    sheetsApi = null;
    authType = 'mock';
    constructor() {
        this.initClient();
    }
    initClient() {
        if (!index_1.config.useMockData) {
            if (index_1.config.google.serviceAccountEmail && index_1.config.google.privateKey) {
                try {
                    const auth = new googleapis_1.google.auth.JWT({
                        email: index_1.config.google.serviceAccountEmail,
                        key: index_1.config.google.privateKey,
                        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
                    });
                    this.sheetsApi = googleapis_1.google.sheets({ version: 'v4', auth });
                    this.authType = 'service_account';
                    console.log(`✅ Google Sheets API initialized with Service Account (${index_1.config.google.serviceAccountEmail}).`);
                    return;
                }
                catch (err) {
                    console.warn('⚠️ Service Account initialization error:', err.message);
                }
            }
            else if (index_1.config.google.apiKey) {
                try {
                    this.sheetsApi = googleapis_1.google.sheets({ version: 'v4', auth: index_1.config.google.apiKey });
                    this.authType = 'api_key';
                    console.log('✅ Google Sheets API initialized with API Key.');
                    return;
                }
                catch (err) {
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
            isLive: this.authType !== 'mock' && !index_1.config.useMockData,
            serviceAccountEmail: index_1.config.google.serviceAccountEmail || null,
            hasApiKey: Boolean(index_1.config.google.apiKey),
            useMockData: index_1.config.useMockData,
        };
    }
    async fetchRawSheetData(branchId, spreadsheetId, range = 'A1:ZZ100') {
        if (this.sheetsApi && !index_1.config.useMockData) {
            try {
                console.log(`📡 Fetching live data from Google Sheets: [${branchId}] ${spreadsheetId}...`);
                const requestParams = {
                    spreadsheetId,
                    range,
                    valueRenderOption: 'UNFORMATTED_VALUE',
                    dateTimeRenderOption: 'FORMATTED_STRING',
                };
                if (this.authType === 'api_key') {
                    requestParams.key = index_1.config.google.apiKey;
                }
                const response = await this.sheetsApi.spreadsheets.values.get(requestParams);
                const values = response.data.values || [];
                console.log(`✅ Received ${values.length} raw rows from Google Sheets for [${branchId}].`);
                return {
                    branchId,
                    spreadsheetId,
                    values,
                };
            }
            catch (error) {
                console.error(`❌ Google Sheets API error for ${branchId} (${spreadsheetId}):`, error.message);
                throw new Error(`Google Sheets fetch error for ${branchId}: ${error.message}. ` +
                    `Make sure the sheet is shared with your Service Account (${index_1.config.google.serviceAccountEmail || 'your-service-account'}) as Viewer.`);
            }
        }
        if (index_1.config.useMockData) {
            return (0, mockData_1.generateRealisticRawSheet)(branchId, spreadsheetId);
        }
        throw new Error(`Google Sheets API is not initialized. Please ensure credentials are provided in server/service-account.json or .env.`);
    }
}
exports.GoogleSheetsClient = GoogleSheetsClient;
exports.sheetsClient = new GoogleSheetsClient();
