import { db } from './database/db';
import { syncService } from './services/sync/syncService';
async function resetAndSync() {
    console.log('🧹 Purging all old/mock records from database...');
    db.exec(`
    DELETE FROM attendance_records;
    DELETE FROM employees;
    DELETE FROM sync_logs;
  `);
    console.log('✅ Database purged.');
    console.log('🔄 Performing 100% Live Google Sheets Synchronization...');
    const result = await syncService.syncAll();
    console.log('✅ Live Sync Complete:', JSON.stringify(result, null, 2));
    const empCount = db.prepare('SELECT COUNT(*) as c FROM employees').get().c;
    const attCount = db.prepare('SELECT COUNT(*) as c FROM attendance_records').get().c;
    const employees = db.prepare('SELECT employee_code, name, designation, reporting_to, branch_id, work_link FROM employees').all();
    console.log(`\n🎉 Final Database Verification:`);
    console.log(`- Real Employees in DB: ${empCount}`);
    console.log(`- Real Attendance Records in DB: ${attCount}`);
    console.log('Real Employees in DB:');
    console.table(employees);
}
resetAndSync();
