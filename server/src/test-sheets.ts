import { sheetsClient } from './services/googleSheets/sheetsClient';
import { config } from './config/index';

async function runTest() {
  console.log('====================================================');
  console.log('🔍 Testing ARCS Google Sheets API Integration');
  console.log('====================================================');

  const authStatus = sheetsClient.getAuthStatus();
  console.log('Auth Status:', JSON.stringify(authStatus, null, 2));

  if (config.useMockData) {
    console.log('\n⚠️ Notice: USE_MOCK_DATA is currently enabled.');
    console.log('To fetch LIVE data from Google Sheets:');
    console.log('1. Set USE_MOCK_DATA=false in server/.env');
    console.log('2. Provide either:');
    console.log('   - Drop your Google Cloud "service-account.json" into the server/ folder, OR');
    console.log('   - Add GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY in server/.env, OR');
    console.log('   - Add GOOGLE_API_KEY in server/.env');
    console.log('3. Ensure all 4 Google Sheets are shared with your Service Account email as Viewer.\n');
  }

  for (const branch of config.branches) {
    console.log(`\n----------------------------------------------------`);
    console.log(`📥 Fetching Branch: ${branch.name} (${branch.id})`);
    console.log(`   Spreadsheet ID: ${branch.spreadsheetId}`);
    try {
      const data = await sheetsClient.fetchRawSheetData(branch.id, branch.spreadsheetId);
      console.log(`   ✅ Success! Received ${data.values.length} rows.`);
      if (data.values.length > 0) {
        console.log(`   Row 1 (Header preview):`, data.values[0]?.slice(0, 6));
        if (data.values.length > 1) {
          console.log(`   Row 2 (Columns preview):`, data.values[1]?.slice(0, 6));
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Failed:`, err.message);
    }
  }

  console.log('\n====================================================\n');
}

runTest();
