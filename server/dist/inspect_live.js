"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sheetsClient_1 = require("./services/googleSheets/sheetsClient");
const parsers_1 = require("./services/googleSheets/parsers");
const syncService_1 = require("./services/sync/syncService");
const db_1 = require("./database/db");
const index_1 = require("./config/index");
async function inspectLiveSheets() {
    console.log('🔍 Inspecting raw sheet values and parser output for each branch...');
    for (const branch of index_1.config.branches) {
        console.log(`\n================== BRANCH: ${branch.name} (${branch.id}) ==================`);
        const rawData = await sheetsClient_1.sheetsClient.fetchRawSheetData(branch.id, branch.spreadsheetId);
        console.log(`Total raw rows: ${rawData.values.length}`);
        // Print first 10 rows
        for (let i = 0; i < Math.min(12, rawData.values.length); i++) {
            console.log(`Row ${i + 1}:`, JSON.stringify(rawData.values[i]?.slice(0, 15)));
        }
        const parser = (0, parsers_1.getParserForBranch)(branch.id);
        const parsed = parser.parse(rawData);
        console.log(`Parsed Employees count: ${parsed.employees.length}`);
        console.log(`Parsed Employees:`, parsed.employees);
        console.log(`Parsed Attendance records count: ${parsed.attendanceRecords.length}`);
        if (parsed.attendanceRecords.length > 0) {
            console.log(`Sample attendance record 1:`, parsed.attendanceRecords[0]);
            console.log(`Sample attendance record last:`, parsed.attendanceRecords[parsed.attendanceRecords.length - 1]);
            const distinctDates = Array.from(new Set(parsed.attendanceRecords.map(r => r.date))).sort();
            console.log(`Distinct Dates in sheet (${distinctDates.length}):`, distinctDates);
        }
    }
    console.log('\n🔄 Running full syncService.syncAll()...');
    const syncRes = await syncService_1.syncService.syncAll();
    console.log('Sync result:', syncRes);
    const employees = db_1.db.prepare('SELECT id, name, branch_id FROM employees').all();
    console.log(`\nDB Total Employees: ${employees.length}`);
    const distinctDbDates = db_1.db.prepare('SELECT DISTINCT date FROM attendance_records ORDER BY date DESC').all();
    console.log('Distinct DB Dates:', distinctDbDates);
    const todayStr = new Date().toISOString().split('T')[0];
    console.log('Current system date:', todayStr);
}
inspectLiveSheets().catch(console.error);
