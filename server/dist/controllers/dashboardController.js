"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetworkOverview = exports.getDashboardCharts = exports.getDashboardOverview = exports.getAvailableDatesMeta = void 0;
const db_1 = require("../database/db");
const attendanceEngine_1 = require("../services/attendance/attendanceEngine");
const getAvailableDatesMeta = (req, res) => {
    try {
        const rawMonths = db_1.db.prepare(`
      SELECT DISTINCT SUBSTR(date, 1, 7) as month
      FROM attendance_records
      ORDER BY month DESC
    `).all();
        const availableMonths = rawMonths.map(m => m.month);
        const latestActiveDateRow = db_1.db.prepare(`
      SELECT MAX(date) as maxDate
      FROM attendance_records
      WHERE present = 1
    `).get();
        const rawDates = db_1.db.prepare(`
      SELECT DISTINCT date
      FROM attendance_records
      ORDER BY date DESC
    `).all();
        const availableDates = rawDates.map(d => d.date);
        const latestLoggedDate = latestActiveDateRow?.maxDate || (availableDates.length > 0 ? availableDates[0] : new Date().toISOString().split('T')[0]);
        const currentMonth = latestLoggedDate.substring(0, 7);
        res.json({
            availableMonths,
            latestLoggedDate,
            currentMonth,
            availableDates,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAvailableDatesMeta = getAvailableDatesMeta;
const getDashboardOverview = (req, res) => {
    try {
        const { branch, month, date } = req.query;
        const latestActiveDateRow = db_1.db.prepare(`
      SELECT MAX(date) as maxDate 
      FROM attendance_records 
      WHERE present = 1
    `).get();
        const defaultTargetDate = latestActiveDateRow?.maxDate || new Date().toISOString().split('T')[0];
        const targetDate = date || defaultTargetDate;
        const targetMonth = month || targetDate.substring(0, 7);
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
        const employees = db_1.db.prepare(empQuery).all(...empParams);
        let presentTodayFull = 0;
        let presentTodayPartial = 0;
        let absentToday = 0;
        let morningPresentToday = 0;
        let eveningPresentToday = 0;
        let workLogsCount = 0;
        const isNonWorking = attendanceEngine_1.attendanceEngine.isNonWorkingDay(targetDate);
        for (const emp of employees) {
            if (emp.work_link && emp.work_link.trim().length > 0) {
                workLogsCount++;
            }
            const recs = db_1.db.prepare(`
        SELECT session, present 
        FROM attendance_records 
        WHERE employee_id = ? AND date = ?
      `).all(emp.id, targetDate);
            const morning = recs.find(r => r.session === 'morning')?.present === 1;
            const evening = recs.find(r => r.session === 'evening')?.present === 1;
            if (morning)
                morningPresentToday++;
            if (evening)
                eveningPresentToday++;
            const presentSessions = (morning ? 1 : 0) + (evening ? 1 : 0);
            if (presentSessions === 2)
                presentTodayFull++;
            else if (presentSessions === 1)
                presentTodayPartial++;
            else
                absentToday++;
        }
        const totalActiveEmployees = employees.length;
        const presentTodayTotal = presentTodayFull + presentTodayPartial;
        const expectedTodaySessions = totalActiveEmployees * 2;
        const actualTodaySessions = morningPresentToday + eveningPresentToday;
        const todayRate = totalActiveEmployees > 0 && expectedTodaySessions > 0
            ? Math.round((actualTodaySessions / expectedTodaySessions) * 1000) / 10
            : 0;
        let monthlyRecQuery = `
      SELECT ar.present, ar.session, ar.date, ar.employee_id
      FROM attendance_records ar
      JOIN employees e ON ar.employee_id = e.id
      WHERE e.active = 1 AND ar.date LIKE ?
    `;
        const monthlyParams = [`${targetMonth}%`];
        if (branch && branch !== 'all') {
            monthlyRecQuery += ' AND e.branch_id = ?';
            monthlyParams.push(branch);
        }
        const monthlyRecords = db_1.db.prepare(monthlyRecQuery).all(...monthlyParams);
        let monthlyPresentSessions = 0;
        let monthlyMorningPresent = 0;
        let monthlyEveningPresent = 0;
        let monthlyMorningExpected = 0;
        let monthlyEveningExpected = 0;
        const distinctDates = Array.from(new Set(monthlyRecords.map(r => r.date)));
        // For expected sessions, count working days up to max logged date if current month
        const maxDateInMonth = distinctDates.filter(d => {
            const dayHasPresent = monthlyRecords.some(r => r.date === d && r.present === 1);
            return dayHasPresent || d <= targetDate;
        });
        const activeDatesForExpected = maxDateInMonth.length > 0 ? maxDateInMonth : distinctDates;
        for (const d of activeDatesForExpected) {
            const dayInfo = attendanceEngine_1.attendanceEngine.isNonWorkingDay(d);
            if (!dayInfo.isHoliday && !dayInfo.isWeekend) {
                monthlyMorningExpected += totalActiveEmployees;
                monthlyEveningExpected += totalActiveEmployees;
            }
        }
        for (const r of monthlyRecords) {
            if (r.present === 1) {
                monthlyPresentSessions++;
                if (r.session === 'morning')
                    monthlyMorningPresent++;
                if (r.session === 'evening')
                    monthlyEveningPresent++;
            }
        }
        const monthlyTotalExpected = monthlyMorningExpected + monthlyEveningExpected;
        const monthlyRate = monthlyTotalExpected > 0
            ? Math.round((monthlyPresentSessions / monthlyTotalExpected) * 1000) / 10
            : 0;
        let exceptionsCount = 0;
        for (const emp of employees) {
            const empMonthlyRecs = monthlyRecords.filter(r => r.employee_id === emp.id);
            const empPresent = empMonthlyRecs.filter(r => r.present === 1).length;
            const empExpected = activeDatesForExpected.filter(d => {
                const info = attendanceEngine_1.attendanceEngine.isNonWorkingDay(d, emp.branch_id);
                return !info.isHoliday && !info.isWeekend;
            }).length * 2;
            const empRate = empExpected > 0 ? (empPresent / empExpected) * 100 : 100;
            if (empRate < 75) {
                exceptionsCount++;
            }
        }
        const lastSyncLog = db_1.db.prepare('SELECT timestamp FROM sync_logs ORDER BY timestamp DESC LIMIT 1').get();
        const activeBranches = db_1.db.prepare('SELECT COUNT(*) as count FROM branches WHERE active = 1').get();
        const kpis = {
            totalEmployees: totalActiveEmployees,
            presentToday: presentTodayTotal,
            presentTodayFull,
            presentTodayPartial,
            absentToday,
            todayAttendanceRate: isNonWorking.isHoliday || isNonWorking.isWeekend ? 100 : todayRate,
            monthlyAttendanceRate: monthlyRate,
            morningSessions: {
                present: monthlyMorningPresent,
                expected: monthlyMorningExpected,
                rate: monthlyMorningExpected > 0 ? Math.round((monthlyMorningPresent / monthlyMorningExpected) * 1000) / 10 : 0,
            },
            eveningSessions: {
                present: monthlyEveningPresent,
                expected: monthlyEveningExpected,
                rate: monthlyEveningExpected > 0 ? Math.round((monthlyEveningPresent / monthlyEveningExpected) * 1000) / 10 : 0,
            },
            workLogs: {
                submitted: workLogsCount,
                missing: totalActiveEmployees - workLogsCount,
                rate: totalActiveEmployees > 0 ? Math.round((workLogsCount / totalActiveEmployees) * 1000) / 10 : 0,
            },
            attendanceExceptions: exceptionsCount,
            targetDate,
            targetMonth,
            isNonWorkingDay: isNonWorking.isHoliday || isNonWorking.isWeekend,
            holidayName: isNonWorking.holidayName,
            lastSyncTime: lastSyncLog?.timestamp,
            activeBranchesCount: activeBranches.count,
        };
        res.json(kpis);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDashboardOverview = getDashboardOverview;
const getDashboardCharts = (req, res) => {
    try {
        const { branch, month } = req.query;
        const latestActiveDateRow = db_1.db.prepare(`
      SELECT MAX(date) as maxDate 
      FROM attendance_records 
      WHERE present = 1
    `).get();
        const targetMonth = month || latestActiveDateRow?.maxDate?.substring(0, 7) || '2026-10';
        let trendQuery = `
      SELECT 
        ar.date,
        COUNT(CASE WHEN ar.session = 'morning' AND ar.present = 1 THEN 1 END) as morning_present,
        COUNT(CASE WHEN ar.session = 'morning' THEN 1 END) as morning_total,
        COUNT(CASE WHEN ar.session = 'evening' AND ar.present = 1 THEN 1 END) as evening_present,
        COUNT(CASE WHEN ar.session = 'evening' THEN 1 END) as evening_total,
        COUNT(CASE WHEN ar.present = 1 THEN 1 END) as total_present,
        COUNT(ar.id) as total_sessions
      FROM attendance_records ar
      JOIN employees e ON ar.employee_id = e.id
      WHERE e.active = 1
    `;
        const trendParams = [];
        if (month && month !== 'all') {
            trendQuery += ' AND ar.date LIKE ?';
            trendParams.push(`${month}%`);
        }
        if (branch && branch !== 'all') {
            trendQuery += ' AND ar.branch_id = ?';
            trendParams.push(branch);
        }
        trendQuery += ' GROUP BY ar.date ORDER BY ar.date ASC';
        const trendRows = db_1.db.prepare(trendQuery).all(...trendParams);
        const trendData = trendRows.map(r => {
            const dayInfo = attendanceEngine_1.attendanceEngine.isNonWorkingDay(r.date);
            const mRate = r.morning_total > 0 ? Math.round((r.morning_present / r.morning_total) * 1000) / 10 : 0;
            const eRate = r.evening_total > 0 ? Math.round((r.evening_present / r.evening_total) * 1000) / 10 : 0;
            const overallRate = r.total_sessions > 0 ? Math.round((r.total_present / r.total_sessions) * 1000) / 10 : 0;
            return {
                date: r.date,
                shortDate: r.date.substring(5),
                attendanceRate: dayInfo.isHoliday || dayInfo.isWeekend ? null : overallRate,
                morningRate: dayInfo.isHoliday || dayInfo.isWeekend ? null : mRate,
                eveningRate: dayInfo.isHoliday || dayInfo.isWeekend ? null : eRate,
                morningPresent: r.morning_present,
                eveningPresent: r.evening_present,
                totalPresent: r.total_present,
                isHoliday: dayInfo.isHoliday,
                isWeekend: dayInfo.isWeekend,
                holidayName: dayInfo.holidayName,
            };
        });
        const branches = db_1.db.prepare('SELECT * FROM branches WHERE active = 1').all();
        const branchComparison = [];
        for (const b of branches) {
            const emps = db_1.db.prepare('SELECT id, work_link FROM employees WHERE branch_id = ? AND active = 1').all(b.id);
            const empCount = emps.length;
            const workLogsSubmitted = emps.filter(e => e.work_link && e.work_link.trim().length > 0).length;
            const branchRecs = db_1.db.prepare(`
        SELECT present, session 
        FROM attendance_records 
        WHERE branch_id = ? AND date LIKE ?
      `).all(b.id, `${month}%`);
            const present = branchRecs.filter(r => r.present === 1).length;
            const total = branchRecs.length;
            const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
            branchComparison.push({
                branchId: b.id,
                branchName: b.name,
                code: b.code,
                employeeCount: empCount,
                attendanceRate: rate,
                presentSessions: present,
                totalSessions: total,
                workLogRate: empCount > 0 ? Math.round((workLogsSubmitted / empCount) * 1000) / 10 : 0,
                status: attendanceEngine_1.attendanceEngine.getRating(rate),
            });
        }
        const distributionCounts = {
            'Excellent': 0,
            'Good': 0,
            'Needs Review': 0,
            'Review': 0,
        };
        let allEmployeesQuery = 'SELECT id, branch_id FROM employees WHERE active = 1';
        const allEmpParams = [];
        if (branch && branch !== 'all') {
            allEmployeesQuery += ' AND branch_id = ?';
            allEmpParams.push(branch);
        }
        const activeEmps = db_1.db.prepare(allEmployeesQuery).all(...allEmpParams);
        for (const emp of activeEmps) {
            const empRecs = db_1.db.prepare('SELECT present FROM attendance_records WHERE employee_id = ? AND date LIKE ?').all(emp.id, `${month}%`);
            const p = empRecs.filter(r => r.present === 1).length;
            const t = empRecs.length;
            const empRate = t > 0 ? (p / t) * 100 : 100;
            const rating = attendanceEngine_1.attendanceEngine.getRating(empRate);
            if (distributionCounts[rating] !== undefined) {
                distributionCounts[rating]++;
            }
            else {
                distributionCounts['Review']++;
            }
        }
        const distribution = [
            { name: 'Excellent (90-100%)', count: distributionCounts['Excellent'], color: '#10b981' },
            { name: 'Good (75-89%)', count: distributionCounts['Good'], color: '#0284c7' },
            { name: 'Needs Review (60-74%)', count: distributionCounts['Needs Review'], color: '#f59e0b' },
            { name: 'Review (<60%)', count: distributionCounts['Review'], color: '#ef4444' },
        ];
        let heatmapEmpQuery = 'SELECT e.id, e.name, e.designation, b.name as branch_name, e.branch_id FROM employees e JOIN branches b ON e.branch_id = b.id WHERE e.active = 1';
        const heatmapEmpParams = [];
        if (branch && branch !== 'all') {
            heatmapEmpQuery += ' AND e.branch_id = ?';
            heatmapEmpParams.push(branch);
        }
        heatmapEmpQuery += ' ORDER BY b.name ASC, e.name ASC';
        const heatmapEmployees = db_1.db.prepare(heatmapEmpQuery).all(...heatmapEmpParams);
        const dateListQuery = `
      SELECT DISTINCT date 
      FROM attendance_records 
      WHERE date LIKE ? 
      ORDER BY date ASC
    `;
        const dateRows = db_1.db.prepare(dateListQuery).all(`${month}%`);
        const heatmapDays = dateRows.map(r => r.date);
        const heatmapRows = heatmapEmployees.map(emp => {
            const empRecords = db_1.db.prepare(`
        SELECT date, session, present, entry_time 
        FROM attendance_records 
        WHERE employee_id = ? AND date LIKE ?
      `).all(emp.id, `${month}%`);
            const daysData = {};
            for (const d of heatmapDays) {
                const morningRec = empRecords.find(r => r.date === d && r.session === 'morning');
                const eveningRec = empRecords.find(r => r.date === d && r.session === 'evening');
                const morning = morningRec?.present === 1;
                const evening = eveningRec?.present === 1;
                const morningTime = morning ? (morningRec?.entry_time || '09:30 AM') : null;
                const eveningTime = evening ? (eveningRec?.entry_time || '05:30 PM') : null;
                const dayInfo = attendanceEngine_1.attendanceEngine.isNonWorkingDay(d, emp.branch_id);
                let cellStatus = 'absent';
                if (dayInfo.isHoliday) {
                    cellStatus = 'holiday';
                }
                else if (dayInfo.isWeekend) {
                    cellStatus = 'weekend';
                }
                else {
                    const presentCount = (morning ? 1 : 0) + (evening ? 1 : 0);
                    if (presentCount === 2)
                        cellStatus = 'present';
                    else if (presentCount === 1)
                        cellStatus = 'partial';
                    else
                        cellStatus = 'absent';
                }
                daysData[d] = {
                    date: d,
                    status: cellStatus,
                    morning,
                    morningTime,
                    evening,
                    eveningTime,
                    holidayName: dayInfo.holidayName,
                };
            }
            return {
                employeeId: emp.id,
                employeeName: emp.name,
                designation: emp.designation,
                branchName: emp.branch_name,
                days: daysData,
            };
        });
        res.json({
            trendData,
            branchComparison,
            distribution,
            heatmap: {
                days: heatmapDays,
                rows: heatmapRows,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDashboardCharts = getDashboardCharts;
const getNetworkOverview = (req, res) => {
    try {
        const { month = '2026-09', date } = req.query;
        const latestDateRow = db_1.db.prepare('SELECT MAX(date) as maxDate FROM attendance_records').get();
        const targetDate = date || latestDateRow?.maxDate || new Date().toISOString().split('T')[0];
        const branches = db_1.db.prepare('SELECT * FROM branches WHERE active = 1 ORDER BY name ASC').all();
        const rows = [];
        let grandTotalEmployees = 0;
        let grandTodayMorning = 0;
        let grandTodayEvening = 0;
        let grandTodayPossible = 0;
        let grandTodayPresent = 0;
        let grandMonthlyPresent = 0;
        let grandMonthlyPossible = 0;
        let grandWorkLogs = 0;
        for (const b of branches) {
            const emps = db_1.db.prepare('SELECT id, work_link FROM employees WHERE branch_id = ? AND active = 1').all(b.id);
            const empCount = emps.length;
            grandTotalEmployees += empCount;
            const workLogsSubmitted = emps.filter(e => e.work_link && e.work_link.trim().length > 0).length;
            grandWorkLogs += workLogsSubmitted;
            const todayRecs = db_1.db.prepare(`
        SELECT session, present 
        FROM attendance_records 
        WHERE branch_id = ? AND date = ?
      `).all(b.id, targetDate);
            const todayM = todayRecs.filter(r => r.session === 'morning' && r.present === 1).length;
            const todayE = todayRecs.filter(r => r.session === 'evening' && r.present === 1).length;
            const todayPresentSessions = todayM + todayE;
            const todayPossibleSessions = empCount * 2;
            grandTodayMorning += todayM;
            grandTodayEvening += todayE;
            grandTodayPresent += todayPresentSessions;
            grandTodayPossible += todayPossibleSessions;
            const todayRate = todayPossibleSessions > 0 ? Math.round((todayPresentSessions / todayPossibleSessions) * 1000) / 10 : 0;
            const monthlyRecs = db_1.db.prepare(`
        SELECT present, session 
        FROM attendance_records 
        WHERE branch_id = ? AND date LIKE ?
      `).all(b.id, `${month}%`);
            const monthlyPresent = monthlyRecs.filter(r => r.present === 1).length;
            const monthlyPossible = monthlyRecs.length;
            grandMonthlyPresent += monthlyPresent;
            grandMonthlyPossible += monthlyPossible;
            const monthlyRate = monthlyPossible > 0 ? Math.round((monthlyPresent / monthlyPossible) * 1000) / 10 : 0;
            rows.push({
                branchId: b.id,
                branchName: b.name,
                code: b.code,
                spreadsheetId: b.spreadsheet_id,
                employees: empCount,
                todayMorning: `${todayM} / ${empCount}`,
                todayEvening: `${todayE} / ${empCount}`,
                todayRate,
                monthlyPresent,
                monthlyPossible,
                monthlyRate,
                workLogs: `${workLogsSubmitted} / ${empCount} (${empCount > 0 ? Math.round((workLogsSubmitted / empCount) * 100) : 0}%)`,
                status: attendanceEngine_1.attendanceEngine.getRating(monthlyRate),
            });
        }
        const networkTodayRate = grandTodayPossible > 0 ? Math.round((grandTodayPresent / grandTodayPossible) * 1000) / 10 : 0;
        const networkMonthlyRate = grandMonthlyPossible > 0 ? Math.round((grandMonthlyPresent / grandMonthlyPossible) * 1000) / 10 : 0;
        const networkSummary = {
            branchName: 'NETWORK GRAND TOTAL',
            employees: grandTotalEmployees,
            todayMorning: `${grandTodayMorning} / ${grandTotalEmployees}`,
            todayEvening: `${grandTodayEvening} / ${grandTotalEmployees}`,
            todayRate: networkTodayRate,
            monthlyPresent: grandMonthlyPresent,
            monthlyPossible: grandMonthlyPossible,
            monthlyRate: networkMonthlyRate,
            workLogs: `${grandWorkLogs} / ${grandTotalEmployees} (${grandTotalEmployees > 0 ? Math.round((grandWorkLogs / grandTotalEmployees) * 100) : 0}%)`,
            status: attendanceEngine_1.attendanceEngine.getRating(networkMonthlyRate),
        };
        res.json({
            branches: rows,
            networkTotal: networkSummary,
            targetMonth: month,
            targetDate,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getNetworkOverview = getNetworkOverview;
