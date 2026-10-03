"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sheetsClient_1 = require("./services/googleSheets/sheetsClient");
const index_1 = require("./config/index");
async function runTest() {
    console.log('====================================================');
    console.log('🔍 Testing ARCS Google Sheets API Integration');
    console.log('====================================================');
    const authStatus = sheetsClient_1.sheetsClient.getAuthStatus();
    console.log('Auth Status:', JSON.stringify(authStatus, null, 2));
    if (index_1.config.useMockData) {
        console.log('\n⚠️ Notice: USE_MOCK_DATA is currently enabled.');
        console.log('To fetch LIVE data from Google Sheets:');
        console.log('1. Set USE_MOCK_DATA=false in server/.env');
        console.log('2. Provide either:');
        console.log('   - Drop your Google Cloud "service-account.json" into the server/ folder, OR');
        console.log('   - Add GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY in server/.env, OR');
        console.log('   - Add GOOGLE_API_KEY in server/.env');
        console.log('3. Ensure all 4 Google Sheets are shared with your Service Account email as Viewer.\n');
    }
    for (const branch of index_1.config.branches) {
        console.log(`\n----------------------------------------------------`);
        console.log(`📥 Fetching Branch: ${branch.name} (${branch.id})`);
        console.log(`   Spreadsheet ID: ${branch.spreadsheetId}`);
        try {
            const data = await sheetsClient_1.sheetsClient.fetchRawSheetData(branch.id, branch.spreadsheetId);
            console.log(`   ✅ Success! Received ${data.values.length} rows.`);
            if (data.values.length > 0) {
                console.log(`   Row 1 (Header preview):`, data.values[0]?.slice(0, 6));
                if (data.values.length > 1) {
                    console.log(`   Row 2 (Columns preview):`, data.values[1]?.slice(0, 6));
                }
            }
        }
        catch (err) {
            console.error(`   ❌ Failed:`, err.message);
        }
    }
    console.log('\n====================================================\n');
}
runTest();
