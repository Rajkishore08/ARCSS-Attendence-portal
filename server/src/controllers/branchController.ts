import { Request, Response } from 'express';
import { db } from '../database/db';
import { attendanceEngine } from '../services/attendance/attendanceEngine';

export const getBranches = (req: Request, res: Response) => {
  try {
    const branches = db.prepare('SELECT * FROM branches WHERE active = 1 ORDER BY name ASC').all() as any[];

    const result = branches.map(b => {
      const empCount = db.prepare('SELECT COUNT(*) as count FROM employees WHERE branch_id = ? AND active = 1').get(b.id) as { count: number };
      const lastSync = db.prepare('SELECT timestamp, status, duration_ms FROM sync_logs WHERE branch_id = ? ORDER BY timestamp DESC LIMIT 1').get(b.id) as any;

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        spreadsheetId: b.spreadsheet_id,
        sheetName: b.sheet_name,
        color: b.color,
        employeeCount: empCount.count,
        lastSync: lastSync ? {
          timestamp: lastSync.timestamp,
          status: lastSync.status,
          durationMs: lastSync.duration_ms,
        } : null,
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBranchById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month = '2026-09', date } = req.query;

    const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(id) as any;
    if (!branch) {
      return res.status(404).json({ error: `Branch "${id}" not found` });
    }

    const latestDateRow = db.prepare('SELECT MAX(date) as maxDate FROM attendance_records').get() as { maxDate: string };
    const targetDate = (date as string) || latestDateRow?.maxDate || new Date().toISOString().split('T')[0];

    const employees = db.prepare('SELECT * FROM employees WHERE branch_id = ? AND active = 1 ORDER BY name ASC').all(id) as any[];
    const employeeCount = employees.length;

    const todayRecs = db.prepare(`
      SELECT session, present 
      FROM attendance_records 
      WHERE branch_id = ? AND date = ?
    `).all(id, targetDate) as any[];

    const todayM = todayRecs.filter(r => r.session === 'morning' && r.present === 1).length;
    const todayE = todayRecs.filter(r => r.session === 'evening' && r.present === 1).length;
    const todayPresent = todayM + todayE;
    const todayExpected = employeeCount * 2;
    const todayRate = todayExpected > 0 ? Math.round((todayPresent / todayExpected) * 1000) / 10 : 0;

    const monthlyRecs = db.prepare(`
      SELECT present, session, date 
      FROM attendance_records 
      WHERE branch_id = ? AND date LIKE ?
    `).all(id, `${month}%`) as any[];

    const monthlyPresent = monthlyRecs.filter(r => r.present === 1).length;
    const monthlyTotal = monthlyRecs.length;
    const monthlyMissing = monthlyTotal - monthlyPresent;
    const monthlyRate = monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 1000) / 10 : 0;

    const workLogsCount = employees.filter(e => e.work_link && e.work_link.trim().length > 0).length;

    const employeeStats = employees.map(emp => {
      const empRecs = monthlyRecs.filter(r => r.employee_id === emp.id);
      const p = empRecs.filter(r => r.present === 1).length;
      const t = empRecs.length;
      const rate = t > 0 ? Math.round((p / t) * 1000) / 10 : 0;

      return {
        id: emp.id,
        employeeCode: emp.employee_code,
        name: emp.name,
        designation: emp.designation,
        reportingTo: emp.reporting_to,
        workLink: emp.work_link,
        presentSessions: p,
        totalSessions: t,
        attendanceRate: rate,
        statusRating: attendanceEngine.getRating(rate),
      };
    });

    const trendRows = db.prepare(`
      SELECT 
        date,
        COUNT(CASE WHEN session = 'morning' AND present = 1 THEN 1 END) as morning_present,
        COUNT(CASE WHEN session = 'morning' THEN 1 END) as morning_total,
        COUNT(CASE WHEN session = 'evening' AND present = 1 THEN 1 END) as evening_present,
        COUNT(CASE WHEN session = 'evening' THEN 1 END) as evening_total,
        COUNT(CASE WHEN present = 1 THEN 1 END) as total_present,
        COUNT(id) as total_sessions
      FROM attendance_records
      WHERE branch_id = ? AND date LIKE ?
      GROUP BY date
      ORDER BY date ASC
    `).all(id, `${month}%`) as any[];

    const dailyTrend = trendRows.map(r => ({
      date: r.date,
      shortDate: r.date.substring(5),
      rate: r.total_sessions > 0 ? Math.round((r.total_present / r.total_sessions) * 1000) / 10 : 0,
      morningRate: r.morning_total > 0 ? Math.round((r.morning_present / r.morning_total) * 1000) / 10 : 0,
      eveningRate: r.evening_total > 0 ? Math.round((r.evening_present / r.evening_total) * 1000) / 10 : 0,
    }));

    res.json({
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        spreadsheetId: branch.spreadsheet_id,
        sheetName: branch.sheet_name,
        color: branch.color,
      },
      kpis: {
        employeeCount,
        todayRate,
        todayPresent,
        todayExpected,
        todayMorning: `${todayM} / ${employeeCount}`,
        todayEvening: `${todayE} / ${employeeCount}`,
        monthlyRate,
        monthlyPresent,
        monthlyTotal,
        monthlyMissing,
        workLogsSubmitted: workLogsCount,
        workLogsMissing: employeeCount - workLogsCount,
        workLogRate: employeeCount > 0 ? Math.round((workLogsCount / employeeCount) * 1000) / 10 : 0,
        status: attendanceEngine.getRating(monthlyRate),
      },
      employees: employeeStats,
      dailyTrend,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
