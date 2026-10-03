import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Employee } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { ChartSkeleton } from '../components/ui/SkeletonLoader';
import {
  Building,
  ExternalLink,
  FileCheck,
  ArrowLeft,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedEmployeeId, setSelectedEmployeeId, selectedMonth, setSelectedMonth, availableMonths, refreshKey } = useApp();

  const effectiveEmpId = id || selectedEmployeeId || 'nmc-trichy_abdul_azees';

  const [data, setData] = useState<{
    employee: Employee;
    summary: any;
    calendar: any[];
    trend: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== selectedEmployeeId) {
      setSelectedEmployeeId(id);
    }
  }, [id]);

  useEffect(() => {
    if (!effectiveEmpId) return;

    let mounted = true;
    setLoading(true);

    api.getEmployeeById(effectiveEmpId, selectedMonth)
      .then(res => {
        if (!mounted) return;
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load employee details:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [effectiveEmpId, selectedMonth, refreshKey]);

  if (!effectiveEmpId) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-900">No Employee Selected</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Please select an employee from the directory to view analytics.</p>
        <button
          onClick={() => navigate('/employees')}
          className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold shadow-sm hover:bg-sky-700"
        >
          Go to Directory
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  const { employee, summary, calendar, trend } = data;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Employees</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Reporting Month:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              const dateObj = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
              const label = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-700 to-sky-500 text-white font-bold text-2xl flex items-center justify-center shadow-md flex-shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 font-sans">{employee.name}</h2>
              <StatusBadge status={summary.statusRating} size="sm" />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                {employee.employeeCode || 'ARCS-EMP'}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{employee.designation || 'Team Member'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-700 font-medium">
                <Building className="w-3.5 h-3.5" />
                {employee.branchName}
              </span>
              <span>•</span>
              <span>Reporting To: <strong className="text-slate-800">{employee.reportingTo || 'Manager'}</strong></span>
            </div>

            {employee.workLink && (
              <div className="mt-2">
                <a
                  href={employee.workLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Work Log Document</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 self-start md:self-auto">
          <div className="text-center">
            <span className="text-[11px] uppercase font-semibold text-slate-400">Attendance Rate</span>
            <div className="text-3xl font-extrabold text-sky-700 font-sans mt-0.5">
              {summary.attendanceRate}%
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {summary.presentSessions} / {summary.totalSessions} Sessions
            </span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Working Days</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.workingDays}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase">Full Days</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.presentDays}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-semibold text-amber-600 uppercase">Partial Days</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summary.partialDays}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-semibold text-rose-600 uppercase">Absent Days</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{summary.absentDays}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-semibold text-sky-600 uppercase">Morning AM</span>
          <div className="text-2xl font-bold text-sky-700 mt-1">{summary.morningSessions}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase">Evening PM</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{summary.eveningSessions}</div>
        </div>
      </div>

      {/* Calendar Matrix */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base text-slate-900">Attendance Calendar Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">Morning (AM) and Evening (PM) check-in indicators</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="text-emerald-600 font-bold">✓</span> Present</span>
            <span className="flex items-center gap-1"><span className="text-rose-600 font-bold">✕</span> Absent</span>
            <span className="flex items-center gap-1"><span className="text-purple-600 font-bold">H</span> Holiday</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {calendar.map(day => {
            const isFull = day.status === 'full';
            const isPartial = day.status === 'partial';
            const isAbsent = day.status === 'absent';
            const isHoliday = day.isHoliday;
            const isWeekend = day.isWeekend;

            let borderStyle = 'border-slate-200 bg-slate-50/50';
            if (isFull) borderStyle = 'border-emerald-200 bg-emerald-50/40';
            else if (isPartial) borderStyle = 'border-amber-200 bg-amber-50/40';
            else if (isAbsent) borderStyle = 'border-rose-200 bg-rose-50/40';
            else if (isHoliday) borderStyle = 'border-purple-200 bg-purple-50/40';

            return (
              <div
                key={day.date}
                className={`p-2.5 rounded-xl border transition-all hover:shadow-md ${borderStyle}`}
                title={`Date: ${day.date}\nMorning: ${day.morning ? `Present (${day.morningTime || '09:30 AM'})` : 'Absent'}\nEvening: ${day.evening ? `Present (${day.eveningTime || '05:30 PM'})` : 'Absent'}\nStatus: ${day.status}`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800">{day.date.substring(8)}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.dayOfWeek]}
                  </span>
                </div>

                {isHoliday ? (
                  <div className="text-[11px] font-bold text-purple-700 py-2 text-center">
                    HOLIDAY
                  </div>
                ) : isWeekend ? (
                  <div className="text-[11px] font-medium text-slate-400 py-2 text-center">
                    Weekend
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                    <div className={`py-1 px-1 rounded text-center ${day.morning ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      <div className="font-bold">AM {day.morning ? '✓' : '✕'}</div>
                      {day.morning && <div className="text-[9px] font-mono text-emerald-700">{day.morningTime || '09:30 AM'}</div>}
                    </div>
                    <div className={`py-1 px-1 rounded text-center ${day.evening ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      <div className="font-bold">PM {day.evening ? '✓' : '✕'}</div>
                      {day.evening && <div className="text-[9px] font-mono text-emerald-700">{day.eveningTime || '05:30 PM'}</div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Trajectory */}
      {trend.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card">
          <h3 className="font-semibold text-base text-slate-900">Historical Attendance Trajectory</h3>
          <p className="text-xs text-slate-500 mt-0.5">Month-over-month performance trends for this employee</p>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip formatter={(value: any) => [`${value}% Attendance`, 'Rate']} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
