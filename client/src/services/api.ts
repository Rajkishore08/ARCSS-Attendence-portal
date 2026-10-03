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

const API_BASE = '/api';

export const api = {
  // Metadata & Dates
  async getDatesMeta(): Promise<{
    availableMonths: string[];
    latestLoggedDate: string;
    currentMonth: string;
    availableDates: string[];
  }> {
    const res = await fetch(`${API_BASE}/meta/dates`);
    if (!res.ok) throw new Error(`Failed to fetch dates meta: HTTP ${res.status}`);
    return res.json();
  },

  // Dashboard
  async getDashboardKPIs(params?: { branch?: string; month?: string; date?: string }): Promise<DashboardKPIs> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/dashboard?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch dashboard KPIs: HTTP ${res.status}`);
    return res.json();
  },

  async getDashboardCharts(params?: { branch?: string; month?: string; timeframe?: string }): Promise<{
    trendData: TrendItem[];
    branchComparison: BranchComparisonItem[];
    distribution: DistributionItem[];
    heatmap: HeatmapData;
  }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/dashboard/charts?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch dashboard charts: HTTP ${res.status}`);
    return res.json();
  },

  async getNetworkOverview(params?: { month?: string; date?: string }): Promise<NetworkOverviewData> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/dashboard/network?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch network overview: HTTP ${res.status}`);
    return res.json();
  },

  // Employees
  async getEmployees(params?: { branch?: string; designation?: string; reportingTo?: string; status?: string; search?: string; month?: string }): Promise<Employee[]> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/employees?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch employees: HTTP ${res.status}`);
    return res.json();
  },

  async getEmployeeById(id: string, month?: string): Promise<{
    employee: Employee;
    summary: any;
    calendar: any[];
    trend: any[];
  }> {
    const q = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/employees/${id}${q}`);
    if (!res.ok) throw new Error(`Failed to fetch employee ${id}: HTTP ${res.status}`);
    return res.json();
  },

  // Attendance
  async getDailyAttendance(params?: { date?: string; branch?: string; search?: string; status?: string }): Promise<{
    date: string;
    dayInfo: any;
    records: DailyAttendanceRecord[];
    totalEmployees: number;
    presentCount: number;
    fullCount: number;
    partialCount: number;
    absentCount: number;
  }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/attendance/daily?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch daily attendance: HTTP ${res.status}`);
    return res.json();
  },

  async getMonthlyAttendance(params?: { month?: string; branch?: string; search?: string }): Promise<{
    month: string;
    dates: string[];
    employees: any[];
  }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/attendance/monthly?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch monthly attendance: HTTP ${res.status}`);
    return res.json();
  },

  // Branches
  async getBranches(): Promise<Branch[]> {
    const res = await fetch(`${API_BASE}/branches`);
    if (!res.ok) throw new Error(`Failed to fetch branches: HTTP ${res.status}`);
    return res.json();
  },

  async getBranchById(id: string, params?: { month?: string; date?: string }): Promise<{
    branch: Branch;
    kpis: any;
    employees: any[];
    dailyTrend: any[];
  }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/branches/${id}?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch branch ${id}: HTTP ${res.status}`);
    return res.json();
  },

  // Reports
  async getEmployeeReport(id: string, month?: string): Promise<any> {
    const q = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/reports/employee/${id}${q}`);
    if (!res.ok) throw new Error(`Failed to fetch employee report: HTTP ${res.status}`);
    return res.json();
  },

  async getMonthlyReport(params?: { month?: string; branch?: string; reportingTo?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/reports/monthly?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch monthly report: HTTP ${res.status}`);
    return res.json();
  },

  async getAttendanceExceptions(params?: { month?: string; branch?: string }): Promise<{
    month: string;
    totalExceptions: number;
    exceptions: any[];
  }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/reports/exceptions?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch attendance exceptions: HTTP ${res.status}`);
    return res.json();
  },

  async getWorkLogReport(params?: { branch?: string }): Promise<{
    totalEmployees: number;
    loggedCount: number;
    missingCount: number;
    completionRate: number;
    submittedEmployees: any[];
    missingEmployees: any[];
  }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/reports/worklogs?${q}`);
    if (!res.ok) throw new Error(`Failed to fetch work log report: HTTP ${res.status}`);
    return res.json();
  },

  // Sync
  async getSyncStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/sync/status`);
    if (!res.ok) throw new Error(`Failed to fetch sync status: HTTP ${res.status}`);
    return res.json();
  },

  async triggerSyncAll(): Promise<any> {
    const res = await fetch(`${API_BASE}/sync`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to trigger sync: HTTP ${res.status}`);
    return res.json();
  },

  async triggerSyncBranch(branchId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sync/${branchId}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to trigger sync for ${branchId}: HTTP ${res.status}`);
    return res.json();
  },

  async getSyncLogs(limit = 50): Promise<SyncLog[]> {
    const res = await fetch(`${API_BASE}/sync/logs?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch sync logs: HTTP ${res.status}`);
    return res.json();
  },

  // Rules & Settings
  async getRules(): Promise<AttendanceRule[]> {
    const res = await fetch(`${API_BASE}/rules`);
    if (!res.ok) throw new Error(`Failed to fetch rules: HTTP ${res.status}`);
    return res.json();
  },

  async updateRules(rules: AttendanceRule[]): Promise<AttendanceRule[]> {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules }),
    });
    if (!res.ok) throw new Error(`Failed to update rules: HTTP ${res.status}`);
    return res.json();
  },

  async getHolidays(): Promise<Holiday[]> {
    const res = await fetch(`${API_BASE}/holidays`);
    if (!res.ok) throw new Error(`Failed to fetch holidays: HTTP ${res.status}`);
    return res.json();
  },

  async addHoliday(holiday: { date: string; name: string; branchId?: string }): Promise<Holiday> {
    const res = await fetch(`${API_BASE}/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(holiday),
    });
    if (!res.ok) throw new Error(`Failed to add holiday: HTTP ${res.status}`);
    return res.json();
  },

  async deleteHoliday(id: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/holidays/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete holiday: HTTP ${res.status}`);
    return res.json();
  },
};
