import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Employee } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import { Search, Building, Users, Download, RotateCcw, ChevronRight, ExternalLink, Award, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export const Employees: React.FC = () => {
  const { selectedMonth, refreshKey, navigateToEmployee, branches } = useApp();

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [designationFilter, setDesignationFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');

  // Load all employees once for the selected month to establish master filter options
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.getEmployees({
      month: selectedMonth,
    })
      .then(res => {
        if (!mounted) return;
        setAllEmployees(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load employees:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedMonth, refreshKey]);

  // Derive master dropdown options from the complete list
  const availableDesignations = useMemo(() => {
    return Array.from(new Set(allEmployees.map(e => e.designation).filter(Boolean) as string[])).sort();
  }, [allEmployees]);

  const availableManagers = useMemo(() => {
    return Array.from(new Set(allEmployees.map(e => e.reportingTo).filter(Boolean) as string[])).sort();
  }, [allEmployees]);

  // Apply filters client-side for instantaneous, seamless filtering
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      if (branchFilter !== 'all' && emp.branchId !== branchFilter) return false;
      if (designationFilter !== 'all' && emp.designation !== designationFilter) return false;
      if (managerFilter !== 'all' && emp.reportingTo !== managerFilter) return false;
      if (statusFilter !== 'all' && (emp.statusRating || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesCode = (emp.employeeCode || '').toLowerCase().includes(q);
        const matchesDesig = (emp.designation || '').toLowerCase().includes(q);
        const matchesBranch = (emp.branchName || '').toLowerCase().includes(q);
        const matchesMgr = (emp.reportingTo || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesig && !matchesBranch && !matchesMgr) return false;
      }
      return true;
    });
  }, [allEmployees, branchFilter, designationFilter, managerFilter, statusFilter, search]);

  // Key KPI stats computed from all employees
  const stats = useMemo(() => {
    const total = allEmployees.length;
    const excellent = allEmployees.filter(e => (e.statusRating || '').toLowerCase() === 'excellent').length;
    const good = allEmployees.filter(e => (e.statusRating || '').toLowerCase() === 'good').length;
    const review = allEmployees.filter(e => {
      const r = (e.statusRating || '').toLowerCase();
      return r === 'needs review' || r === 'review';
    }).length;
    return { total, excellent, good, review };
  }, [allEmployees]);

  const hasActiveFilters = branchFilter !== 'all' || statusFilter !== 'all' || designationFilter !== 'all' || managerFilter !== 'all' || search.trim().length > 0;

  const resetFilters = () => {
    setBranchFilter('all');
    setStatusFilter('all');
    setDesignationFilter('all');
    setManagerFilter('all');
    setSearch('');
  };

  const exportToExcel = () => {
    const exportData = filteredEmployees.map(e => ({
      'Employee Code': e.employeeCode || '—',
      'Full Name': e.name,
      'Designation': e.designation || '—',
      'Branch': e.branchName || '—',
      'Reporting Manager': e.reportingTo || '—',
      'Present Sessions': e.presentSessions ?? 0,
      'Total Sessions': e.totalSessions ?? 0,
      'Attendance Rate %': `${e.attendanceRate ?? 0}%`,
      'Performance Status': e.statusRating || '—',
      'Work Log Status': e.workLink ? 'Logged' : 'Missing',
      'Work Log URL': e.workLink || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workforce Directory');
    XLSX.writeFile(wb, `ARCS_Employee_Directory_${selectedMonth}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Employee Directory & Workforce Master
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete database of synchronized personnel across all 4 ARCS branches ({selectedMonth})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-subtle hover:shadow transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Directory</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Staff</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 font-medium">Excellent (≥90%)</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.excellent}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs text-sky-600 font-medium">Good Standing (75-89%)</span>
            <div className="text-2xl font-bold text-sky-700 mt-1">{stats.good}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-600 font-medium">Review / Flags (&lt;75%)</span>
            <div className="text-2xl font-bold text-rose-700 mt-1">{stats.review}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-card space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, employee code, designation, manager..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">🏢 All Branches ({allEmployees.length})</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Performance Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">⭐ All Performance Ratings</option>
            <option value="excellent">Excellent (≥90%)</option>
            <option value="good">Good (75-89%)</option>
            <option value="needs review">Needs Review (60-74%)</option>
            <option value="review">Review (&lt;60%)</option>
          </select>

          {/* Designation Filter */}
          <select
            value={designationFilter}
            onChange={e => setDesignationFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">💼 All Roles ({availableDesignations.length})</option>
            {availableDesignations.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Reporting Manager Filter */}
          <select
            value={managerFilter}
            onChange={e => setManagerFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="all">👤 All Managers ({availableManagers.length})</option>
            {availableManagers.map(m => (
              <option key={m} value={m}>
                Mgr: {m}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredEmployees.length}</strong> of{' '}
            <strong className="text-slate-800">{allEmployees.length}</strong> total workforce members
          </span>
        </div>
      </div>

      {/* Employee List Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={8} />
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
                  <th className="py-3 px-4 text-center">Sessions Logged</th>
                  <th className="py-3 px-4 text-center">Attendance Rate</th>
                  <th className="py-3 px-4 text-center">Work Log Link</th>
                  <th className="py-3 px-4 text-center">Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div
                          onClick={() => navigateToEmployee(emp.id)}
                          className="font-semibold text-slate-900 hover:text-sky-600 cursor-pointer flex items-center gap-3"
                        >
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-slate-900 font-bold">{emp.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{emp.employeeCode || 'ARCS-EMP'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">{emp.designation || '—'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200/60">
                          <Building className="w-3 h-3 text-sky-600" />
                          {emp.branchName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{emp.reportingTo || '—'}</td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                        {emp.presentSessions ?? 0} / {emp.totalSessions ?? 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-sky-700">{emp.attendanceRate ?? 0}%</span>
                      </td>
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
                        <StatusBadge status={emp.statusRating || 'Review'} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigateToEmployee(emp.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 hover:bg-sky-50 border border-sky-200 transition-colors"
                        >
                          <span>Analytics</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No personnel found</p>
                      <p className="text-xs text-slate-400 mt-1">No employees match the selected filter criteria.</p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="mt-3 px-3 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100"
                        >
                          Clear Filters
                        </button>
                      )}
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
