"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncService = exports.SyncService = void 0;
const db_1 = require("../../database/db");
const index_1 = require("../../config/index");
const sheetsClient_1 = require("../googleSheets/sheetsClient");
const parsers_1 = require("../googleSheets/parsers");
class SyncService {
    isSyncing = false;
    intervalTimer = null;
    initialSyncPromise = null;
    async ensureSynced() {
        const totalRecords = db_1.db.prepare('SELECT COUNT(*) as count FROM attendance_records').get()?.count || 0;
        if (totalRecords > 0) {
            return;
        }
        if (!this.initialSyncPromise) {
            console.log('🔄 First request received on cold start: syncing live data from Google Sheets in parallel...');
            this.initialSyncPromise = this.syncAll()
                .then(res => {
                console.log('✅ Cold start parallel sync completed.');
                return res;
            })
                .catch(err => {
                console.error('❌ Cold start sync error:', err);
                this.initialSyncPromise = null;
                return { success: false, error: err.message };
            });
        }
        // Safety timeout: don't block request for more than 6s
        await Promise.race([
            this.initialSyncPromise,
            new Promise(resolve => setTimeout(resolve, 6000)),
        ]);
    }
    initAutoSync() {
        setTimeout(() => {
            this.syncAll().catch(err => console.error('Initial sync error:', err));
        }, 1000);
        const intervalMs = index_1.config.syncIntervalMinutes * 60 * 1000;
        this.intervalTimer = setInterval(() => {
            this.syncAll().catch(err => console.error('Auto sync error:', err));
        }, intervalMs);
        console.log(`⏱️ Auto-sync configured to run every ${index_1.config.syncIntervalMinutes} minutes.`);
    }
    async syncAll() {
        if (this.isSyncing) {
            return { success: false, results: [{ error: 'A sync is already in progress' }] };
        }
        this.isSyncing = true;
        try {
            const branches = db_1.db.prepare('SELECT * FROM branches WHERE active = 1').all();
            const results = await Promise.all(branches.map(async (branch) => {
                try {
                    return await this.syncBranch(branch.id);
                }
                catch (err) {
                    return { branchId: branch.id, error: err.message };
                }
            }));
            return { success: true, results };
        }
        finally {
            this.isSyncing = false;
        }
    }
    async syncBranch(branchId) {
        const startTime = Date.now();
        const branch = db_1.db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId);
        if (!branch) {
            throw new Error(`Branch with ID "${branchId}" not found.`);
        }
        const logId = `sync_${branchId}_${Date.now()}`;
        let employeesProcessed = 0;
        let attendanceRecordsProcessed = 0;
        let recordsAdded = 0;
        let recordsUpdated = 0;
        let recordsRemoved = 0;
        let status = 'SUCCESS';
        let errorMessage = null;
        try {
            const rawData = await sheetsClient_1.sheetsClient.fetchRawSheetData(branch.id, branch.spreadsheet_id);
            const parser = (0, parsers_1.getParserForBranch)(branch.id);
            const parsed = parser.parse(rawData);
            employeesProcessed = parsed.employees.length;
            attendanceRecordsProcessed = parsed.attendanceRecords.length;
            const upsertEmployee = db_1.db.prepare(`
        INSERT INTO employees (id, employee_code, name, designation, reporting_to, branch_id, work_link, active, updated_at)
        VALUES (@id, @employeeCode, @name, @designation, @reportingTo, @branchId, @workLink, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          employee_code = COALESCE(excluded.employee_code, employees.employee_code),
          designation = excluded.designation,
          reporting_to = excluded.reporting_to,
          work_link = excluded.work_link,
          active = 1,
          updated_at = CURRENT_TIMESTAMP
      `);
            const upsertAttendance = db_1.db.prepare(`
        INSERT INTO attendance_records (id, employee_id, branch_id, date, session, present, entry_time, source_spreadsheet_id, updated_at)
        VALUES (@id, @employeeId, @branchId, @date, @session, @present, @entryTime, @sourceSpreadsheetId, CURRENT_TIMESTAMP)
        ON CONFLICT(employee_id, date, session) DO UPDATE SET
          present = excluded.present,
          entry_time = excluded.entry_time,
          source_spreadsheet_id = excluded.source_spreadsheet_id,
          updated_at = CURRENT_TIMESTAMP
      `);
            const parsedEmpIds = parsed.employees.map(e => e.id);
            const syncTx = db_1.db.transaction(() => {
                if (parsedEmpIds.length > 0) {
                    const placeholders = parsedEmpIds.map(() => '?').join(',');
                    // Delete attendance records for obsolete employees of this branch
                    db_1.db.prepare(`
            DELETE FROM attendance_records 
            WHERE branch_id = ? AND employee_id NOT IN (${placeholders})
          `).run(branch.id, ...parsedEmpIds);
                    // Delete obsolete employees of this branch
                    db_1.db.prepare(`
            DELETE FROM employees 
            WHERE branch_id = ? AND id NOT IN (${placeholders})
          `).run(branch.id, ...parsedEmpIds);
                }
                for (const emp of parsed.employees) {
                    upsertEmployee.run({
                        id: emp.id,
                        employeeCode: emp.employeeCode || null,
                        name: emp.name,
                        designation: emp.designation || null,
                        reportingTo: emp.reportingTo || null,
                        branchId: emp.branchId,
                        workLink: emp.workLink || null,
                    });
                }
                for (const rec of parsed.attendanceRecords) {
                    const res = upsertAttendance.run({
                        id: rec.id,
                        employeeId: rec.employeeId,
                        branchId: rec.branchId,
                        date: rec.date,
                        session: rec.session,
                        present: rec.present ? 1 : 0,
                        entryTime: rec.entryTime || null,
                        sourceSpreadsheetId: rec.sourceSpreadsheetId,
                    });
                    if (res.changes > 0) {
                        recordsUpdated++;
                    }
                    else {
                        recordsAdded++;
                    }
                }
            });
            syncTx();
        }
        catch (err) {
            status = 'FAILED';
            errorMessage = err.message || 'Unknown error occurred during sync';
            console.error(`Sync failed for branch ${branchId}:`, err);
        }
        const durationMs = Date.now() - startTime;
        const syncLog = {
            id: logId,
            timestamp: new Date().toISOString(),
            branchId: branch.id,
            branchName: branch.name,
            status,
            durationMs,
            employeesProcessed,
            attendanceRecordsProcessed,
            recordsAdded,
            recordsUpdated,
            recordsRemoved,
            errorMessage,
        };
        db_1.db.prepare(`
      INSERT INTO sync_logs (
        id, timestamp, branch_id, status, duration_ms,
        employees_processed, attendance_records_processed,
        records_added, records_updated, records_removed, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(syncLog.id, syncLog.timestamp, syncLog.branchId, syncLog.status, syncLog.durationMs, syncLog.employeesProcessed, syncLog.attendanceRecordsProcessed, syncLog.recordsAdded, syncLog.recordsUpdated, syncLog.recordsRemoved, syncLog.errorMessage);
        return syncLog;
    }
    getSyncStatus() {
        const lastSync = db_1.db.prepare(`
      SELECT sl.*, b.name as branch_name 
      FROM sync_logs sl 
      LEFT JOIN branches b ON sl.branch_id = b.id 
      ORDER BY sl.timestamp DESC LIMIT 1
    `).get();
        const totalEmployees = db_1.db.prepare('SELECT COUNT(*) as count FROM employees WHERE active = 1').get();
        const totalRecords = db_1.db.prepare('SELECT COUNT(*) as count FROM attendance_records').get();
        const activeBranches = db_1.db.prepare('SELECT COUNT(*) as count FROM branches WHERE active = 1').get();
        return {
            isSyncing: this.isSyncing,
            lastSync: lastSync ? {
                id: lastSync.id,
                timestamp: lastSync.timestamp,
                branchId: lastSync.branch_id,
                branchName: lastSync.branch_name,
                status: lastSync.status,
                durationMs: lastSync.duration_ms,
                employeesProcessed: lastSync.employees_processed,
                attendanceRecordsProcessed: lastSync.attendance_records_processed,
                errorMessage: lastSync.error_message,
            } : null,
            totalEmployees: totalEmployees.count,
            totalRecords: totalRecords.count,
            activeBranches: activeBranches.count,
            mode: index_1.config.useMockData ? 'mock' : 'live_google_sheets',
            syncIntervalMinutes: index_1.config.syncIntervalMinutes,
        };
    }
    getSyncLogs(limit = 50) {
        const logs = db_1.db.prepare(`
      SELECT 
        sl.id, sl.timestamp, sl.branch_id as branchId, b.name as branchName,
        sl.status, sl.duration_ms as durationMs,
        sl.employees_processed as employeesProcessed,
        sl.attendance_records_processed as attendanceRecordsProcessed,
        sl.records_added as recordsAdded,
        sl.records_updated as recordsUpdated,
        sl.records_removed as recordsRemoved,
        sl.error_message as errorMessage
      FROM sync_logs sl
      LEFT JOIN branches b ON sl.branch_id = b.id
      ORDER BY sl.timestamp DESC
      LIMIT ?
    `).all(limit);
        return logs;
    }
}
exports.SyncService = SyncService;
exports.syncService = new SyncService();
