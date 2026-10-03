import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import {
  Download,
  Search,
  Building2,
  Calendar,
  Users,
  Percent,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const MonthlyAttendance: React.FC = () => {
  const {
    selectedBranch,
    setSelectedBranch,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    branches,
    refreshKey,
    navigateToEmployee,
  } = useApp();

  const [monthData, setMonthData] = useState<{
    month: string;
    dates: string[];
    employees: any[];
    summary?: {
      totalStaff: number;
      averageRate: number;
      workingDaysInMonth: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    empName: string;
    designation: string;
    branchName: string;
    date: string;
    morning: boolean | null;
    morningTime?: string | null;
    evening: boolean | null;
    eveningTime?: string | null;
    status: string;
    holidayName?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getMonthlyAttendance({
      month: selectedMonth,
      branch: selectedBranch,
      search: search || undefined,
    })
      .then(res => {
        if (!mounted) return;
        setMonthData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load monthly attendance matrix:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBranch, selectedMonth, search, refreshKey]);

  const filteredEmployees = monthData
    ? monthData.employees.filter(emp => {
        if (statusFilter === 'all') return true;
        return emp.statusRating.toLowerCase() === statusFilter.toLowerCase();
      })
    : [];

  const exportMatrix = () => {
    if (!monthData) return;

    const rows = filteredEmployees.map(emp => {
      const rowObj: Record<string, any> = {
        'Employee Code': emp.employeeCode || '—',
        'Employee Name': emp.employeeName,
        'Designation': emp.designation || '—',
        'Branch': emp.branchName,
        'Working Days': emp.workingDays,
        'Present Days': emp.presentDays,
        'Absent Days': emp.absentDays,
        'Present Sessions': emp.presentSessions,
        'Total Sessions': emp.totalSessions,
        'Attendance Rate %': `${emp.attendanceRate}%`,
        'Status': emp.statusRating,
      };

      for (const d of monthData.dates) {
        const dayInfo = emp.days[d];
        const m = dayInfo?.morning === true ? 'P' : dayInfo?.morning === false ? 'A' : '-';
        const e = dayInfo?.evening === true ? 'P' : dayInfo?.evening === false ? 'A' : '-';
        rowObj[d.substring(5)] = `${m}/${e}`;
      }

      return rowObj;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Matrix_${selectedMonth}`);
    XLSX.writeFile(wb, `ARCS_Monthly_Matrix_${selectedMonth}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Workforce Attendance Register</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-sans">
                Monthly Attendance Matrix
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Full calendar month session-by-session overview • <strong className="text-amber-300">{selectedMonth}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month Switcher */}
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="pl-9 pr-8 py-2 text-xs font-semibold bg-slate-800/80 border border-slate-700 rounded-xl text-white shadow-inner hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableMonths.map(m => {
                  const [y, mo] = m.split('-');
                  const dateObj = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
                  const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={exportMatrix}
              disabled={!monthData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-sans">{monthData?.summary?.totalStaff || filteredEmployees.length}</div>
            <span className="text-[11px] text-slate-400">Across active branches</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Monthly Average</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-sans">{monthData?.summary?.averageRate || 0}%</div>
            <span className="text-[11px] text-slate-400">Workforce presence rate</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Working Days</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-sans">{monthData?.summary?.workingDaysInMonth || 0} Days</div>
            <span className="text-[11px] text-slate-400">Excluding weekends/holidays</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Calendar Days</span>
            <div className="text-2xl font-extrabold text-indigo-900 mt-1 font-sans">{monthData?.dates?.length || 0} Dates</div>
            <span className="text-[11px] text-slate-400">Session logs per staff (2x daily)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee, designation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Branch Pill Filter */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedBranch('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedBranch === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Branches
            </button>
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBranch(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedBranch === b.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter & Session Legend */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            {['all', 'Excellent', 'Good', 'Needs Review', 'Review'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
            <span className="font-bold text-emerald-700">P</span> = AM/PM Present •
            <span className="font-bold text-rose-700">A</span> = Absent •
            <span className="font-bold text-purple-700">HOL</span> = Holiday
          </div>
        </div>
      </div>

      {/* Main Monthly Attendance Matrix Table */}
      {loading ? (
        <TableSkeleton rows={10} cols={14} />
      ) : monthData ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm border-b border-slate-200">
                <tr className="text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="sticky-col py-3 px-4 bg-slate-100 min-w-[210px] border-r border-slate-200 shadow-sm">
                    Employee / Branch
                  </th>
                  <th className="py-3 px-2 text-center min-w-[55px]">Present</th>
                  <th className="py-3 px-2 text-center min-w-[55px]">Total</th>
                  <th className="py-3 px-2 text-center min-w-[65px]">Rate</th>
                  <th className="py-3 px-3 text-center min-w-[95px]">Rating</th>

                  {monthData.dates.map(date => {
                    const [y, mo, da] = date.split('-').map(Number);
                    const dObj = new Date(y, mo - 1, da);
                    const dayNum = String(da).padStart(2, '0');
                    const dayName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dObj.getDay()];
                    const isSunday = dObj.getDay() === 0;

                    return (
                      <th
                        key={date}
                        className={`py-2 px-1 text-center min-w-[48px] border-l border-slate-200 ${
                          isSunday ? 'bg-slate-200/80 text-slate-600' : 'bg-slate-100 text-slate-800'
                        }`}
                        title={date}
                      >
                        <div className="font-extrabold text-xs">{dayNum}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{dayName}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredEmployees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-indigo-50/20 transition-colors group">
                    {/* Sticky Employee Name Column */}
                    <td className="sticky-col py-2.5 px-4 bg-white group-hover:bg-indigo-50/30 border-r border-slate-200 shadow-sm transition-colors">
                      <div
                        onClick={() => navigateToEmployee(emp.employeeId)}
                        className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                      >
                        {emp.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {emp.designation || 'Staff'} • <span className="text-indigo-600 font-semibold">{emp.branchName}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">{emp.presentSessions}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-400">{emp.totalSessions}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-indigo-700">{emp.attendanceRate}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={emp.statusRating} size="sm" />
                    </td>

                    {monthData.dates.map(date => {
                      const day = emp.days[date];
                      if (!day) {
                        return <td key={date} className="border-l border-slate-100 text-center text-slate-300">—</td>;
                      }

                      if (day.status === 'future') {
                        return (
                          <td key={date} className="border-l border-slate-100 p-1 text-center bg-slate-50/40 text-slate-300 font-mono text-[10px]" title="Future Date">
                            ·
                          </td>
                        );
                      }

                      if (day.status === 'holiday') {
                        return (
                          <td
                            key={date}
                            onMouseEnter={() => setHoveredCell({
                              empName: emp.employeeName,
                              designation: emp.designation,
                              branchName: emp.branchName,
                              date,
                              morning: null,
                              evening: null,
                              status: 'holiday',
                              holidayName: day.holidayName,
                            })}
                            className="border-l border-slate-100 p-1 text-center bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                          >
                            <span className="font-extrabold text-[10px] text-purple-700">HOL</span>
                          </td>
                        );
                      }

                      if (day.status === 'weekend') {
                        return (
                          <td
                            key={date}
                            onMouseEnter={() => setHoveredCell({
                              empName: emp.employeeName,
                              designation: emp.designation,
                              branchName: emp.branchName,
                              date,
                              morning: null,
                              evening: null,
                              status: 'weekend',
                            })}
                            className="border-l border-slate-100 p-1 text-center bg-slate-100 text-slate-400 font-mono text-[10px] cursor-pointer"
                          >
                            —
                          </td>
                        );
                      }

                      const mPresent = day.morning === true;
                      const ePresent = day.evening === true;

                      return (
                        <td
                          key={date}
                          onMouseEnter={() => setHoveredCell({
                            empName: emp.employeeName,
                            designation: emp.designation,
                            branchName: emp.branchName,
                            date,
                            morning: day.morning,
                            morningTime: day.morningTime,
                            evening: day.evening,
                            eveningTime: day.eveningTime,
                            status: day.status,
                            holidayName: day.holidayName,
                          })}
                          className="border-l border-slate-100 p-1 text-center font-mono text-[10px] cursor-pointer hover:bg-indigo-50/50 transition-colors"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              mPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {mPresent ? 'P' : 'A'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ePresent ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {ePresent ? 'P' : 'A'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Interactive Hover Inspection Panel */}
      {hoveredCell && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              {hoveredCell.empName.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>{hoveredCell.empName}</span>
                <span className="text-xs font-normal text-slate-400">({hoveredCell.branchName})</span>
              </div>
              <div className="text-xs text-slate-300">
                {hoveredCell.designation} • Date: <strong className="text-amber-400">{hoveredCell.date}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hoveredCell.morning !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">AM:</span>
                <span className={hoveredCell.morning ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                  {hoveredCell.morning ? `✓ ${hoveredCell.morningTime || '09:30 AM'}` : '✕ Absent'}
                </span>
              </div>
            )}

            {hoveredCell.evening !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">PM:</span>
                <span className={hoveredCell.evening ? 'text-emerald-400 font-bold' : 'text-rose-400 font-semibold'}>
                  {hoveredCell.evening ? `✓ ${hoveredCell.eveningTime || '05:30 PM'}` : '✕ Absent'}
                </span>
              </div>
            )}

            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              hoveredCell.status === 'full' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              hoveredCell.status === 'partial' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              hoveredCell.status === 'holiday' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              hoveredCell.status === 'weekend' ? 'bg-slate-700 text-slate-300' :
              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {hoveredCell.status === 'full' ? 'Full Day Present' :
               hoveredCell.status === 'partial' ? 'Partial (1 Session)' :
               hoveredCell.status === 'holiday' ? (hoveredCell.holidayName || 'Holiday') :
               hoveredCell.status === 'weekend' ? 'Weekend' : 'Absent'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

