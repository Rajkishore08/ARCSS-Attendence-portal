"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const employeeController_1 = require("../controllers/employeeController");
const attendanceController_1 = require("../controllers/attendanceController");
const branchController_1 = require("../controllers/branchController");
const reportsController_1 = require("../controllers/reportsController");
const syncController_1 = require("../controllers/syncController");
const settingsController_1 = require("../controllers/settingsController");
const router = (0, express_1.Router)();
// Metadata & Dates
router.get('/meta/dates', dashboardController_1.getAvailableDatesMeta);
// Dashboard & Network Overview
router.get('/dashboard', dashboardController_1.getDashboardOverview);
router.get('/dashboard/charts', dashboardController_1.getDashboardCharts);
router.get('/dashboard/network', dashboardController_1.getNetworkOverview);
// Employees
router.get('/employees', employeeController_1.getEmployees);
router.get('/employees/:id', employeeController_1.getEmployeeById);
// Attendance
router.get('/attendance/daily', attendanceController_1.getDailyAttendance);
router.get('/attendance/monthly', attendanceController_1.getMonthlyAttendance);
// Branches
router.get('/branches', branchController_1.getBranches);
router.get('/branches/:id', branchController_1.getBranchById);
// Reports
router.get('/reports/employee/:id', reportsController_1.getEmployeeReport);
router.get('/reports/monthly', reportsController_1.getMonthlyReport);
router.get('/reports/exceptions', reportsController_1.getAttendanceExceptions);
router.get('/reports/worklogs', reportsController_1.getWorkLogReport);
// Sync
router.get('/sync/status', syncController_1.getSyncStatus);
router.post('/sync', syncController_1.triggerSyncAll);
router.post('/sync/:branchId', syncController_1.triggerSyncBranch);
router.get('/sync/logs', syncController_1.getSyncLogs);
// Settings & Rules
router.get('/rules', settingsController_1.getRules);
router.put('/rules', settingsController_1.updateRules);
router.get('/holidays', settingsController_1.getHolidays);
router.post('/holidays', settingsController_1.addHoliday);
router.delete('/holidays/:id', settingsController_1.deleteHoliday);
exports.default = router;
