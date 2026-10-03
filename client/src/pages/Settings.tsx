import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { AttendanceRule, Holiday } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import {
  Sliders,
  Calendar,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { branches, refreshKey, refreshData } = useApp();

  const [rules, setRules] = useState<AttendanceRule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [rulesSavedSuccess, setRulesSavedSuccess] = useState(false);

  const [newHolidayDate, setNewHolidayDate] = useState('2026-10-15');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayBranch, setNewHolidayBranch] = useState('');
  const [addingHoliday, setAddingHoliday] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([api.getRules(), api.getHolidays()])
      .then(([rulesRes, holidaysRes]) => {
        if (!mounted) return;
        setRules(rulesRes);
        setHolidays(holidaysRes);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const handleRuleChange = (index: number, field: keyof AttendanceRule, value: any) => {
    const updated = [...rules];
    (updated[index] as any)[field] = value;
    setRules(updated);
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      await api.updateRules(rules);
      setRulesSavedSuccess(true);
      setTimeout(() => setRulesSavedSuccess(false), 3000);
      refreshData();
    } catch (err) {
      console.error('Failed to update rules:', err);
    } finally {
      setSavingRules(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;

    setAddingHoliday(true);
    try {
      await api.addHoliday({
        date: newHolidayDate,
        name: newHolidayName,
        branchId: newHolidayBranch || undefined,
      });
      setNewHolidayName('');
      const updated = await api.getHolidays();
      setHolidays(updated);
      refreshData();
    } catch (err) {
      console.error('Failed to add holiday:', err);
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await api.deleteHoliday(id);
      setHolidays(prev => prev.filter(h => h.id !== id));
      refreshData();
    } catch (err) {
      console.error('Failed to delete holiday:', err);
    }
  };

  if (loading) {
    return <TableSkeleton rows={6} cols={4} />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
          Attendance Rules & Holiday Management
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure performance percentage rating thresholds and branch calendar holidays
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-base text-slate-900">Configurable Status Threshold Engine</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dynamic rules applied to determine whether employee attendance is Excellent, Good, Needs Review, or Review
            </p>
          </div>

          <div className="flex items-center gap-2">
            {rulesSavedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Saved Successfully
              </span>
            )}
            <button
              onClick={handleSaveRules}
              disabled={savingRules}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingRules ? 'Saving Changes...' : 'Save Rules'}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Rating Status</th>
                <th className="py-3 px-4">Min Rate %</th>
                <th className="py-3 px-4">Max Rate %</th>
                <th className="py-3 px-4">Status Description</th>
                <th className="py-3 px-4 text-center">Live Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule, idx) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {rule.name}
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={rule.minPercentage}
                      onChange={e => handleRuleChange(idx, 'minPercentage', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    <span className="ml-1 text-xs text-slate-400">%</span>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={rule.maxPercentage}
                      onChange={e => handleRuleChange(idx, 'maxPercentage', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    <span className="ml-1 text-xs text-slate-400">%</span>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={rule.description}
                      onChange={e => handleRuleChange(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={rule.name} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-base text-slate-900">Company & Branch Holiday Calendar</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Holidays are automatically recognized and excluded from absent calculations (2 sessions expected only on working days)
        </p>

        <form onSubmit={handleAddHoliday} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <input
              type="date"
              value={newHolidayDate}
              onChange={e => setNewHolidayDate(e.target.value)}
              required
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Holiday Name (e.g., Ayudha Puja, Regional Holiday)"
              value={newHolidayName}
              onChange={e => setNewHolidayName(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <select
            value={newHolidayBranch}
            onChange={e => setNewHolidayBranch(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="">Company-Wide (All Branches)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={addingHoliday}
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holiday</span>
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Holiday Name</th>
                <th className="py-2.5 px-4">Scope</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {holidays.map(h => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{h.date}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{h.name}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      {h.branchName || 'All Branches'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Delete holiday"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
