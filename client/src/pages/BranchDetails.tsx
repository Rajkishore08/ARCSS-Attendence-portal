import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/Badge';
import { KPICard } from '../components/ui/KPICard';
import { TableSkeleton, ChartSkeleton } from '../components/ui/SkeletonLoader';
import { Building2, Users, Calendar, Percent, FileCheck, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const BranchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedBranchDetailsId, setSelectedBranchDetailsId, selectedMonth, refreshKey, navigateToEmployee, branches } = useApp();

  const effectiveBranchId = id || selectedBranchDetailsId || (branches.length > 0 ? branches[0].id : 'nmc-trichy');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== selectedBranchDetailsId) {
      setSelectedBranchDetailsId(id);
    }
  }, [id]);

  useEffect(() => {
    if (!effectiveBranchId) return;

    let mounted = true;
    setLoading(true);

    api.getBranchById(effectiveBranchId, { month: selectedMonth })
      .then(res => {
        if (!mounted) return;
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load branch details:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [effectiveBranchId, selectedMonth, refreshKey]);

  if (!effectiveBranchId) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Select a Branch</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Choose one of the 4 ARCS branches to view specialized workforce analytics.</p>
        <div className="flex justify-center gap-3">
          {branches.map(b => (
            <button
              key={b.id}
              onClick={() => navigate(`/branches/${b.id}`)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100"
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  const { branch, kpis, employees, dailyTrend } = data;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
              BRANCH CODE: {branch.code}
            </span>
            <StatusBadge status={kpis.status} size="sm" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            {branch.name} — Branch Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Dedicated workforce attendance reporting for {selectedMonth}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {branches.map(b => (
            <button
              key={b.id}
              onClick={() => navigate(`/branches/${b.id}`)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                effectiveBranchId === b.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {b.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Staff Count"
          value={kpis.employeeCount}
          subtitle="Assigned to this location"
          icon={Users}
          iconColor="text-sky-600 bg-sky-50"
        />

        <KPICard
          title="Monthly Attendance"
          value={`${kpis.monthlyRate}%`}
          subtitle={`${kpis.monthlyPresent} / ${kpis.monthlyTotal} sessions`}
          icon={Percent}
          iconColor="text-emerald-600 bg-emerald-50"
          trend={{
            value: `${kpis.monthlyRate}%`,
            isPositive: kpis.monthlyRate >= 75,
          }}
          accentBorder
        />

        <KPICard
          title="Today Morning"
          value={kpis.todayMorning}
          subtitle="Morning session attendance"
          icon={Calendar}
          iconColor="text-amber-600 bg-amber-50"
        />

        <KPICard
          title="Work Logs Submission"
          value={`${kpis.workLogsSubmitted} / ${kpis.employeeCount}`}
          subtitle={`${kpis.workLogRate}% submission rate`}
          icon={FileCheck}
          iconColor="text-teal-600 bg-teal-50"
        />
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-card">
        <h3 className="font-semibold text-base text-slate-900">Branch Attendance Trajectory</h3>
        <p className="text-xs text-slate-500 mt-0.5">Date-wise attendance percentage for this branch</p>

        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="branchRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Attendance Rate']} />
              <Area type="monotone" dataKey="rate" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#branchRateGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-base text-slate-900">Branch Personnel Roster</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {employees.length} Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Reporting Manager</th>
                <th className="py-3 px-4 text-center">Present / Total</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Work Log</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {employees.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div
                      onClick={() => navigateToEmployee(emp.id)}
                      className="hover:text-sky-600 cursor-pointer"
                    >
                      {emp.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">{emp.designation || '—'}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">{emp.reportingTo || '—'}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                    {emp.presentSessions} / {emp.totalSessions}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-sky-700">{emp.attendanceRate}%</td>
                  <td className="py-3 px-4 text-center">
                    {emp.workLink ? (
                      <a
                        href={emp.workLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        <span>Logged</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Missing</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={emp.statusRating} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigateToEmployee(emp.id)}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                    >
                      View Details →
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
