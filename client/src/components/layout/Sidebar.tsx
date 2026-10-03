import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileBarChart2,
  RefreshCw,
  Sliders,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { userRole, syncStatus, selectedBranchDetailsId } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      group: 'Overview',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'branch_manager', 'employee'], match: ['/', '/dashboard'] },
      ],
    },
    {
      group: 'Workforce',
      items: [
        { path: '/employees', label: 'All Employees', icon: Users, roles: ['admin', 'hr', 'branch_manager'], match: ['/employees'] },
        { path: `/branches/${selectedBranchDetailsId || 'nmc-trichy'}`, label: 'Branch Analytics', icon: Building2, roles: ['admin', 'hr', 'branch_manager'], match: ['/branches', '/branch-details'] },
      ],
    },
    {
      group: 'Reports & Analytics',
      items: [
        { path: '/reports', label: 'Reports & Export', icon: FileBarChart2, roles: ['admin', 'hr', 'branch_manager', 'employee'], match: ['/reports'] },
        { path: '/exceptions', label: 'Attendance Exceptions', icon: AlertCircle, roles: ['admin', 'hr', 'branch_manager'], match: ['/exceptions'] },
        { path: '/worklogs', label: 'Work Log Tracking', icon: FileSpreadsheet, roles: ['admin', 'hr', 'branch_manager'], match: ['/worklogs'] },
      ],
    },
    {
      group: 'System & Sync',
      items: [
        { path: '/sync', label: 'Google Sheets Sync', icon: RefreshCw, roles: ['admin', 'hr'], match: ['/sync', '/sync-management'] },
        { path: '/settings', label: 'Attendance Rules', icon: Sliders, roles: ['admin'], match: ['/settings'] },
      ],
    },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isItemActive = (matchList: string[]) => {
    const current = location.pathname;
    return matchList.some(m => {
      if (m === '/') return current === '/';
      return current.startsWith(m);
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNav('/')}>
            <div className="h-10 px-2 py-1 bg-white/95 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 border border-slate-700/40">
              <img src="/arcs-logo.png" alt="ARCS Logo" className="h-7 w-auto object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-wide text-white font-sans truncate">ARCS PORTAL</span>
                <span className="text-[10px] text-amber-400 font-medium tracking-tight uppercase truncate">Workforce Sync</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navItems.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <h3 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {group.group}
                  </h3>
                )}
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.match);

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-950/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {isActive && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sync Status Badge in Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          {!collapsed ? (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Sync Engine</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {syncStatus?.mode === 'mock' ? 'Mock Data' : 'Live Sheets'}
                </span>
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                <span>{syncStatus?.totalEmployees || 12} Employees</span>
                <span>4 Branches</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title="Sync Status: Active">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
