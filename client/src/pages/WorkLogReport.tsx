import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import { FileCheck, FileX, ExternalLink, Percent } from 'lucide-react';

export const WorkLogReport: React.FC = () => {
  const { selectedBranch, refreshKey, navigateToEmployee } = useApp();

  const [data, setData] = useState<{
    totalEmployees: number;
    loggedCount: number;
    missingCount: number;
    completionRate: number;
    submittedEmployees: any[];
    missingEmployees: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'submitted' | 'missing'>('submitted');

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getWorkLogReport({ branch: selectedBranch })
      .then(res => {
        if (!mounted) return;
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load work log report:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedBranch, refreshKey]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Work Log & Task Submission Tracking
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Monitoring "Link for Works Done" submission status across all personnel
        </p>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Submission Rate</span>
                <div className="text-2xl font-bold text-teal-700 mt-1">{data.completionRate}%</div>
                <span className="text-xs text-slate-500">{data.loggedCount} of {data.totalEmployees} submitted</span>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
                <Percent className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase">Logs Submitted</span>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{data.loggedCount}</div>
                <span className="text-xs text-slate-500">Live work links verified</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-600 uppercase">Missing Work Links</span>
                <div className="text-2xl font-bold text-rose-700 mt-1">{data.missingCount}</div>
                <span className="text-xs text-slate-500">Pending submissions</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                <FileX className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setTab('submitted')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === 'submitted'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Submitted Logs ({data.submittedEmployees.length})
            </button>
            <button
              onClick={() => setTab('missing')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === 'missing'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Missing Logs ({data.missingEmployees.length})
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Work Link Submission</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {(tab === 'submitted' ? data.submittedEmployees : data.missingEmployees).map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div
                        onClick={() => navigateToEmployee(emp.id)}
                        className="hover:text-sky-600 cursor-pointer"
                      >
                        {emp.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{emp.designation}</td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600">{emp.branchName}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{emp.reportingTo || 'Manager'}</td>
                    <td className="py-3 px-4">
                      {emp.workLink ? (
                        <a
                          href={emp.workLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="truncate max-w-xs">{emp.workLink}</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <FileX className="w-3.5 h-3.5" />
                          Missing Link
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigateToEmployee(emp.id)}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                      >
                        View Profile →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
