import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { DailyAttendance } from './pages/DailyAttendance';
import { MonthlyAttendance } from './pages/MonthlyAttendance';
import { Employees } from './pages/Employees';
import { EmployeeDetails } from './pages/EmployeeDetails';
import { BranchDetails } from './pages/BranchDetails';
import { Reports } from './pages/Reports';
import { SyncManagement } from './pages/SyncManagement';
import { Settings } from './pages/Settings';
import { AttendanceExceptions } from './pages/AttendanceExceptions';
import { WorkLogReport } from './pages/WorkLogReport';

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <Header onToggleMobile={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/daily" element={<Navigate to="/" replace />} />
            <Route path="/daily-record" element={<Navigate to="/" replace />} />
            <Route path="/daily-attendance" element={<Navigate to="/" replace />} />
            <Route path="/monthly" element={<Navigate to="/" replace />} />
            <Route path="/monthly-matrix" element={<Navigate to="/" replace />} />
            <Route path="/monthly-attendance" element={<Navigate to="/" replace />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeDetails />} />
            <Route path="/employee-details" element={<EmployeeDetails />} />
            <Route path="/branches" element={<BranchDetails />} />
            <Route path="/branches/:id" element={<BranchDetails />} />
            <Route path="/branch-details" element={<BranchDetails />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/exceptions" element={<AttendanceExceptions />} />
            <Route path="/worklogs" element={<WorkLogReport />} />
            <Route path="/sync" element={<SyncManagement />} />
            <Route path="/sync-management" element={<SyncManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </BrowserRouter>
  );
}
