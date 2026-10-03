import { db } from '../../database/db';
import { config } from '../../config/index';
import { sheetsClient } from '../googleSheets/sheetsClient';
import { getParserForBranch } from '../googleSheets/parsers';
import { SyncLog } from '../../types/index';

export class SyncService {
  private isSyncing = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private initialSyncPromise: Promise<any> | null = null;

  async ensureSynced(): Promise<void> {
    const totalRecords = (db.prepare('SELECT COUNT(*) as count FROM attendance_records').get() as any)?.count || 0;
    if (totalRecords > 0) {
      return;
    }

    if (!this.initialSyncPromise) {
      console.log('🔄 First request received on cold start: syncing live data from Google Sheets...');
      this.initialSyncPromise = this.syncAll().then(res => {
        console.log('✅ Cold start sync completed.');
        return res;
      }).catch(err => {
        console.error('❌ Cold start sync error:', err);
        this.initialSyncPromise = null;
      });
    }

    await this.initialSyncPromise;
  }

  initAutoSync() {
    setTimeout(() => {
      this.syncAll().catch(err => console.error('Initial sync error:', err));
    }, 1000);

    const intervalMs = config.syncIntervalMinutes * 60 * 1000;
    this.intervalTimer = setInterval(() => {
      this.syncAll().catch(err => console.error('Auto sync error:', err));
    }, intervalMs);

    console.log(`⏱️ Auto-sync configured to run every ${config.syncIntervalMinutes} minutes.`);
  }

  async syncAll(): Promise<{ success: boolean; results: any[] }> {
    if (this.isSyncing) {
      return { success: false, results: [{ error: 'A sync is already in progress' }] };
    }

    this.isSyncing = true;
    const results = [];

    try {
      const branches = db.prepare('SELECT * FROM branches WHERE active = 1').all() as any[];
      for (const branch of branches) {
        try {
          const result = await this.syncBranch(branch.id);
          results.push(result);
        } catch (err: any) {
          results.push({ branchId: branch.id, error: err.message });
        }
      }
      return { success: true, results };
    } finally {
      this.isSyncing = false;
    }
  }

  async syncBranch(branchId: string): Promise<SyncLog> {
    const startTime = Date.now();
    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(branchId) as any;
    if (!branch) {
      throw new Error(`Branch with ID "${branchId}" not found.`);
    }

    const logId = `sync_${branchId}_${Date.now()}`;
    let employeesProcessed = 0;
    let attendanceRecordsProcessed = 0;
    let recordsAdded = 0;
    let recordsUpdated = 0;
    let recordsRemoved = 0;
    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let errorMessage: string | null = null;

    try {
      const rawData = await sheetsClient.fetchRawSheetData(branch.id, branch.spreadsheet_id);
      const parser = getParserForBranch(branch.id);
      const parsed = parser.parse(rawData);

      employeesProcessed = parsed.employees.length;
      attendanceRecordsProcessed = parsed.attendanceRecords.length;

      const upsertEmployee = db.prepare(`
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

      const upsertAttendance = db.prepare(`
        INSERT INTO attendance_records (id, employee_id, branch_id, date, session, present, entry_time, source_spreadsheet_id, updated_at)
        VALUES (@id, @employeeId, @branchId, @date, @session, @present, @entryTime, @sourceSpreadsheetId, CURRENT_TIMESTAMP)
        ON CONFLICT(employee_id, date, session) DO UPDATE SET
          present = excluded.present,
          entry_time = excluded.entry_time,
          source_spreadsheet_id = excluded.source_spreadsheet_id,
          updated_at = CURRENT_TIMESTAMP
      `);

      const parsedEmpIds = parsed.employees.map(e => e.id);

      const syncTx = db.transaction(() => {
        if (parsedEmpIds.length > 0) {
          const placeholders = parsedEmpIds.map(() => '?').join(',');
          
          // Delete attendance records for obsolete employees of this branch
          db.prepare(`
            DELETE FROM attendance_records 
            WHERE branch_id = ? AND employee_id NOT IN (${placeholders})
          `).run(branch.id, ...parsedEmpIds);

          // Delete obsolete employees of this branch
          db.prepare(`
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
          } else {
            recordsAdded++;
          }
        }
      });

      syncTx();
    } catch (err: any) {
      status = 'FAILED';
      errorMessage = err.message || 'Unknown error occurred during sync';
      console.error(`Sync failed for branch ${branchId}:`, err);
    }

    const durationMs = Date.now() - startTime;

    const syncLog: SyncLog = {
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

    db.prepare(`
      INSERT INTO sync_logs (
        id, timestamp, branch_id, status, duration_ms,
        employees_processed, attendance_records_processed,
        records_added, records_updated, records_removed, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      syncLog.id,
      syncLog.timestamp,
      syncLog.branchId,
      syncLog.status,
      syncLog.durationMs,
      syncLog.employeesProcessed,
      syncLog.attendanceRecordsProcessed,
      syncLog.recordsAdded,
      syncLog.recordsUpdated,
      syncLog.recordsRemoved,
      syncLog.errorMessage
    );

    return syncLog;
  }

  getSyncStatus() {
    const lastSync = db.prepare(`
      SELECT sl.*, b.name as branch_name 
      FROM sync_logs sl 
      LEFT JOIN branches b ON sl.branch_id = b.id 
      ORDER BY sl.timestamp DESC LIMIT 1
    `).get() as any;

    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE active = 1').get() as { count: number };
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM attendance_records').get() as { count: number };
    const activeBranches = db.prepare('SELECT COUNT(*) as count FROM branches WHERE active = 1').get() as { count: number };

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
      mode: config.useMockData ? 'mock' : 'live_google_sheets',
      syncIntervalMinutes: config.syncIntervalMinutes,
    };
  }

  getSyncLogs(limit = 50): SyncLog[] {
    const logs = db.prepare(`
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
    `).all(limit) as SyncLog[];

    return logs;
  }
}

export const syncService = new SyncService();
