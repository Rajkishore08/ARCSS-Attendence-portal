import { sheetsClient } from './services/googleSheets/sheetsClient';
import { config } from './config/index';
async function inspectSheets() {
    for (const branch of config.branches) {
        console.log(`\n======================================================`);
        console.log(`BRANCH: ${branch.name} (${branch.id})`);
        console.log(`Spreadsheet ID: ${branch.spreadsheetId}`);
        try {
            const data = await sheetsClient.fetchRawSheetData(branch.id, branch.spreadsheetId, 'A1:Z50');
            console.log(`Total rows fetched: ${data.values.length}`);
            data.values.slice(0, 15).forEach((row, idx) => {
                console.log(`Row ${idx + 1}:`, JSON.stringify(row.filter(c => c !== undefined && c !== '')));
            });
        }
        catch (e) {
            console.error(`Error inspecting branch ${branch.id}:`, e.message);
        }
    }
}
inspectSheets();
