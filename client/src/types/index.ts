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
  employeeCount?: number;
  lastSync?: {
    timestamp: string;
    status: string;
    durationMs: number;
  } | null;
}

export interface Employee {
  id: string;
  employeeCode?: string;
  name: string;
  designation?: string;
  reportingTo?: string;
  branchId: string;
  branchName?: string;
  branchCode?: string;
  workLink?: string;
  active: boolean;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  joinedDate?: string;
  presentSessions?: number;
  totalSessions?: number;
  attendanceRate?: number;
  statusRating?: AttendanceRating;
  hasWorkLog?: boolean;
}

export interface DailyAttendanceRecord {
  employeeId: string;
  employeeName: string;
  designation?: string;
  reportingTo?: string;
  branchId: string;
  branchName: string;
  workLink?: string;
  date: string;
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

export interface DashboardKPIs {
  totalEmployees: number;
  presentToday: number;
  presentTodayFull: number;
  presentTodayPartial: number;
  absentToday: number;
  todayAttendanceRate: number;
  monthlyAttendanceRate: number;
  morningSessions: { present: number; expected: number; rate: number };
  eveningSessions: { present: number; expected: number; rate: number };
  workLogs: { submitted: number; missing: number; rate: number };
  attendanceExceptions: number;
  targetDate: string;
  targetMonth: string;
  isNonWorkingDay?: boolean;
  holidayName?: string;
  lastSyncTime?: string;
  activeBranchesCount: number;
}

export interface TrendItem {
  date: string;
  shortDate: string;
  attendanceRate: number | null;
  morningRate: number | null;
  eveningRate: number | null;
  morningPresent: number;
  eveningPresent: number;
  totalPresent: number;
  isHoliday?: boolean;
  isWeekend?: boolean;
  holidayName?: string;
}

export interface BranchComparisonItem {
  branchId: string;
  branchName: string;
  code: string;
  employeeCount: number;
  attendanceRate: number;
  presentSessions: number;
  totalSessions: number;
  workLogRate: number;
  status: AttendanceRating;
}

export interface DistributionItem {
  name: string;
  count: number;
  color: string;
}

export interface HeatmapData {
  days: string[];
  rows: Array<{
    employeeId: string;
    employeeName: string;
    designation: string;
    branchName: string;
    days: Record<string, {
      date: string;
      status: 'present' | 'partial' | 'absent' | 'holiday' | 'weekend';
      morning: boolean;
      morningTime?: string | null;
      evening: boolean;
      eveningTime?: string | null;
      holidayName?: string;
    }>;
  }>;
}

export interface NetworkBranchRow {
  branchId: string;
  branchName: string;
  code: string;
  spreadsheetId: string;
  employees: number;
  todayMorning: string;
  todayEvening: string;
  todayRate: number;
  monthlyPresent: number;
  monthlyPossible: number;
  monthlyRate: number;
  workLogs: string;
  status: AttendanceRating;
}

export interface NetworkOverviewData {
  branches: NetworkBranchRow[];
  networkTotal: NetworkBranchRow;
  targetMonth: string;
  targetDate: string;
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

export interface AttendanceRule {
  id: string;
  name: AttendanceRating;
  minPercentage: number;
  maxPercentage: number;
  color: string;
  description: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  branchId?: string | null;
  branchName?: string | null;
}
