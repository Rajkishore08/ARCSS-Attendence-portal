import { config } from '../config/index';

export interface BranchRow {
  id: string;
  name: string;
  code: string;
  spreadsheet_id: string;
  sheet_name: string;
  color: string;
  active: number;
  created_at: string;
}

export interface EmployeeRow {
  id: string;
  employee_code?: string | null;
  name: string;
  designation?: string | null;
  reporting_to?: string | null;
  branch_id: string;
  work_link?: string | null;
  active: number;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
  joined_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecordRow {
  id: string;
  employee_id: string;
  branch_id: string;
  date: string;
  session: 'morning' | 'evening';
  present: number;
  entry_time?: string | null;
  source_spreadsheet_id?: string | null;
  updated_at: string;
}

export interface HolidayRow {
  id: string;
  date: string;
  name: string;
  branch_id?: string | null;
  created_at: string;
}

export interface AttendanceRuleRow {
  id: string;
  name: string;
  min_percentage: number;
  max_percentage: number;
  color: string;
  description: string;
}

export interface SyncLogRow {
  id: string;
  timestamp: string;
  branch_id?: string | null;
  status: string;
  duration_ms: number;
  employees_processed: number;
  attendance_records_processed: number;
  records_added: number;
  records_updated: number;
  records_removed: number;
  error_message?: string | null;
}

export class MemoryDatabase {
  public branches: Map<string, BranchRow> = new Map();
  public employees: Map<string, EmployeeRow> = new Map();
  public attendanceRecords: Map<string, AttendanceRecordRow> = new Map();
  public holidays: Map<string, HolidayRow> = new Map();
  public attendanceRules: Map<string, AttendanceRuleRow> = new Map();
  public syncLogs: SyncLogRow[] = [];

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData() {
    // 1. Seed branches
    for (const b of config.branches) {
      this.branches.set(b.id, {
        id: b.id,
        name: b.name,
        code: b.code,
        spreadsheet_id: b.spreadsheetId,
        sheet_name: b.sheetName,
        color: b.color,
        active: 1,
        created_at: new Date().toISOString(),
      });
    }

    // 2. Seed default rules
    const defaultRules: AttendanceRuleRow[] = [
      { id: 'rule_excellent', name: 'Excellent', min_percentage: 90.0, max_percentage: 100.0, color: '#10b981', description: 'Outstanding consistency and participation' },
      { id: 'rule_good', name: 'Good', min_percentage: 75.0, max_percentage: 89.99, color: '#0284c7', description: 'Meets high attendance expectations' },
      { id: 'rule_needs_review', name: 'Needs Review', min_percentage: 60.0, max_percentage: 74.99, color: '#f59e0b', description: 'Requires attention or follow-up' },
      { id: 'rule_review', name: 'Review', min_percentage: 0.0, max_percentage: 59.99, color: '#ef4444', description: 'Critical low attendance' },
    ];
    for (const r of defaultRules) {
      this.attendanceRules.set(r.id, r);
    }

    // 3. Seed default holidays
    const defaultHolidays: HolidayRow[] = [
      { id: 'h_2026_09_04', date: '2026-09-04', name: 'Branch Holiday / Special Leave', branch_id: null, created_at: new Date().toISOString() },
      { id: 'h_2026_10_02', date: '2026-10-02', name: 'Gandhi Jayanti', branch_id: null, created_at: new Date().toISOString() },
      { id: 'h_2026_10_20', date: '2026-10-20', name: 'Ayudha Puja / Vijayadasami', branch_id: null, created_at: new Date().toISOString() },
      { id: 'h_2026_11_08', date: '2026-11-08', name: 'Deepavali', branch_id: null, created_at: new Date().toISOString() },
    ];
    for (const h of defaultHolidays) {
      this.holidays.set(h.id, h);
    }

    // 4. Pre-seed Real ARCS personnel
    const realEmployees: EmployeeRow[] = [
      { id: 'madurai_abdul_wahid_s', employee_code: 'ARCS-MDU-001', name: 'ABDUL WAHID S', designation: 'Program Coordinator', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'madurai', work_link: 'https://docs.google.com/document/d/1_madurai_worklog/edit', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'nmc-trichy_abdul_azees', employee_code: 'ARCS-NMC-001', name: 'Abdul Azees', designation: 'Operations Specialist', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'nmc-trichy', work_link: 'https://docs.google.com/document/d/1_abdul_work_log_arcs/edit', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'nmc-trichy_nithya', employee_code: 'ARCS-NMC-002', name: 'Nithya', designation: 'Operations Specialist', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'nmc-trichy', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'nmc-trichy_janani', employee_code: 'ARCS-NMC-003', name: 'Janani', designation: 'Operations Specialist', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'nmc-trichy', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'vivekanandha_anusha_r', employee_code: 'ARCS-VIV-001', name: 'ANUSHA R', designation: 'Lab Project Lead', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'vivekanandha', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'vivekanandha_deena_sherin_n', employee_code: 'ARCS-VIV-002', name: 'DEENA SHERIN N', designation: 'Lab Project Lead', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'vivekanandha', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'vivekanandha_mathumathi_k', employee_code: 'ARCS-VIV-003', name: 'MATHUMATHI K', designation: 'Lab Project Lead', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'vivekanandha', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'vivekanandha_priyadharshini_r', employee_code: 'ARCS-VIV-004', name: 'PRIYADHARSHINI R', designation: 'Lab Project Lead', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'vivekanandha', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'vivekanandha_udhaya_nila_s', employee_code: 'ARCS-VIV-005', name: 'UDHAYA NILA S', designation: 'Lab Project Lead', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'vivekanandha', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'vivekanandha_kalaimagal_s', employee_code: 'ARCS-VIV-006', name: 'KALAIMAGAL S', designation: 'Lab Project Lead', reporting_to: 'Dr. Sasi Kumar (CSA)', branch_id: 'vivekanandha', work_link: '', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'others_raj_kishore_s', employee_code: 'ARCS-OTH-001', name: 'Raj Kishore S', designation: 'XRDT R&I Coordinator', reporting_to: 'DR. Sasi Kumar (CSA)', branch_id: 'others', work_link: 'Raj Works -ARCS', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 'others_saranya', employee_code: 'ARCS-OTH-002', name: 'Saranya', designation: 'XRDT R&I Coordinator', reporting_to: 'DR. Sasi Kumar (CSA)', branch_id: 'others', work_link: 'ARCS Portal Contents', active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    for (const emp of realEmployees) {
      this.employees.set(emp.id, emp);
    }

  }

  public exec(sql: string) {
    // No-op for CREATE TABLE, ALTER TABLE in memory store
  }

  public pragma(sql: string) {
    // No-op
  }

  public transaction<T extends (...args: any[]) => any>(fn: T): T {
    return fn;
  }

  public prepare(sql: string) {
    return {
      all: (...args: any[]) => this.executeAll(sql, args),
      get: (...args: any[]) => this.executeGet(sql, args),
      run: (...args: any[]) => this.executeRun(sql, args),
    };
  }

  private executeAll(sql: string, args: any[]): any[] {
    const s = sql.replace(/\s+/g, ' ').trim();

    // 1. SELECT * FROM branches
    if (s.startsWith('SELECT * FROM branches')) {
      const activeOnly = s.includes('active = 1');
      const rows = Array.from(this.branches.values()).filter(b => !activeOnly || b.active === 1);
      if (s.includes('ORDER BY name ASC')) {
        rows.sort((a, b) => a.name.localeCompare(b.name));
      }
      return rows;
    }

    // 2. SELECT e.*, b.name as branch_name FROM employees e JOIN branches b ON e.branch_id = b.id ...
    if (s.includes('FROM employees e') && s.includes('JOIN branches b')) {
      let emps = Array.from(this.employees.values()).filter(e => e.active === 1);
      
      let argIdx = 0;
      if (s.includes('e.branch_id = ?') && args[argIdx]) {
        const targetBranch = args[argIdx++];
        if (targetBranch !== 'all') {
          emps = emps.filter(e => e.branch_id === targetBranch);
        }
      }

      if (s.includes('e.name LIKE ?') && args[argIdx]) {
        const searchPattern = String(args[argIdx++]).replace(/%/g, '').toLowerCase();
        emps = emps.filter(e => 
          e.name.toLowerCase().includes(searchPattern) ||
          (e.designation && e.designation.toLowerCase().includes(searchPattern)) ||
          (e.reporting_to && e.reporting_to.toLowerCase().includes(searchPattern))
        );
      }

      const mapped = emps.map(e => ({
        ...e,
        branch_name: this.branches.get(e.branch_id)?.name || e.branch_id,
      }));

      mapped.sort((a, b) => (a.branch_name || '').localeCompare(b.branch_name || '') || a.name.localeCompare(b.name));
      return mapped;
    }

    // 3. SELECT * FROM employees WHERE branch_id = ? ...
    if (s.startsWith('SELECT') && s.includes('FROM employees') && s.includes('branch_id = ?')) {
      const branchId = args[0];
      const activeOnly = s.includes('active = 1');
      return Array.from(this.employees.values()).filter(e => e.branch_id === branchId && (!activeOnly || e.active === 1));
    }

    // 4. SELECT id, branch_id FROM employees WHERE active = 1
    if (s.includes('SELECT') && s.includes('FROM employees WHERE active = 1')) {
      let emps = Array.from(this.employees.values()).filter(e => e.active === 1);
      if (s.includes('branch_id = ?') && args[0] && args[0] !== 'all') {
        emps = emps.filter(e => e.branch_id === args[0]);
      }
      return emps;
    }

    // 5. SELECT DISTINCT SUBSTR(date, 1, 7) as month FROM attendance_records ORDER BY month DESC
    if (s.includes('SUBSTR(date, 1, 7) as month')) {
      const months = Array.from(new Set(Array.from(this.attendanceRecords.values()).map(r => r.date.substring(0, 7)))).sort().reverse();
      return months.map(month => ({ month }));
    }

    // 6. SELECT DISTINCT date FROM attendance_records WHERE date LIKE ?
    if (s.includes('SELECT DISTINCT date') && s.includes('FROM attendance_records')) {
      let recs = Array.from(this.attendanceRecords.values());
      if (s.includes('date LIKE ?') && args[0]) {
        const pattern = String(args[0]).replace(/%/g, '');
        recs = recs.filter(r => r.date.startsWith(pattern));
      }
      const dates = Array.from(new Set(recs.map(r => r.date))).sort();
      if (s.includes('ORDER BY date DESC')) {
        dates.reverse();
      }
      return dates.map(date => ({ date }));
    }

    // 7. SELECT session, present FROM attendance_records WHERE employee_id = ? AND date = ?
    if (s.includes('FROM attendance_records') && s.includes('employee_id = ?') && s.includes('date = ?')) {
      const [empId, date] = args;
      return Array.from(this.attendanceRecords.values()).filter(r => r.employee_id === empId && r.date === date);
    }

    // 8. SELECT date, session, present, entry_time FROM attendance_records WHERE employee_id = ? AND date LIKE ?
    if (s.includes('FROM attendance_records') && s.includes('employee_id = ?') && s.includes('date LIKE ?')) {
      const [empId, monthPattern] = args;
      const prefix = String(monthPattern).replace(/%/g, '');
      return Array.from(this.attendanceRecords.values()).filter(r => r.employee_id === empId && r.date.startsWith(prefix));
    }

    // 9. SELECT present, session FROM attendance_records WHERE branch_id = ? AND date LIKE ?
    if (s.includes('FROM attendance_records') && s.includes('branch_id = ?') && s.includes('date LIKE ?')) {
      const [branchId, pattern] = args;
      const prefix = String(pattern).replace(/%/g, '');
      return Array.from(this.attendanceRecords.values()).filter(r => r.branch_id === branchId && r.date.startsWith(prefix));
    }

    // 10. SELECT session, present FROM attendance_records WHERE branch_id = ? AND date = ?
    if (s.includes('FROM attendance_records') && s.includes('branch_id = ?') && s.includes('date = ?')) {
      const [branchId, date] = args;
      return Array.from(this.attendanceRecords.values()).filter(r => r.branch_id === branchId && r.date === date);
    }

    // 11. SELECT ar.present, ar.session, ar.date, ar.employee_id FROM attendance_records ar JOIN employees e ON ar.employee_id = e.id ...
    if (s.includes('FROM attendance_records ar') && s.includes('JOIN employees e')) {
      let recs = Array.from(this.attendanceRecords.values());
      let argIdx = 0;
      if (s.includes('ar.date LIKE ?') && args[argIdx]) {
        const prefix = String(args[argIdx++]).replace(/%/g, '');
        recs = recs.filter(r => r.date.startsWith(prefix));
      }
      if (s.includes('e.branch_id = ?') && args[argIdx] && args[argIdx] !== 'all') {
        const bId = args[argIdx++];
        recs = recs.filter(r => r.branch_id === bId);
      }
      return recs;
    }

    // 12. SELECT date, COUNT(...) FROM attendance_records GROUP BY ar.date ORDER BY ar.date ASC
    if (s.includes('GROUP BY ar.date') || s.includes('GROUP BY date')) {
      let recs = Array.from(this.attendanceRecords.values());
      let argIdx = 0;
      if (s.includes('ar.date LIKE ?') && args[argIdx]) {
        const prefix = String(args[argIdx++]).replace(/%/g, '');
        recs = recs.filter(r => r.date.startsWith(prefix));
      }
      if (s.includes('ar.branch_id = ?') && args[argIdx] && args[argIdx] !== 'all') {
        const bId = args[argIdx++];
        recs = recs.filter(r => r.branch_id === bId);
      }

      const dateMap: Record<string, any> = {};
      for (const r of recs) {
        if (!dateMap[r.date]) {
          dateMap[r.date] = {
            date: r.date,
            morning_present: 0,
            morning_total: 0,
            evening_present: 0,
            evening_total: 0,
            total_present: 0,
            total_sessions: 0,
          };
        }
        const dm = dateMap[r.date];
        dm.total_sessions++;
        if (r.session === 'morning') {
          dm.morning_total++;
          if (r.present === 1) {
            dm.morning_present++;
            dm.total_present++;
          }
        } else if (r.session === 'evening') {
          dm.evening_total++;
          if (r.present === 1) {
            dm.evening_present++;
            dm.total_present++;
          }
        }
      }

      return Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
    }

    // 13. SELECT * FROM holidays
    if (s.includes('FROM holidays')) {
      return Array.from(this.holidays.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    // 14. SELECT * FROM attendance_rules
    if (s.includes('FROM attendance_rules')) {
      return Array.from(this.attendanceRules.values());
    }

    // 15. SELECT * FROM sync_logs
    if (s.includes('FROM sync_logs')) {
      const limit = typeof args[0] === 'number' ? args[0] : 50;
      return this.syncLogs.slice(0, limit);
    }

    // 16. Fallback empty array
    return [];
  }

  private executeGet(sql: string, args: any[]): any {
    const s = sql.replace(/\s+/g, ' ').trim();

    // 1. SELECT MAX(date) as maxDate FROM attendance_records WHERE present = 1
    if (s.includes('MAX(date) as maxDate') && s.includes('present = 1')) {
      let recs = Array.from(this.attendanceRecords.values()).filter(r => r.present === 1);
      if (s.includes('date LIKE ?') && args[0]) {
        const prefix = String(args[0]).replace(/%/g, '');
        recs = recs.filter(r => r.date.startsWith(prefix));
      }
      const dates = recs.map(r => r.date).sort();
      return { maxDate: dates.length > 0 ? dates[dates.length - 1] : '2026-10-03' };
    }

    // 2. SELECT MAX(date) as maxDate FROM attendance_records
    if (s.includes('MAX(date) as maxDate')) {
      const dates = Array.from(this.attendanceRecords.values()).map(r => r.date).sort();
      return { maxDate: dates.length > 0 ? dates[dates.length - 1] : '2026-10-03' };
    }

    // 3. SELECT SUBSTR(MAX(date), 1, 7) as maxMonth FROM attendance_records WHERE present = 1
    if (s.includes('SUBSTR(MAX(date), 1, 7) as maxMonth')) {
      const dates = Array.from(this.attendanceRecords.values()).filter(r => r.present === 1).map(r => r.date).sort();
      const maxDate = dates.length > 0 ? dates[dates.length - 1] : '2026-10-03';
      return { maxMonth: maxDate.substring(0, 7) };
    }

    // 4. SELECT * FROM branches WHERE id = ?
    if (s.includes('FROM branches') && s.includes('WHERE id = ?')) {
      return this.branches.get(args[0]);
    }

    // 5. SELECT * FROM employees WHERE id = ?
    if (s.includes('FROM employees') && s.includes('WHERE id = ?')) {
      const emp = this.employees.get(args[0]);
      if (!emp) return undefined;
      return {
        ...emp,
        branch_name: this.branches.get(emp.branch_id)?.name || emp.branch_id,
      };
    }

    // 6. SELECT COUNT(*) as count FROM ...
    if (s.includes('COUNT(*) as count')) {
      if (s.includes('FROM employees')) {
        const activeOnly = s.includes('active = 1');
        return { count: Array.from(this.employees.values()).filter(e => !activeOnly || e.active === 1).length };
      }
      if (s.includes('FROM branches')) {
        const activeOnly = s.includes('active = 1');
        return { count: Array.from(this.branches.values()).filter(b => !activeOnly || b.active === 1).length };
      }
      if (s.includes('FROM attendance_records')) {
        return { count: this.attendanceRecords.size };
      }
      if (s.includes('FROM attendance_rules')) {
        return { count: this.attendanceRules.size };
      }
      if (s.includes('FROM holidays')) {
        return { count: this.holidays.size };
      }
    }

    // 7. SELECT present, entry_time FROM attendance_records WHERE employee_id = ? AND date = ? AND session = ?
    if (s.includes('FROM attendance_records') && s.includes('employee_id = ?') && s.includes('date = ?') && s.includes('session =')) {
      const [empId, date] = args;
      const isMorning = s.includes("'morning'");
      const session = isMorning ? 'morning' : 'evening';
      const rec = this.attendanceRecords.get(`${empId}_${date}_${session}`);
      return rec ? { present: rec.present, entry_time: rec.entry_time } : undefined;
    }

    // 8. SELECT timestamp FROM sync_logs ORDER BY timestamp DESC LIMIT 1
    if (s.includes('FROM sync_logs')) {
      const latest = this.syncLogs[0];
      return latest ? { ...latest } : undefined;
    }

    return undefined;
  }

  private executeRun(sql: string, args: any[]): { changes: number; lastInsertRowid: number } {
    const s = sql.replace(/\s+/g, ' ').trim();

    // 1. INSERT INTO employees
    if (s.includes('INSERT INTO employees')) {
      const data = args[0] || {};
      const emp: EmployeeRow = {
        id: data.id || args[0],
        employee_code: data.employeeCode || data.employee_code || args[1] || null,
        name: data.name || args[2],
        designation: data.designation || args[3] || null,
        reporting_to: data.reportingTo || data.reporting_to || args[4] || null,
        branch_id: data.branchId || data.branch_id || args[5],
        work_link: data.workLink || data.work_link || args[6] || null,
        active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.employees.set(emp.id, emp);
      return { changes: 1, lastInsertRowid: 1 };
    }

    // 2. INSERT INTO attendance_records
    if (s.includes('INSERT INTO attendance_records')) {
      const data = args[0] || {};
      const rec: AttendanceRecordRow = {
        id: data.id || `${data.employeeId}_${data.date}_${data.session}`,
        employee_id: data.employeeId || data.employee_id || args[1],
        branch_id: data.branchId || data.branch_id || args[2],
        date: data.date || args[3],
        session: data.session || args[4],
        present: (data.present !== undefined ? (data.present ? 1 : 0) : (args[5] ? 1 : 0)),
        entry_time: data.entryTime || data.entry_time || args[6] || null,
        source_spreadsheet_id: data.sourceSpreadsheetId || args[7] || null,
        updated_at: new Date().toISOString(),
      };
      this.attendanceRecords.set(rec.id, rec);
      return { changes: 1, lastInsertRowid: 1 };
    }

    // 3. INSERT INTO sync_logs
    if (s.includes('INSERT INTO sync_logs')) {
      const [id, timestamp, branchId, status, durationMs, emps, records, added, updated, removed, error] = args;
      this.syncLogs.unshift({
        id,
        timestamp,
        branch_id: branchId,
        status,
        duration_ms: durationMs,
        employees_processed: emps,
        attendance_records_processed: records,
        records_added: added,
        records_updated: updated,
        records_removed: removed,
        error_message: error,
      });
      return { changes: 1, lastInsertRowid: 1 };
    }

    // 4. DELETE FROM attendance_records WHERE branch_id = ? AND employee_id NOT IN (...)
    if (s.includes('DELETE FROM attendance_records')) {
      const [branchId, ...keepEmpIds] = args;
      let count = 0;
      for (const [id, rec] of this.attendanceRecords.entries()) {
        if (rec.branch_id === branchId && keepEmpIds.length > 0 && !keepEmpIds.includes(rec.employee_id)) {
          this.attendanceRecords.delete(id);
          count++;
        }
      }
      return { changes: count, lastInsertRowid: 0 };
    }

    // 5. DELETE FROM employees WHERE branch_id = ? AND id NOT IN (...)
    if (s.includes('DELETE FROM employees')) {
      const [branchId, ...keepEmpIds] = args;
      let count = 0;
      for (const [id, emp] of this.employees.entries()) {
        if (emp.branch_id === branchId && keepEmpIds.length > 0 && !keepEmpIds.includes(emp.id)) {
          this.employees.delete(id);
          count++;
        }
      }
      return { changes: count, lastInsertRowid: 0 };
    }

    return { changes: 1, lastInsertRowid: 1 };
  }
}
