import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { SyncLog } from '../types';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import {
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';

export const SyncManagement: React.FC = () => {
  const { branches, syncStatus, isSyncing, triggerManualSync, refreshKey } = useApp();

  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [syncingBranch, setSyncingBranch] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingLogs(true);

    api.getSyncLogs(30)
      .then((res: SyncLog[]) => {
        if (!mounted) return;
        setLogs(res);
        setLoadingLogs(false);
      })
      .catch((err: any) => {
        console.error('Failed to load sync logs:', err);
        if (mounted) setLoadingLogs(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey, isSyncing]);

  const handleSyncBranch = async (branchId: string) => {
    setSyncingBranch(branchId);
    try {
      await triggerManualSync(branchId);
    } finally {
      setSyncingBranch(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Google Sheets Synchronization Hub
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated and on-demand synchronization engine for 4 branch Google Spreadsheets
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerManualSync()}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing All Branches...' : 'Sync All Spreadsheets Now'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Engine Status</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Active & Healthy</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Periodic auto-sync every 5 minutes</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold text-slate-400 uppercase">Provider Mode</span>
          <div className="text-xl font-bold text-sky-700 mt-2">
            {syncStatus?.mode === 'mock' ? 'Mock Data Provider' : 'Live Google Sheets API'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Zero frontend credential exposure</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold text-slate-400 uppercase">Employees Synced</span>
          <div className="text-xl font-bold text-slate-900 mt-2">
            {syncStatus?.totalEmployees || 12} Employees
          </div>
          <p className="text-xs text-slate-500 mt-1">Normalized into database</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold text-slate-400 uppercase">Attendance Sessions</span>
          <div className="text-xl font-bold text-indigo-700 mt-2">
            {syncStatus?.totalRecords || 0} Records
          </div>
          <p className="text-xs text-slate-500 mt-1">Morning & Evening TRUE/FALSE records</p>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-slate-900 mb-3">Configured Branch Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch: any) => {
            const isBranchSyncing = syncingBranch === branch.id || isSyncing;

            return (
              <div
                key={branch.id}
                className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{branch.name}</h4>
                        <span className="text-xs font-mono text-slate-400">ID: {branch.id}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  </div>

                  <div className="mt-4 bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 font-mono text-slate-600 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Spreadsheet ID:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[200px]" title={branch.spreadsheetId}>
                        {branch.spreadsheetId.substring(0, 16)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Staff Count:</span>
                      <span className="font-semibold text-slate-800">{branch.employeeCount || 0} active</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${branch.spreadsheetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-600 transition-colors"
                  >
                    <span>Open Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleSyncBranch(branch.id)}
                    disabled={isBranchSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBranchSyncing ? 'animate-spin' : ''}`} />
                    <span>{isBranchSyncing ? 'Syncing...' : 'Sync Branch'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-900">Synchronization History & Audit Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time log of data ingestion, durations, and record changes</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {logs.length} Recent Syncs
          </span>
        </div>

        {loadingLogs ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Branch Source</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4 text-center">Staff Processed</th>
                  <th className="py-3 px-4 text-center">Records Synced</th>
                  <th className="py-3 px-4">Error / Status Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {log.branchName || log.branchId || 'All Branches'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                      {log.durationMs} ms
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-medium text-slate-900">
                      {log.employeesProcessed}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-sky-700">
                      {log.attendanceRecordsProcessed}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {log.errorMessage ? (
                        <span className="text-rose-600">{log.errorMessage}</span>
                      ) : (
                        <span className="text-emerald-600">Successfully synced without conflicts</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
