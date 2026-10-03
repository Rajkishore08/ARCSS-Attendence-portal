import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import { AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react';

export const AttendanceExceptions: React.FC = () => {
  const { selectedBranch, selectedMonth, refreshKey, navigateToEmployee } = useApp();

  const [data, setData] = useState<{ month: string; totalExceptions: number; exceptions: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getAttendanceExceptions({ branch: selectedBranch, month: selectedMonth })
      .then(res => {
        if (!mounted) return;
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load exceptions:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBranch, selectedMonth, refreshKey]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-1 border border-rose-200">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Automated Compliance Monitor</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Attendance Exceptions & Follow-ups
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Personnel requiring management review or with attendance rates below 75% in {selectedMonth}
        </p>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : data ? (
        <div className="space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>{data.totalExceptions} Personnel</strong> currently flagged for attendance review
              </span>
            </div>
            <span className="font-semibold text-rose-700">Threshold: &lt; 75% rate</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Flagged Personnel</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4 text-center">Missing Sessions</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {data.exceptions.length > 0 ? (
                  data.exceptions.map(emp => (
                    <tr key={emp.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div
                          onClick={() => navigateToEmployee(emp.id)}
                          className="hover:text-sky-600 cursor-pointer flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-xs">
                            !
                          </div>
                          <span>{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{emp.designation}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{emp.branchName}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{emp.reportingTo || 'Manager'}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-rose-600">
                        {emp.missingSessions} sessions
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">
                        {emp.attendanceRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={emp.statusRating} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigateToEmployee(emp.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      🎉 No attendance exceptions! All employees meet high attendance thresholds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
