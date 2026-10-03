import {
  Branch,
  Employee,
  DailyAttendanceRecord,
  DashboardKPIs,
  TrendItem,
  BranchComparisonItem,
  DistributionItem,
  HeatmapData,
  NetworkOverviewData,
  SyncLog,
  AttendanceRule,
  Holiday,
} from '../types';

export const fallbackBranches: Branch[] = [
  { id: 'madurai', name: 'Madurai', code: 'MDU', spreadsheetId: '1qLgY-eBlt9T24ZqZiW3eEWBeAn5YH_2_z_vOAgNcFhY', color: '#0284c7', employeeCount: 2 },
  { id: 'nmc-trichy', name: 'NMC - Trichy', code: 'NMC', spreadsheetId: '15aUhYRFEffhYH9H5M4750hXjFnRZsQBUg_iYJTFbqyQ', color: '#10b981', employeeCount: 3 },
  { id: 'vivekanandha', name: 'Vivekanandha College - Thiruchengode', code: 'VIV', spreadsheetId: '1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw', color: '#8b5cf6', employeeCount: 4 },
  { id: 'others', name: 'Others', code: 'OTH', spreadsheetId: '1gUb-EcjozvMD_YPvUhcD1fZt757sN7JeHT89Sbtx2vI', color: '#f59e0b', employeeCount: 3 },
];

export const fallbackEmployees: Employee[] = [
  { id: 'madurai_abdul_wahid_s', employeeCode: 'ARCS-MDU-01', name: 'ABDUL WAHID S', designation: 'Senior Associate', reportingTo: 'Operations Head', branchId: 'madurai', branchName: 'Madurai', branchCode: 'MDU', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1qLgY-eBlt9T24ZqZiW3eEWBeAn5YH_2_z_vOAgNcFhY', presentSessions: 42, totalSessions: 46, attendanceRate: 91.3, statusRating: 'Excellent', hasWorkLog: true },
  { id: 'madurai_abdul_azees', employeeCode: 'ARCS-MDU-02', name: 'Abdul Azees', designation: 'Associate', reportingTo: 'ABDUL WAHID S', branchId: 'madurai', branchName: 'Madurai', branchCode: 'MDU', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1qLgY-eBlt9T24ZqZiW3eEWBeAn5YH_2_z_vOAgNcFhY', presentSessions: 40, totalSessions: 46, attendanceRate: 87.0, statusRating: 'Good', hasWorkLog: true },
  { id: 'nmc_trichy_nithya', employeeCode: 'ARCS-NMC-01', name: 'Nithya', designation: 'Junior Developer', reportingTo: 'Saranya', branchId: 'nmc-trichy', branchName: 'NMC - Trichy', branchCode: 'NMC', active: true, workLink: 'https://docs.google.com/spreadsheets/d/15aUhYRFEffhYH9H5M4750hXjFnRZsQBUg_iYJTFbqyQ', presentSessions: 44, totalSessions: 46, attendanceRate: 95.7, statusRating: 'Excellent', hasWorkLog: true },
  { id: 'nmc_trichy_janani', employeeCode: 'ARCS-NMC-02', name: 'Janani', designation: 'Associate Developer', reportingTo: 'Saranya', branchId: 'nmc-trichy', branchName: 'NMC - Trichy', branchCode: 'NMC', active: true, workLink: 'https://docs.google.com/spreadsheets/d/15aUhYRFEffhYH9H5M4750hXjFnRZsQBUg_iYJTFbqyQ', presentSessions: 41, totalSessions: 46, attendanceRate: 89.1, statusRating: 'Good', hasWorkLog: true },
  { id: 'nmc_trichy_anusha_r', employeeCode: 'ARCS-NMC-03', name: 'ANUSHA R', designation: 'Web Specialist', reportingTo: 'Saranya', branchId: 'nmc-trichy', branchName: 'NMC - Trichy', branchCode: 'NMC', active: true, workLink: 'https://docs.google.com/spreadsheets/d/15aUhYRFEffhYH9H5M4750hXjFnRZsQBUg_iYJTFbqyQ', presentSessions: 43, totalSessions: 46, attendanceRate: 93.5, statusRating: 'Excellent', hasWorkLog: true },
  { id: 'vivekanandha_deena_sherin_n', employeeCode: 'ARCS-VIV-01', name: 'DEENA SHERIN N', designation: 'Associate', reportingTo: 'UDHAYA NILA S', branchId: 'vivekanandha', branchName: 'Vivekanandha College - Thiruchengode', branchCode: 'VIV', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw', presentSessions: 39, totalSessions: 46, attendanceRate: 84.8, statusRating: 'Good', hasWorkLog: true },
  { id: 'vivekanandha_mathumathi_k', employeeCode: 'ARCS-VIV-02', name: 'MATHUMATHI K', designation: 'Executive', reportingTo: 'UDHAYA NILA S', branchId: 'vivekanandha', branchName: 'Vivekanandha College - Thiruchengode', branchCode: 'VIV', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw', presentSessions: 42, totalSessions: 46, attendanceRate: 91.3, statusRating: 'Excellent', hasWorkLog: true },
  { id: 'vivekanandha_priyadharshini_r', employeeCode: 'ARCS-VIV-03', name: 'PRIYADHARSHINI R', designation: 'Developer', reportingTo: 'UDHAYA NILA S', branchId: 'vivekanandha', branchName: 'Vivekanandha College - Thiruchengode', branchCode: 'VIV', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw', presentSessions: 45, totalSessions: 46, attendanceRate: 97.8, statusRating: 'Excellent', hasWorkLog: true },
  { id: 'vivekanandha_udhaya_nila_s', employeeCode: 'ARCS-VIV-04', name: 'UDHAYA NILA S', designation: 'Lead Specialist', reportingTo: 'Raj Kishore S', branchId: 'vivekanandha', branchName: 'Vivekanandha College - Thiruchengode', branchCode: 'VIV', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw', presentSessions: 46, totalSessions: 46, attendanceRate: 100.0, statusRating: 'Excellent', hasWorkLog: true },
  { id: 'others_kalaimagal_s', employeeCode: 'ARCS-OTH-01', name: 'KALAIMAGAL S', designation: 'Coordinator', reportingTo: 'Raj Kishore S', branchId: 'others', branchName: 'Others', branchCode: 'OTH', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1gUb-EcjozvMD_YPvUhcD1fZt757sN7JeHT89Sbtx2vI', presentSessions: 40, totalSessions: 46, attendanceRate: 87.0, statusRating: 'Good', hasWorkLog: true },
  { id: 'others_raj_kishore_s', employeeCode: 'ARCS-OTH-02', name: 'Raj Kishore S', designation: 'Technical Lead', reportingTo: 'Director', branchId: 'others', branchName: 'Others', branchCode: 'OTH', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1gUb-EcjozvMD_YPvUhcD1fZt757sN7JeHT89Sbtx2vI', presentSessions: 46, totalSessions: 46, attendanceRate: 100.0, statusRating: 'Excellent', hasWorkLog: true },
  { id: 'others_saranya', employeeCode: 'ARCS-OTH-03', name: 'Saranya', designation: 'Operations Executive', reportingTo: 'Director', branchId: 'others', branchName: 'Others', branchCode: 'OTH', active: true, workLink: 'https://docs.google.com/spreadsheets/d/1gUb-EcjozvMD_YPvUhcD1fZt757sN7JeHT89Sbtx2vI', presentSessions: 44, totalSessions: 46, attendanceRate: 95.7, statusRating: 'Excellent', hasWorkLog: true },
];

export const fallbackDatesMeta = {
  availableMonths: ['2026-10', '2026-09'],
  latestLoggedDate: '2026-10-03',
  currentMonth: '2026-10',
  availableDates: [
    '2026-10-03', '2026-10-02', '2026-10-01',
    '2026-09-30', '2026-09-29', '2026-09-28', '2026-09-27', '2026-09-26', '2026-09-25',
    '2026-09-24', '2026-09-23', '2026-09-22', '2026-09-21', '2026-09-20', '2026-09-19',
    '2026-09-18', '2026-09-17', '2026-09-16', '2026-09-15', '2026-09-14', '2026-09-13',
    '2026-09-12', '2026-09-11', '2026-09-10', '2026-09-09', '2026-09-08', '2026-09-07',
    '2026-09-06', '2026-09-05', '2026-09-04', '2026-09-03', '2026-09-02', '2026-09-01'
  ],
};

export const fallbackDashboardKPIs: DashboardKPIs = {
  totalEmployees: 12,
  presentToday: 12,
  presentTodayFull: 10,
  presentTodayPartial: 2,
  absentToday: 0,
  todayAttendanceRate: 91.7,
  monthlyAttendanceRate: 92.4,
  morningSessions: { present: 12, expected: 12, rate: 100 },
  eveningSessions: { present: 10, expected: 12, rate: 83.3 },
  workLogs: { submitted: 12, missing: 0, rate: 100 },
  attendanceExceptions: 0,
  targetDate: '2026-10-03',
  targetMonth: '2026-10',
  activeBranchesCount: 4,
};

export const fallbackCharts = {
  trendData: [
    { date: '2026-10-01', shortDate: '10-01', attendanceRate: 95.8, morningRate: 100, eveningRate: 91.7, morningPresent: 12, eveningPresent: 11, totalPresent: 23 },
    { date: '2026-10-02', shortDate: '10-02', attendanceRate: null, morningRate: null, eveningRate: null, morningPresent: 0, eveningPresent: 0, totalPresent: 0, isHoliday: true, holidayName: 'Gandhi Jayanti' },
    { date: '2026-10-03', shortDate: '10-03', attendanceRate: 91.7, morningRate: 100, eveningRate: 83.3, morningPresent: 12, eveningPresent: 10, totalPresent: 22 },
  ],
  branchComparison: [
    { branchId: 'others', branchName: 'Others', code: 'OTH', employeeCount: 3, attendanceRate: 94.2, presentSessions: 130, totalSessions: 138, workLogRate: 100, status: 'Excellent' as const },
    { branchId: 'vivekanandha', branchName: 'Vivekanandha College - Thiruchengode', code: 'VIV', employeeCount: 4, attendanceRate: 93.5, presentSessions: 172, totalSessions: 184, workLogRate: 100, status: 'Excellent' as const },
    { branchId: 'nmc-trichy', branchName: 'NMC - Trichy', code: 'NMC', employeeCount: 3, attendanceRate: 92.8, presentSessions: 128, totalSessions: 138, workLogRate: 100, status: 'Excellent' as const },
    { branchId: 'madurai', branchName: 'Madurai', code: 'MDU', employeeCount: 2, attendanceRate: 89.1, presentSessions: 82, totalSessions: 92, workLogRate: 100, status: 'Good' as const },
  ],
  distribution: [
    { name: 'Excellent (≥90%)', count: 9, color: '#10b981' },
    { name: 'Good (75-89%)', count: 3, color: '#0284c7' },
    { name: 'Needs Review (60-74%)', count: 0, color: '#f59e0b' },
    { name: 'Critical (<60%)', count: 0, color: '#ef4444' },
  ],
  heatmap: {
    days: ['2026-10-01', '2026-10-02', '2026-10-03'],
    rows: fallbackEmployees.map(e => ({
      employeeId: e.id,
      employeeName: e.name,
      designation: e.designation || 'Specialist',
      branchName: e.branchName || 'Main',
      days: {
        '2026-10-01': { date: '2026-10-01', status: 'present' as const, morning: true, morningTime: '09:12 AM', evening: true, eveningTime: '06:30 PM' },
        '2026-10-02': { date: '2026-10-02', status: 'holiday' as const, morning: false, evening: false, holidayName: 'Gandhi Jayanti' },
        '2026-10-03': { date: '2026-10-03', status: 'present' as const, morning: true, morningTime: '09:05 AM', evening: true, eveningTime: '06:15 PM' },
      },
    })),
  },
};

export const fallbackNetworkOverview: NetworkOverviewData = {
  branches: [
    { branchId: 'madurai', branchName: 'Madurai', code: 'MDU', spreadsheetId: '1qLgY-eBlt9T24ZqZiW3eEWBeAn5YH_2_z_vOAgNcFhY', employees: 2, todayMorning: '2 / 2', todayEvening: '2 / 2', todayRate: 100, monthlyPresent: 82, monthlyPossible: 92, monthlyRate: 89.1, workLogs: '2 / 2', status: 'Good' },
    { branchId: 'nmc-trichy', branchName: 'NMC - Trichy', code: 'NMC', spreadsheetId: '15aUhYRFEffhYH9H5M4750hXjFnRZsQBUg_iYJTFbqyQ', employees: 3, todayMorning: '3 / 3', todayEvening: '2 / 3', todayRate: 83.3, monthlyPresent: 128, monthlyPossible: 138, monthlyRate: 92.8, workLogs: '3 / 3', status: 'Excellent' },
    { branchId: 'vivekanandha', branchName: 'Vivekanandha College - Thiruchengode', code: 'VIV', spreadsheetId: '1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw', employees: 4, todayMorning: '4 / 4', todayEvening: '3 / 4', todayRate: 87.5, monthlyPresent: 172, monthlyPossible: 184, monthlyRate: 93.5, workLogs: '4 / 4', status: 'Excellent' },
    { branchId: 'others', branchName: 'Others', code: 'OTH', spreadsheetId: '1gUb-EcjozvMD_YPvUhcD1fZt757sN7JeHT89Sbtx2vI', employees: 3, todayMorning: '3 / 3', todayEvening: '3 / 3', todayRate: 100, monthlyPresent: 130, monthlyPossible: 138, monthlyRate: 94.2, workLogs: '3 / 3', status: 'Excellent' },
  ],
  networkTotal: {
    branchId: 'all',
    branchName: 'Network Total',
    code: 'ALL',
    spreadsheetId: '',
    employees: 12,
    todayMorning: '12 / 12',
    todayEvening: '10 / 12',
    todayRate: 91.7,
    monthlyPresent: 512,
    monthlyPossible: 552,
    monthlyRate: 92.8,
    workLogs: '12 / 12',
    status: 'Excellent',
  },
  targetMonth: '2026-10',
  targetDate: '2026-10-03',
};
