"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyAttendance = exports.getDailyAttendance = void 0;
const db_1 = require("../database/db");
const attendanceEngine_1 = require("../services/attendance/attendanceEngine");
const getDailyAttendance = (req, res) => {
    try {
        const { date, branch, search, status } = req.query;
        const latestActiveDateRow = db_1.db.prepare(`
      SELECT MAX(date) as maxDate 
      FROM attendance_records 
      WHERE present = 1
    `).get();
        const targetDate = date || latestActiveDateRow?.maxDate || '2026-10-03';
        let empQuery = `
      SELECT e.*, b.name as branch_name 
      FROM employees e 
      JOIN branches b ON e.branch_id = b.id 
      WHERE e.active = 1
    `;
        const empParams = [];
        if (branch && branch !== 'all') {
            empQuery += ' AND e.branch_id = ?';
            empParams.push(branch);
        }
        if (search) {
            const s = `%${search}%`;
            empQuery += ' AND (e.name LIKE ? OR e.designation LIKE ? OR e.reporting_to LIKE ?)';
            empParams.push(s, s, s);
        }
        empQuery += ' ORDER BY b.name ASC, e.name ASC';
        const employees = db_1.db.prepare(empQuery).all(...empParams);
        const records = employees.map(emp => {
            const morningRec = db_1.db.prepare(`
        SELECT present, entry_time FROM attendance_records 
        WHERE employee_id = ? AND date = ? AND session = 'morning'
      `).get(emp.id, targetDate);
            const eveningRec = db_1.db.prepare(`
        SELECT present, entry_time FROM attendance_records 
        WHERE employee_id = ? AND date = ? AND session = 'evening'
      `).get(emp.id, targetDate);
            return attendanceEngine_1.attendanceEngine.calculateDailyAttendance(emp, targetDate, morningRec, eveningRec);
        });
        const dayInfo = attendanceEngine_1.attendanceEngine.isNonWorkingDay(targetDate);
        const filteredRecords = status && status !== 'all'
            ? records.filter(r => r.status.toLowerCase() === status.toLowerCase())
            : records;
        res.json({
            date: targetDate,
            dayInfo,
            records: filteredRecords,
            totalEmployees: employees.length,
            presentCount: records.filter(r => r.status === 'full' || r.status === 'partial').length,
            fullCount: records.filter(r => r.status === 'full').length,
            partialCount: records.filter(r => r.status === 'partial').length,
            absentCount: records.filter(r => r.status === 'absent').length,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDailyAttendance = getDailyAttendance;
const getMonthlyAttendance = (req, res) => {
    try {
        const { month, branch, search } = req.query;
        const latestActiveMonthRow = db_1.db.prepare(`
      SELECT SUBSTR(MAX(date), 1, 7) as maxMonth 
      FROM attendance_records 
      WHERE present = 1
    `).get();
        const targetMonth = month || latestActiveMonthRow?.maxMonth || '2026-10';
        let empQuery = `
      SELECT e.*, b.name as branch_name 
      FROM employees e 
      JOIN branches b ON e.branch_id = b.id 
      WHERE e.active = 1
    `;
        const empParams = [];
        if (branch && branch !== 'all') {
            empQuery += ' AND e.branch_id = ?';
            empParams.push(branch);
        }
        if (search) {
            const s = `%${search}%`;
            empQuery += ' AND (e.name LIKE ? OR e.designation LIKE ? OR e.reporting_to LIKE ?)';
            empParams.push(s, s, s);
        }
        empQuery += ' ORDER BY b.name ASC, e.name ASC';
        const employees = db_1.db.prepare(empQuery).all(...empParams);
        const dates = db_1.db.prepare(`
      SELECT DISTINCT date 
      FROM attendance_records 
      WHERE date LIKE ? 
      ORDER BY date ASC
    `).all(`${targetMonth}%`);
        const dateList = dates.map(d => d.date);
        // Find the latest date in this month that has actual attendance logged
        const latestLoggedDateInMonthRow = db_1.db.prepare(`
      SELECT MAX(date) as maxDate
      FROM attendance_records
      WHERE date LIKE ? AND present = 1
    `).get(`${targetMonth}%`);
        const maxActiveDate = latestLoggedDateInMonthRow?.maxDate || (dateList.length > 0 ? dateList[dateList.length - 1] : '');
        const rows = employees.map(emp => {
            const empRecs = db_1.db.prepare(`
        SELECT date, session, present, entry_time 
        FROM attendance_records 
        WHERE employee_id = ? AND date LIKE ?
      `).all(emp.id, `${targetMonth}%`);
            const dailyMap = {};
            let presentSessions = 0;
            let totalSessions = 0;
            let presentDays = 0;
            let absentDays = 0;
            let partialDays = 0;
            let workingDays = 0;
            for (const d of dateList) {
                const morningRec = empRecs.find(r => r.date === d && r.session === 'morning');
                const eveningRec = empRecs.find(r => r.date === d && r.session === 'evening');
                const morning = morningRec?.present === 1;
                const evening = eveningRec?.present === 1;
                const morningTime = morning ? (morningRec?.entry_time || '09:30 AM') : null;
                const eveningTime = evening ? (eveningRec?.entry_time || '05:30 PM') : null;
                const dayInfo = attendanceEngine_1.attendanceEngine.isNonWorkingDay(d, emp.branch_id);
                const p = (morning ? 1 : 0) + (evening ? 1 : 0);
                let cellStatus = 'absent';
                if (p === 2) {
                    cellStatus = 'full';
                    presentDays++;
                    presentSessions += 2;
                    workingDays++;
                    totalSessions += 2;
                }
                else if (p === 1) {
                    cellStatus = 'partial';
                    partialDays++;
                    presentSessions += 1;
                    workingDays++;
                    totalSessions += 2;
                }
                else if (dayInfo.isHoliday) {
                    cellStatus = 'holiday';
                }
                else if (dayInfo.isWeekend) {
                    cellStatus = 'weekend';
                }
                else if (d > maxActiveDate) {
                    cellStatus = 'future';
                }
                else {
                    cellStatus = 'absent';
                    absentDays++;
                    workingDays++;
                    totalSessions += 2;
                }
                dailyMap[d] = {
                    morning,
                    morningTime,
                    evening,
                    eveningTime,
                    status: cellStatus,
                    holidayName: dayInfo.holidayName,
                };
            }
            const rate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 1000) / 10 : 0;
            return {
                employeeId: emp.id,
                employeeName: emp.name,
                employeeCode: emp.employee_code,
                designation: emp.designation,
                reportingTo: emp.reporting_to,
                branchId: emp.branch_id,
                branchName: emp.branch_name,
                workLink: emp.work_link,
                workingDays,
                presentDays,
                absentDays,
                partialDays,
                presentSessions,
                totalSessions,
                attendanceRate: rate,
                statusRating: attendanceEngine_1.attendanceEngine.getRating(rate),
                days: dailyMap,
            };
        });
        const totalStaff = rows.length;
        const avgRate = totalStaff > 0
            ? Math.round((rows.reduce((acc, r) => acc + r.attendanceRate, 0) / totalStaff) * 10) / 10
            : 0;
        res.json({
            month: targetMonth,
            dates: dateList,
            employees: rows,
            summary: {
                totalStaff,
                averageRate: avgRate,
                workingDaysInMonth: dateList.filter(d => {
                    const info = attendanceEngine_1.attendanceEngine.isNonWorkingDay(d);
                    return !info.isHoliday && !info.isWeekend;
                }).length,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getMonthlyAttendance = getMonthlyAttendance;
