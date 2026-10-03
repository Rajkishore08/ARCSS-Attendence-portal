import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Employee, UserRole } from '../../types';
import {
  Search,
  Building2,
  Calendar,
  RefreshCw,
  User,
  Shield,
  Menu,
  Check,
  ChevronDown,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobile }) => {
  const {
    selectedBranch,
    setSelectedBranch,
    selectedMonth,
    setSelectedMonth,
    selectedDate,
    setSelectedDate,
    availableMonths,
    userRole,
    setUserRole,
    branches,
    isSyncing,
    triggerManualSync,
    navigateToEmployee,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced employee search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const emps = await api.getEmployees({ search: searchQuery });
        setSearchResults(emps.slice(0, 6));
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 shadow-subtle">
      {/* Left: Mobile Menu & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleMobile}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employees, designation, manager..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 py-1 max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/70 border-b border-slate-100">
                Matching Employees ({searchResults.length})
              </div>
              {searchResults.length > 0 ? (
                searchResults.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      navigateToEmployee(emp.id);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-indigo-50/70 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-slate-900 truncate">{emp.name}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {emp.designation || 'Staff'} • <span className="text-indigo-600 font-medium">{emp.branchName}</span>
                      </div>
                    </div>
                    <div className="text-right ml-3 flex flex-col items-end">
                      <span className="text-xs font-semibold text-slate-700">{emp.attendanceRate || 0}%</span>
                      <span className="text-[10px] text-slate-400">{emp.reportingTo ? `Mgr: ${emp.reportingTo}` : ''}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                  No matching employees found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Branch, Date/Month, Sync Now, Role Switcher */}
      <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
        {/* Branch Selector */}
        <div className="relative hidden sm:flex items-center">
          <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none transition-all"
          >
            <option value="all">All Branches (4)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Month Selector */}
        <div className="relative flex items-center">
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="pl-8 pr-7 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none transition-all"
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
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
        </div>

        {/* Sync Now Button */}
        <button
          onClick={() => triggerManualSync()}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-semibold shadow-subtle hover:shadow transition-all disabled:opacity-50"
          title="Synchronize data from all 4 Google Sheets"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        {/* Role Switcher */}
        <div className="relative flex items-center border-l border-slate-200 pl-2 lg:pl-3">
          <select
            value={userRole}
            onChange={e => setUserRole(e.target.value as UserRole)}
            className="pl-2 pr-6 py-1.5 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl text-slate-800 hover:bg-slate-200/70 focus:outline-none cursor-pointer appearance-none transition-all"
            title="Switch demo user role"
          >
            <option value="admin">👑 Admin</option>
            <option value="hr">👥 HR Manager</option>
            <option value="branch_manager">🏢 Branch Lead</option>
            <option value="employee">👤 Employee</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
        </div>
      </div>
    </header>
  );
};
