import { Router } from 'express';
import { getDashboardOverview, getDashboardCharts, getNetworkOverview, getAvailableDatesMeta } from '../controllers/dashboardController';
import { getEmployees, getEmployeeById } from '../controllers/employeeController';
import { getDailyAttendance, getMonthlyAttendance } from '../controllers/attendanceController';
import { getBranches, getBranchById } from '../controllers/branchController';
import { getEmployeeReport, getMonthlyReport, getAttendanceExceptions, getWorkLogReport } from '../controllers/reportsController';
import { getSyncStatus, triggerSyncAll, triggerSyncBranch, getSyncLogs } from '../controllers/syncController';
import { getRules, updateRules, getHolidays, addHoliday, deleteHoliday } from '../controllers/settingsController';

const router = Router();

// Metadata & Dates
router.get('/meta/dates', getAvailableDatesMeta);

// Dashboard & Network Overview
router.get('/dashboard', getDashboardOverview);
router.get('/dashboard/charts', getDashboardCharts);
router.get('/dashboard/network', getNetworkOverview);

// Employees
router.get('/employees', getEmployees);
router.get('/employees/:id', getEmployeeById);

// Attendance
router.get('/attendance/daily', getDailyAttendance);
router.get('/attendance/monthly', getMonthlyAttendance);

// Branches
router.get('/branches', getBranches);
router.get('/branches/:id', getBranchById);

// Reports
router.get('/reports/employee/:id', getEmployeeReport);
router.get('/reports/monthly', getMonthlyReport);
router.get('/reports/exceptions', getAttendanceExceptions);
router.get('/reports/worklogs', getWorkLogReport);

// Sync
router.get('/sync/status', getSyncStatus);
router.post('/sync', triggerSyncAll);
router.post('/sync/:branchId', triggerSyncBranch);
router.get('/sync/logs', getSyncLogs);

// Settings & Rules
router.get('/rules', getRules);
router.put('/rules', updateRules);
router.get('/holidays', getHolidays);
router.post('/holidays', addHoliday);
router.delete('/holidays/:id', deleteHoliday);

export default router;
