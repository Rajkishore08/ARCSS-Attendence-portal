export type SessionType = 'morning' | 'evening';
export type DailyStatus = 'full' | 'partial' | 'absent' | 'holiday' | 'weekend' | 'off';
export type AttendanceRating = 'Excellent' | 'Good' | 'Needs Review' | 'Review';
export type UserRole = 'admin' | 'hr' | 'branch_manager' | 'employee';

export interface Branch {
  id: string;
  name: string;
  code: string;
  spreadsheetId: string;
  sheetName?: string;
  color?: string;
  active: boolean;
}

export interface Employee {
  id: string;
  employeeCode?: string;
  name: string;
  designation?: string;
  reportingTo?: string;
  branchId: string;
  branchName?: string;
  workLink?: string;
  active: boolean;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  joinedDate?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  session: SessionType;
  present: boolean;
  entryTime?: string | null;
  sourceSpreadsheetId: string;
  updatedAt?: string;
}

export interface DailyAttendance {
  employeeId: string;
  employeeName: string;
  designation?: string;
  reportingTo?: string;
  branchId: string;
  branchName: string;
  workLink?: string;
  date: string; // YYYY-MM-DD
  dayName?: string;
  morning: boolean | null;
  morningTime?: string | null;
  evening: boolean | null;
  eveningTime?: string | null;
  totalPresentSessions: number;
  totalPossibleSessions: number;
  attendanceRate: number;
  status: DailyStatus;
  rating?: AttendanceRating;
  isHoliday?: boolean;
  isWeekend?: boolean;
  holidayName?: string;
}

export interface EmployeeMonthlySummary {
  employeeId: string;
  employeeName: string;
  designation?: string;
  reportingTo?: string;
  branchId: string;
  branchName: string;
  workLink?: string;
  month: string; // YYYY-MM
  workingDays: number;
  presentDays: number;
  absentDays: number;
  partialDays: number;
  holidayDays: number;
  morningSessions: number;
  eveningSessions: number;
  presentSessions: number;
  totalSessions: number;
  attendanceRate: number;
  statusRating: AttendanceRating;
  workLogsSubmitted: number;
  workLogsRate: number;
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  branchId?: string | null; // null for company-wide
}

export interface AttendanceRule {
  id: string;
  name: AttendanceRating;
  minPercentage: number;
  maxPercentage: number;
  color: string;
  description: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  branchId?: string | null;
  branchName?: string;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  durationMs: number;
  employeesProcessed: number;
  attendanceRecordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsRemoved: number;
  errorMessage?: string | null;
}

export interface DashboardKPIs {
  totalEmployees: number;
  presentToday: number;
  presentTodayPartial: number;
  absentToday: number;
  todayAttendanceRate: number;
  monthlyAttendanceRate: number;
  morningSessions: { present: number; expected: number; rate: number };
  eveningSessions: { present: number; expected: number; rate: number };
  workLogs: { submitted: number; missing: number; rate: number };
  attendanceExceptions: number;
  lastSyncTime?: string;
  activeBranchesCount: number;
}

export interface BranchComparison {
  branchId: string;
  branchName: string;
  employeeCount: number;
  todayRate: number;
  monthlyRate: number;
  presentSessions: number;
  totalSessions: number;
  workLogRate: number;
  status: string;
}
