import { sheetsClient } from './services/googleSheets/sheetsClient';
import { config } from './config/index';
import { db } from './database/db';
async function checkSheetDates() {
    for (const b of config.branches) {
        console.log('\n==============================');
        console.log('BRANCH:', b.name);
        const raw = await sheetsClient.fetchRawSheetData(b.id, b.spreadsheetId, 'A1:ZZ50');
        raw.values.forEach((row, r) => {
            // Find rows with date headers
            const hasDate = row.some((c) => String(c).match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|Cycle|Sep|Oct/));
            if (hasDate) {
                console.log(`Row ${r + 1}:`, row.filter((c) => c !== '' && c !== undefined).slice(0, 10));
            }
        });
    }
    console.log('\n==============================');
    console.log('CURRENT DATES IN DATABASE:');
    const distinctDates = db.prepare('SELECT DISTINCT date FROM attendance_records ORDER BY date ASC').all();
    console.log('Distinct Dates Count:', distinctDates.length);
    console.log('Distinct Dates:', distinctDates.map(d => d.date));
}
checkSheetDates();
