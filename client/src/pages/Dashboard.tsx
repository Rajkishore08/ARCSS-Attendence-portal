import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DashboardKPIs, TrendItem, BranchComparisonItem, DistributionItem, HeatmapData, NetworkOverviewData } from '../types';
import { StatusBadge, SessionBadge } from '../components/ui/Badge';
import { ChartSkeleton } from '../components/ui/SkeletonLoader';
import {
  Users,
  UserCheck,
  Percent,
  Calendar,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Building,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { selectedBranch, selectedMonth, selectedDate, refreshKey, navigateToEmployee, navigateToBranch } = useApp();

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [branchComparison, setBranchComparison] = useState<BranchComparisonItem[]>([]);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [networkOverview, setNetworkOverview] = useState<NetworkOverviewData | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly'>('daily');
  const [activeCellTooltip, setActiveCellTooltip] = useState<{
    empName: string;
    designation: string;
    branchName: string;
    date: string;
    morning: boolean;
    morningTime?: string | null;
    evening: boolean;
    eveningTime?: string | null;
    status: string;
    holidayName?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.getDashboardKPIs({ branch: selectedBranch, month: selectedMonth, date: selectedDate }),
      api.getDashboardCharts({ branch: selectedBranch, month: selectedMonth }),
      api.getNetworkOverview({ month: selectedMonth, date: selectedDate }),
      api.getDailyAttendance({ branch: selectedBranch, date: selectedDate }),
    ])
      .then(([kpiRes, chartsRes, networkRes, dailyRes]) => {
        if (!mounted) return;
        setKpis(kpiRes);
        setTrendData(chartsRes.trendData);
        setBranchComparison(chartsRes.branchComparison);
        setDistribution(chartsRes.distribution);
        setHeatmap(chartsRes.heatmap);
        setNetworkOverview(networkRes);
        setTodayAttendance(dailyRes.records);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBranch, selectedMonth, selectedDate, refreshKey]);

  if (loading && !kpis) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Modern Executive Brand Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 px-3 py-1.5 bg-white rounded-xl shadow-md flex items-center justify-center border border-white/20 flex-shrink-0">
              <img src="/arcs-logo.png" alt="ARCS" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Workforce Operations Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                Attendance Management & Real-Time Sync
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Multi-branch live synchronization across Madurai, NMC Trichy, Vivekanandha & Others • <span className="text-amber-400 font-semibold">{selectedMonth}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {kpis?.isNonWorkingDay ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold">
                <span>🎉</span>
                <span>Non-Working: {kpis.holidayName || 'Weekend'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Active Business Session</span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-200 border border-white/15 text-xs font-mono">
              Target: <strong className="text-amber-300">{selectedDate}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Streamlined Top Essential Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Workforce */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Workforce</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 font-sans">{kpis?.totalEmployees ?? 0}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">Across {kpis?.activeBranchesCount ?? 4} Active Branches</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Today's Presence</span>
            <div className="text-3xl font-extrabold text-emerald-800 mt-1 font-sans">
              {kpis?.presentToday ?? 0} <span className="text-lg font-normal text-slate-400">/ {kpis?.totalEmployees ?? 0}</span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              <strong className="text-emerald-700">{kpis?.presentTodayFull ?? 0} Full</strong> • <strong className="text-amber-700">{kpis?.presentTodayPartial ?? 0} Partial</strong> • <strong className="text-rose-700">{kpis?.absentToday ?? 0} Absent</strong>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Live Sync Engine */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Sync Status</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1 font-sans">4 Branches</div>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {kpis?.lastSyncTime ? `Last sync: ${new Date(kpis.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live Connected to Sheets'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-inner">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 🌟 MOVED UP: EMPLOYEE DAILY ATTENDANCE HEATMAP WITH TIME LOG HOVER TOOLTIP */}
      {heatmap && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Attendance Matrix</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                Employee Daily Attendance Heatmap
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Granular day-by-day session presence across all active personnel • Hover or tap any cell to inspect logged check-in/out timings
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-sm" />
                <span className="font-semibold text-slate-800">Full Day (2/2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 shadow-sm" />
                <span className="font-semibold text-slate-800">Partial (1/2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 shadow-sm" />
                <span className="font-semibold text-slate-800">Absent (0/2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-purple-300 shadow-sm" />
                <span className="font-medium text-purple-900">Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-200 shadow-sm" />
                <span className="text-slate-500">Weekend</span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid with Horizontal Scrolling on Mobile */}
          <div className="overflow-x-auto pb-4 pt-1">
            <div className="min-w-[860px]">
              {/* Day Headers */}
              <div className="flex items-center text-[11px] font-bold text-slate-500 pb-2.5 border-b border-slate-200">
                <div className="w-60 flex-shrink-0 pl-2">Employee / Branch</div>
                <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${heatmap.days.length}, minmax(0, 1fr))` }}>
                  {heatmap.days.map((d, i) => {
                    const dayNum = d.substring(8);
                    const isTarget = d === selectedDate;
                    return (
                      <div
                        key={i}
                        className={`text-center py-1 rounded-md text-[11px] transition-colors ${
                          isTarget ? 'bg-indigo-600 text-white font-extrabold shadow-sm' : 'text-slate-600 font-semibold'
                        }`}
                        title={d}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {heatmap.rows.map(row => (
                  <div key={row.employeeId} className="flex items-center py-2.5 hover:bg-indigo-50/30 transition-colors group">
                    <div
                      onClick={() => navigateToEmployee(row.employeeId)}
                      className="w-60 flex-shrink-0 cursor-pointer pr-3 pl-2"
                    >
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {row.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {row.designation} • <span className="text-indigo-600 font-semibold">{row.branchName}</span>
                      </div>
                    </div>

                    <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${heatmap.days.length}, minmax(0, 1fr))` }}>
                      {heatmap.days.map(day => {
                        const dayData = row.days[day];
                        let bg = 'bg-slate-100';
                        if (dayData?.status === 'present') bg = 'bg-emerald-500 hover:bg-emerald-600 shadow-sm';
                        else if (dayData?.status === 'partial') bg = 'bg-amber-400 hover:bg-amber-500 shadow-sm';
                        else if (dayData?.status === 'absent') bg = 'bg-rose-500 hover:bg-rose-600 shadow-sm';
                        else if (dayData?.status === 'holiday') bg = 'bg-purple-300';
                        else if (dayData?.status === 'weekend') bg = 'bg-slate-200';

                        return (
                          <div
                            key={day}
                            onMouseEnter={() => {
                              setActiveCellTooltip({
                                empName: row.employeeName,
                                designation: row.designation,
                                branchName: row.branchName,
                                date: day,
                                morning: dayData?.morning ?? false,
                                morningTime: dayData?.morningTime,
                                evening: dayData?.evening ?? false,
                                eveningTime: dayData?.eveningTime,
                                status: dayData?.status || 'N/A',
                                holidayName: dayData?.holidayName,
                              });
                            }}
                            className={`h-7 rounded-md cursor-pointer transition-all transform hover:scale-110 ${bg}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Cell Info Card on Hover */}
          {activeCellTooltip && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {activeCellTooltip.empName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{activeCellTooltip.empName}</span>
                    <span className="text-[11px] font-normal text-slate-400">({activeCellTooltip.branchName})</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {activeCellTooltip.designation} • Date: <strong className="text-amber-400">{activeCellTooltip.date}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Morning AM:</span>
                  <span className={activeCellTooltip.morning ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                    {activeCellTooltip.morning ? `✓ ${activeCellTooltip.morningTime || '09:30 AM'}` : '✕ Absent'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Evening PM:</span>
                  <span className={activeCellTooltip.evening ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                    {activeCellTooltip.evening ? `✓ ${activeCellTooltip.eveningTime || '05:30 PM'}` : '✕ Absent'}
                  </span>
                </div>

                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  activeCellTooltip.status === 'present' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  activeCellTooltip.status === 'partial' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  activeCellTooltip.status === 'holiday' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  activeCellTooltip.status === 'weekend' ? 'bg-slate-700 text-slate-300' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {activeCellTooltip.status === 'present' ? 'Full Day Present' :
                   activeCellTooltip.status === 'partial' ? 'Partial (1 Session)' :
                   activeCellTooltip.status === 'holiday' ? (activeCellTooltip.holidayName || 'Holiday') :
                   activeCellTooltip.status === 'weekend' ? 'Weekend' : 'Absent'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Charts: Attendance Trend & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-semibold text-base text-slate-900">Attendance Rate Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Date-wise percentage performance throughout {selectedMonth}</p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  timeframe === 'daily' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  timeframe === 'weekly' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4338ca" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4338ca" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as TrendItem;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-800 space-y-1">
                          <p className="font-semibold text-slate-200">{data.date} {data.holidayName ? `(${data.holidayName})` : ''}</p>
                          <p className="text-amber-400">Attendance: <span className="font-bold">{data.attendanceRate ?? '—'}%</span></p>
                          <p className="text-slate-300">Morning: {data.morningPresent} present ({data.morningRate ?? '—'}%)</p>
                          <p className="text-slate-300">Evening: {data.eveningPresent} present ({data.eveningRate ?? '—'}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="attendanceRate" stroke="#4338ca" strokeWidth={2.5} fillOpacity={1} fill="url(#rateGradient)" name="Attendance Rate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-900">Attendance Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Categorized by configured threshold rules</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Employees`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {distribution.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name.split(' ')[0]}: <strong className="text-slate-900">{item.count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MASTER NETWORK OVERVIEW TABLE */}
      {networkOverview && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-t-2xl">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
                <Building className="w-3.5 h-3.5" />
                Master Network Consolidated View
              </div>
              <h3 className="text-lg font-bold">Consolidated Branch Attendance Table</h3>
              <p className="text-xs text-slate-300 mt-0.5">Dynamic calculation layer replacing the legacy master Google Sheet</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Target Month</span>
              <div className="text-sm font-bold text-amber-400">{networkOverview.targetMonth}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4 text-center">Active Staff</th>
                  <th className="py-3.5 px-4 text-center">Today Morning</th>
                  <th className="py-3.5 px-4 text-center">Today Evening</th>
                  <th className="py-3.5 px-4 text-center">Today Rate</th>
                  <th className="py-3.5 px-4 text-center">Monthly Present / Total</th>
                  <th className="py-3.5 px-4 text-center">Monthly Rate</th>
                  <th className="py-3.5 px-4 text-center">Work Logs</th>
                  <th className="py-3.5 px-4 text-center">Performance Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {networkOverview.branches.map(b => (
                  <tr key={b.branchId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span>{b.branchName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">{b.employees}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-mono text-xs">{b.todayMorning}</td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-mono text-xs">{b.todayEvening}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-900">{b.todayRate}%</td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">{b.monthlyPresent} / {b.monthlyPossible}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-indigo-700">{b.monthlyRate}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-600">{b.workLogs}</td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigateToBranch(b.branchId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                <tr className="bg-slate-900 text-white font-bold text-sm border-t-2 border-slate-700">
                  <td className="py-4 px-4 tracking-wide text-amber-400 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {networkOverview.networkTotal.branchName}
                  </td>
                  <td className="py-4 px-4 text-center">{networkOverview.networkTotal.employees} Staff</td>
                  <td className="py-4 px-4 text-center font-mono text-xs text-slate-200">{networkOverview.networkTotal.todayMorning}</td>
                  <td className="py-4 px-4 text-center font-mono text-xs text-slate-200">{networkOverview.networkTotal.todayEvening}</td>
                  <td className="py-4 px-4 text-center text-emerald-400">{networkOverview.networkTotal.todayRate}%</td>
                  <td className="py-4 px-4 text-center font-mono text-xs text-slate-200">{networkOverview.networkTotal.monthlyPresent} / {networkOverview.networkTotal.monthlyPossible}</td>
                  <td className="py-4 px-4 text-center text-amber-300 text-base">{networkOverview.networkTotal.monthlyRate}%</td>
                  <td className="py-4 px-4 text-center text-xs text-slate-200">{networkOverview.networkTotal.workLogs}</td>
                  <td className="py-4 px-4 text-center">
                    <StatusBadge status={networkOverview.networkTotal.status} size="sm" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-xs text-slate-400 uppercase font-mono">Consolidated</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TODAY'S ATTENDANCE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base text-slate-900">Today's Employee Attendance Roster</h3>
            <p className="text-xs text-slate-500 mt-0.5">Session-level breakdown and logged entry timings for {selectedDate}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {todayAttendance.length} Personnel
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4 text-center">Morning Session</th>
                <th className="py-3 px-4 text-center">Evening Session</th>
                <th className="py-3 px-4 text-center">Today Status</th>
                <th className="py-3 px-4 text-center">Work Log</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {todayAttendance.map(rec => (
                <tr key={rec.employeeId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div
                      onClick={() => navigateToEmployee(rec.employeeId)}
                      className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer"
                    >
                      {rec.employeeName}
                    </div>
                    <div className="text-xs text-slate-500">{rec.designation || 'Staff'}</div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-600">{rec.branchName}</td>
                  <td className="py-3 px-4 text-center">
                    <SessionBadge present={rec.morning} time={rec.morningTime} isHoliday={rec.isHoliday} isWeekend={rec.isWeekend} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <SessionBadge present={rec.evening} time={rec.eveningTime} isHoliday={rec.isHoliday} isWeekend={rec.isWeekend} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {rec.status === 'full' && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Full Day</span>}
                    {rec.status === 'partial' && <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Partial Day</span>}
                    {rec.status === 'absent' && <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">Absent</span>}
                    {rec.status === 'holiday' && <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">Holiday</span>}
                    {rec.status === 'weekend' && <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Weekend</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {rec.workLink ? (
                      <a
                        href={rec.workLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <span>Logged</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Missing</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={rec.rating || 'Review'} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigateToEmployee(rec.employeeId)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
