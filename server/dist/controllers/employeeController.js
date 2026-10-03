"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployeeById = exports.getEmployees = void 0;
const db_1 = require("../database/db");
const attendanceEngine_1 = require("../services/attendance/attendanceEngine");
const getEmployees = (req, res) => {
    try {
        const { branch, designation, reportingTo, status, search, month } = req.query;
        const latestActiveMonthRow = db_1.db.prepare(`
      SELECT SUBSTR(MAX(date), 1, 7) as maxMonth 
      FROM attendance_records 
      WHERE present = 1
    `).get();
        const targetMonth = month || latestActiveMonthRow?.maxMonth || '2026-10';
        let query = `
      SELECT e.*, b.name as branch_name, b.code as branch_code
      FROM employees e
      JOIN branches b ON e.branch_id = b.id
      WHERE 1=1
    `;
        const params = [];
        if (branch && branch !== 'all') {
            query += ' AND e.branch_id = ?';
            params.push(branch);
        }
        if (designation && designation !== 'all') {
            query += ' AND e.designation = ?';
            params.push(designation);
        }
        if (reportingTo && reportingTo !== 'all') {
            query += ' AND e.reporting_to = ?';
            params.push(reportingTo);
        }
        if (search) {
            const s = `%${search}%`;
            query += ' AND (e.name LIKE ? OR e.employee_code LIKE ? OR e.designation LIKE ? OR e.reporting_to LIKE ?)';
            params.push(s, s, s, s);
        }
        query += ' ORDER BY b.name ASC, e.name ASC';
        const employees = db_1.db.prepare(query).all(...params);
        // Find latest active date for expected sessions calculation
        const latestLoggedDateInMonthRow = db_1.db.prepare(`
      SELECT MAX(date) as maxDate
      FROM attendance_records
      WHERE date LIKE ? AND present = 1
    `).get(`${targetMonth}%`);
        const maxActiveDate = latestLoggedDateInMonthRow?.maxDate || '';
        const result = employees.map(emp => {
            const recs = db_1.db.prepare(`
        SELECT session, present, date 
        FROM attendance_records 
        WHERE employee_id = ? AND date LIKE ?
      `).all(emp.id, `${targetMonth}%`);
            const activeRecs = maxActiveDate
                ? recs.filter(r => r.date <= maxActiveDate && !attendanceEngine_1.attendanceEngine.isNonWorkingDay(r.date, emp.branch_id).isWeekend && !attendanceEngine_1.attendanceEngine.isNonWorkingDay(r.date, emp.branch_id).isHoliday)
                : recs.filter(r => !attendanceEngine_1.attendanceEngine.isNonWorkingDay(r.date, emp.branch_id).isWeekend && !attendanceEngine_1.attendanceEngine.isNonWorkingDay(r.date, emp.branch_id).isHoliday);
            const presentSessions = recs.filter(r => r.present === 1).length;
            const totalSessions = activeRecs.length > 0 ? activeRecs.length : recs.length;
            const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 1000) / 10 : 0;
            const statusRating = attendanceEngine_1.attendanceEngine.getRating(attendanceRate);
            return {
                id: emp.id,
                employeeCode: emp.employee_code,
                name: emp.name,
                designation: emp.designation,
                reportingTo: emp.reporting_to,
                branchId: emp.branch_id,
                branchName: emp.branch_name,
                branchCode: emp.branch_code,
                workLink: emp.work_link,
                active: emp.active === 1,
                email: emp.email,
                phone: emp.phone,
                joinedDate: emp.joined_date,
                presentSessions,
                totalSessions,
                attendanceRate,
                statusRating,
                hasWorkLog: Boolean(emp.work_link && emp.work_link.trim().length > 0),
            };
        });
        const finalResult = status && status !== 'all'
            ? result.filter(e => e.statusRating.toLowerCase() === status.toLowerCase())
            : result;
        res.json(finalResult);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getEmployees = getEmployees;
const getEmployeeById = (req, res) => {
    try {
        const { id } = req.params;
        const { month } = req.query;
        const latestActiveMonthRow = db_1.db.prepare(`
      SELECT SUBSTR(MAX(date), 1, 7) as maxMonth 
      FROM attendance_records 
      WHERE present = 1
    `).get();
        const targetMonth = month || latestActiveMonthRow?.maxMonth || '2026-10';
        const emp = db_1.db.prepare(`
      SELECT e.*, b.name as branch_name, b.code as branch_code 
      FROM employees e 
      JOIN branches b ON e.branch_id = b.id 
      WHERE e.id = ?
    `).get(id);
        if (!emp) {
            return res.status(404).json({ error: `Employee with ID "${id}" not found` });
        }
        const recs = db_1.db.prepare(`
      SELECT date, session, present, entry_time 
      FROM attendance_records 
      WHERE employee_id = ? AND date LIKE ?
      ORDER BY date ASC, session ASC
    `).all(id, `${targetMonth}%`);
        const latestLoggedDateInMonthRow = db_1.db.prepare(`
      SELECT MAX(date) as maxDate
      FROM attendance_records
      WHERE date LIKE ? AND present = 1
    `).get(`${targetMonth}%`);
        const maxActiveDate = latestLoggedDateInMonthRow?.maxDate || '';
        const dateMap = new Map();
        for (const r of recs) {
            if (!dateMap.has(r.date)) {
                dateMap.set(r.date, { morning: null, morningTime: null, evening: null, eveningTime: null });
            }
            const entry = dateMap.get(r.date);
            if (r.session === 'morning') {
                entry.morning = r.present === 1;
                entry.morningTime = r.present === 1 ? (r.entry_time || '09:30 AM') : null;
            }
            if (r.session === 'evening') {
                entry.evening = r.present === 1;
                entry.eveningTime = r.present === 1 ? (r.entry_time || '05:30 PM') : null;
            }
        }
        let presentDays = 0;
        let partialDays = 0;
        let absentDays = 0;
        let holidayDays = 0;
        let weekendDays = 0;
        let workingDays = 0;
        let morningPresent = 0;
        let eveningPresent = 0;
        let totalPresentSessions = 0;
        let totalExpectedSessions = 0;
        const calendarDays = [];
        for (const [dateStr, sessions] of dateMap.entries()) {
            const dayInfo = attendanceEngine_1.attendanceEngine.isNonWorkingDay(dateStr, emp.branch_id);
            const isMorning = sessions.morning === true;
            const isEvening = sessions.evening === true;
            if (isMorning)
                morningPresent++;
            if (isEvening)
                eveningPresent++;
            const pCount = (isMorning ? 1 : 0) + (isEvening ? 1 : 0);
            let status = 'absent';
            if (pCount === 2) {
                status = 'full';
                presentDays++;
                totalPresentSessions += 2;
                workingDays++;
                totalExpectedSessions += 2;
            }
            else if (pCount === 1) {
                status = 'partial';
                partialDays++;
                totalPresentSessions += 1;
                workingDays++;
                totalExpectedSessions += 2;
            }
            else if (dayInfo.isHoliday) {
                status = 'holiday';
                holidayDays++;
            }
            else if (dayInfo.isWeekend) {
                status = 'weekend';
                weekendDays++;
            }
            else if (maxActiveDate && dateStr > maxActiveDate) {
                status = 'future';
            }
            else {
                status = 'absent';
                absentDays++;
                workingDays++;
                totalExpectedSessions += 2;
            }
            const [y, m, d] = dateStr.split('-').map(Number);
            const dayOfWeek = new Date(y, m - 1, d).getDay();
            calendarDays.push({
                date: dateStr,
                dayOfWeek,
                morning: sessions.morning,
                morningTime: sessions.morningTime,
                evening: sessions.evening,
                eveningTime: sessions.eveningTime,
                status,
                isHoliday: dayInfo.isHoliday,
                isWeekend: dayInfo.isWeekend,
                holidayName: dayInfo.holidayName,
                workLog: emp.work_link ? 'Submitted' : 'Missing',
            });
        }
        const attendanceRate = totalExpectedSessions > 0
            ? Math.round((totalPresentSessions / totalExpectedSessions) * 1000) / 10
            : 0;
        const allMonths = db_1.db.prepare(`
      SELECT DISTINCT SUBSTR(date, 1, 7) as m 
      FROM attendance_records 
      WHERE employee_id = ? 
      ORDER BY m ASC
    `).all(id);
        const trend = allMonths.map(mRow => {
            const mRecs = db_1.db.prepare(`
        SELECT present, session 
        FROM attendance_records 
        WHERE employee_id = ? AND date LIKE ?
      `).all(id, `${mRow.m}%`);
            const p = mRecs.filter(r => r.present === 1).length;
            const t = mRecs.length;
            const mRate = t > 0 ? Math.round((p / t) * 1000) / 10 : 0;
            return {
                month: mRow.m,
                rate: mRate,
                presentSessions: p,
                totalSessions: t,
            };
        });
        res.json({
            employee: {
                id: emp.id,
                employeeCode: emp.employee_code,
                name: emp.name,
                designation: emp.designation,
                reportingTo: emp.reporting_to,
                branchId: emp.branch_id,
                branchName: emp.branch_name,
                branchCode: emp.branch_code,
                workLink: emp.work_link,
                active: emp.active === 1,
                email: emp.email,
                phone: emp.phone,
                joinedDate: emp.joined_date,
            },
            summary: {
                month,
                workingDays,
                presentDays,
                absentDays,
                partialDays,
                holidayDays,
                weekendDays,
                morningSessions: morningPresent,
                eveningSessions: eveningPresent,
                presentSessions: totalPresentSessions,
                totalSessions: totalExpectedSessions,
                attendanceRate,
                statusRating: attendanceEngine_1.attendanceEngine.getRating(attendanceRate),
                workLogs: emp.work_link ? 'Submitted' : 'Missing',
            },
            calendar: calendarDays,
            trend,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getEmployeeById = getEmployeeById;
