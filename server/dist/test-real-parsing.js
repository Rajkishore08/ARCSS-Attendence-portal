import { sheetsClient } from './services/googleSheets/sheetsClient';
import { getParserForBranch } from './services/googleSheets/parsers';
import { config } from './config/index';
async function testRealParsing() {
    for (const branch of config.branches) {
        console.log(`\n======================================================`);
        console.log(`TESTING PARSER FOR: ${branch.name} (${branch.id})`);
        const data = await sheetsClient.fetchRawSheetData(branch.id, branch.spreadsheetId, 'A1:ZZ100');
        const parser = getParserForBranch(branch.id);
        const parsed = parser.parse(data);
        console.log(`Parsed Employees Count: ${parsed.employees.length}`);
        parsed.employees.forEach(e => console.log(`  - [${e.employeeCode}] ${e.name} | Role: ${e.designation} | Reports: ${e.reportingTo} | WorkLink: ${e.workLink}`));
        console.log(`Total Attendance Records: ${parsed.attendanceRecords.length}`);
        const presentCount = parsed.attendanceRecords.filter(r => r.present).length;
        console.log(`Present Sessions: ${presentCount} / ${parsed.attendanceRecords.length}`);
    }
}
testRealParsing();
