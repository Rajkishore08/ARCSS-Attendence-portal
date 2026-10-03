import { syncEngine } from './services/googleSheets/syncEngine';
import { db } from './db';
async function run() {
    console.log('🔄 Initiating Google Sheets Live Sync with Service Account...');
    const res = await syncEngine.syncAll();
    console.log('Sync Result:', JSON.stringify(res, null, 2));
    const branches = db.prepare('SELECT * FROM branches').all();
    console.log('Branches in DB:', branches);
    const employees = db.prepare('SELECT id, name, branch_id, designation, reporting_to FROM employees').all();
    console.log(`Total Employees in DB (${employees.length}):`, employees);
    const dates = db.prepare('SELECT DISTINCT date FROM attendance_records ORDER BY date DESC LIMIT 20').all();
    console.log('Distinct Dates:', dates);
    const recentCounts = db.prepare(`
    SELECT date, 
           COUNT(*) as total,
           SUM(CASE WHEN morning_session = 1 THEN 1 ELSE 0 END) as morning_present,
           SUM(CASE WHEN evening_session = 1 THEN 1 ELSE 0 END) as evening_present
    FROM attendance_records
    GROUP BY date
    ORDER BY date DESC
    LIMIT 10
  `).all();
    console.log('Recent Date Breakdowns:', recentCounts);
}
run().catch(console.error);
