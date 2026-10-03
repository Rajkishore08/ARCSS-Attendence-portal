import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DailyAttendanceRecord } from '../types';
import { StatusBadge, SessionBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import { Calendar, Search, Filter, ExternalLink, Download, UserCheck, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export const DailyAttendance: React.FC = () => {
  const { selectedBranch, selectedDate, setSelectedDate, availableDates, refreshKey, navigateToEmployee } = useApp();

  const [records, setRecords] = useState<DailyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, present: 0, full: 0, partial: 0, absent: 0 });

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getDailyAttendance({
      branch: selectedBranch !== 'all' ? selectedBranch : undefined,
      date: selectedDate || undefined,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    })
      .then(res => {
        if (!mounted) return;
        setRecords(res.records);
        setStats({
          total: res.totalEmployees,
          present: res.presentCount,
          full: res.fullCount,
          partial: res.partialCount,
          absent: res.absentCount,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch daily attendance:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBranch, selectedDate, search, statusFilter, refreshKey]);

  const exportToExcel = () => {
    const exportData = records.map(r => ({
      'Employee Name': r.employeeName,
      'Designation': r.designation || '—',
      'Reporting Manager': r.reportingTo || '—',
      'Branch': r.branchName,
      'Date': r.date,
      'Morning Session': r.morning ? 'Present' : 'Absent',
      'Morning Time': r.morningTime || '—',
      'Evening Session': r.evening ? 'Present' : 'Absent',
      'Evening Time': r.eveningTime || '—',
      'Daily Status': r.status,
      'Work Log Link': r.workLink || 'Missing',
      'Performance Status': r.rating || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Attendance_${selectedDate}`);
    XLSX.writeFile(wb, `ARCS_Daily_Attendance_${selectedDate}.xlsx`);
  };

  const handlePrevDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx !== -1 && idx < availableDates.length - 1) {
      setSelectedDate(availableDates[idx + 1]);
    }
  };

  const handleNextDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx > 0) {
      setSelectedDate(availableDates[idx - 1]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Daily Attendance Roster
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time session records for <span className="font-semibold text-sky-700">{selectedDate}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Quick Date Navigator */}
          <div className="inline-flex items-center rounded-xl bg-white border border-slate-200 shadow-subtle p-0.5 text-xs">
            <button
              onClick={handlePrevDay}
              className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
              title="Previous Logged Day"
            >
              ◀
            </button>

            {availableDates.length > 0 ? (
              <select
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-transparent font-semibold text-slate-800 border-0 focus:outline-none cursor-pointer"
              >
                {availableDates.slice(0, 31).map(d => {
                  const [y, m, day] = d.split('-').map(Number);
                  const dObj = new Date(y, m - 1, day);
                  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dObj.getDay()];
                  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
                  return (
                    <option key={d} value={d}>
                      {monthName} {day}, {y} ({dayName})
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-transparent font-semibold text-slate-800 border-0 focus:outline-none"
              />
            )}

            <button
              onClick={handleNextDay}
              className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
              title="Next Logged Day"
            >
              ▶
            </button>
          </div>

          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-subtle hover:shadow transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-xs text-slate-500 font-medium">Total Active Staff</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-xs text-emerald-600 font-medium">Full Day Present</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.full}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-xs text-amber-600 font-medium">Partial Day (1 Session)</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats.partial}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-xs text-rose-600 font-medium">Absent</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats.absent}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by name, designation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="full">Full Day</option>
            <option value="partial">Partial Day</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Reporting Manager</th>
                  <th className="py-3 px-4 text-center">Morning Session</th>
                  <th className="py-3 px-4 text-center">Evening Session</th>
                  <th className="py-3 px-4 text-center">Daily Status</th>
                  <th className="py-3 px-4 text-center">Work Log Link</th>
                  <th className="py-3 px-4 text-center">Performance Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {records.length > 0 ? (
                  records.map(rec => (
                    <tr key={rec.employeeId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => navigateToEmployee(rec.employeeId)}
                          className="font-medium text-slate-900 hover:text-sky-600 cursor-pointer"
                        >
                          {rec.employeeName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{rec.designation || '—'}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{rec.branchName}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{rec.reportingTo || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <SessionBadge present={rec.morning} time={rec.morningTime} isHoliday={rec.isHoliday} isWeekend={rec.isWeekend} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <SessionBadge present={rec.evening} time={rec.eveningTime} isHoliday={rec.isHoliday} isWeekend={rec.isWeekend} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.status === 'full' && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Full Day</span>}
                        {rec.status === 'partial' && <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Partial Day</span>}
                        {rec.status === 'absent' && <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">Absent</span>}
                        {rec.status === 'holiday' && <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Holiday</span>}
                        {rec.status === 'weekend' && <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Weekend</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {rec.workLink ? (
                          <a
                            href={rec.workLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                          >
                            <span>Work Logged</span>
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
                          className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                      No attendance records found for this criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
