import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/SkeletonLoader';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  User,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const Reports: React.FC = () => {
  const { selectedBranch, selectedMonth, selectedEmployeeId, availableMonths, refreshKey } = useApp();

  const [reportType, setReportType] = useState<'employee' | 'monthly'>('employee');
  const [empId, setEmpId] = useState(selectedEmployeeId || 'nmc-trichy_abdul_azees');
  const [month, setMonth] = useState(selectedMonth);
  const [employees, setEmployees] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEmployees({ branch: selectedBranch, month })
      .then(res => {
        setEmployees(res);
        if (res.length > 0 && !res.find(e => e.id === empId)) {
          setEmpId(res[0].id);
        }
      })
      .catch(console.error);
  }, [selectedBranch, month, refreshKey]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    if (reportType === 'employee') {
      if (!empId) return;
      api.getEmployeeReport(empId, month)
        .then(res => {
          if (!mounted) return;
          setReportData(res);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load employee report:', err);
          if (mounted) setLoading(false);
        });
    } else {
      api.getMonthlyReport({ month, branch: selectedBranch })
        .then(res => {
          if (!mounted) return;
          setReportData(res);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load monthly report:', err);
          if (mounted) setLoading(false);
        });
    }

    return () => {
      mounted = false;
    };
  }, [reportType, empId, month, selectedBranch, refreshKey]);

  const handlePrint = () => {
    window.print();
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(12, 74, 110);
    doc.text('ARCS ATTENDANCE & WORKFORCE REPORT', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Period: ${month}`, 14, 28);
    doc.line(14, 32, 196, 32);

    if (reportType === 'employee' && reportData.employee) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`Employee: ${reportData.employee.name} (${reportData.employee.employeeCode || 'N/A'})`, 14, 40);
      doc.setFontSize(10);
      doc.text(`Designation: ${reportData.employee.designation} | Branch: ${reportData.employee.branchName}`, 14, 46);
      doc.text(`Reporting To: ${reportData.employee.reportingTo} | Attendance Rate: ${reportData.summary.attendanceRate}%`, 14, 52);

      const tableData = reportData.dailyTable.map((row: any) => [
        row.date,
        row.day,
        row.morning,
        row.evening,
        row.dailyStatus,
        row.workLog,
      ]);

      autoTable(doc, {
        startY: 60,
        head: [['Date', 'Day', 'Morning AM', 'Evening PM', 'Daily Status', 'Work Log']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
      });

      doc.save(`ARCS_Report_${reportData.employee.name}_${month}.pdf`);
    } else if (reportType === 'monthly' && reportData.employees) {
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`Monthly Network Summary: ${month}`, 14, 40);
      doc.setFontSize(10);
      doc.text(`Total Staff: ${reportData.totalEmployees} | Average Attendance: ${reportData.averageAttendanceRate}% | Work Logs: ${reportData.workLogCompletionRate}%`, 14, 46);

      const tableData = reportData.employees.map((row: any) => [
        row.name,
        row.designation,
        row.branchName,
        `${row.presentSessions} / ${row.totalSessions}`,
        `${row.attendanceRate}%`,
        row.statusRating,
        row.workLog,
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Employee', 'Designation', 'Branch', 'Sessions', 'Rate', 'Status', 'Work Log']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [12, 74, 110], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
      });

      doc.save(`ARCS_Monthly_Report_${month}.pdf`);
    }
  };

  const exportExcel = () => {
    if (!reportData) return;

    if (reportType === 'employee') {
      const ws = XLSX.utils.json_to_sheet(reportData.dailyTable);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Attendance');
      XLSX.writeFile(wb, `ARCS_Employee_${reportData.employee.name}_${month}.xlsx`);
    } else {
      const ws = XLSX.utils.json_to_sheet(reportData.employees);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary');
      XLSX.writeFile(wb, `ARCS_Monthly_Summary_${month}.xlsx`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Executive Attendance & Workforce Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Generate, print, and export high-fidelity compliance & payroll-ready reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-subtle hover:shadow transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="no-print bg-white rounded-xl p-5 border border-slate-200/80 shadow-card flex flex-wrap items-center gap-4">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
          <button
            onClick={() => setReportType('employee')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              reportType === 'employee' ? 'bg-white shadow-sm text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Employee Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              reportType === 'monthly' ? 'bg-white shadow-sm text-sky-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Monthly Network Report
          </button>
        </div>

        {reportType === 'employee' && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.branchName})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
          >
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              const dateObj = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
              const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={10} cols={6} />
      ) : reportData ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-8 max-w-5xl mx-auto font-sans">
          <div className="border-b-2 border-slate-900 pb-6 mb-6 flex items-start justify-between">
            <div>
              <div className="text-2xl font-black tracking-wider text-slate-900">ARCS</div>
              <div className="text-xs uppercase tracking-widest text-sky-700 font-bold mt-0.5">
                Attendance Management & Workforce Analytics Portal
              </div>
              <p className="text-xs text-slate-500 mt-1">Automated Multi-Branch Consolidated Attendance System</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div><strong className="text-slate-800">Period:</strong> {month}</div>
              <div><strong className="text-slate-800">Generated:</strong> {new Date().toLocaleDateString()}</div>
              <div className="text-emerald-600 font-semibold mt-1">Status: Verified Official</div>
            </div>
          </div>

          {reportType === 'employee' && reportData.employee ? (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Employee Name</span>
                  <div className="font-bold text-slate-900 text-sm">{reportData.employee.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{reportData.employee.employeeCode}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Designation & Branch</span>
                  <div className="font-semibold text-slate-800">{reportData.employee.designation}</div>
                  <div className="text-sky-700 font-medium">{reportData.employee.branchName}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Reporting Manager</span>
                  <div className="font-semibold text-slate-800">{reportData.employee.reportingTo || 'Manager'}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Attendance Rating</span>
                  <div className="mt-0.5">
                    <StatusBadge status={reportData.summary.statusRating} size="sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">Working Days</span>
                  <div className="text-lg font-bold text-slate-800">{reportData.summary.workingDays}</div>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] uppercase text-emerald-700 font-bold">Present Days</span>
                  <div className="text-lg font-bold text-emerald-800">{reportData.summary.presentDays}</div>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                  <span className="text-[10px] uppercase text-amber-700 font-bold">Partial Days</span>
                  <div className="text-lg font-bold text-amber-800">{reportData.summary.partialDays}</div>
                </div>
                <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg">
                  <span className="text-[10px] uppercase text-rose-700 font-bold">Absent Days</span>
                  <div className="text-lg font-bold text-rose-800">{reportData.summary.absentDays}</div>
                </div>
                <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-lg">
                  <span className="text-[10px] uppercase text-sky-700 font-bold">Present Sessions</span>
                  <div className="text-lg font-bold text-sky-800">{reportData.summary.presentSessions} / {reportData.summary.totalSessions}</div>
                </div>
                <div className="p-3 bg-slate-900 text-white rounded-lg">
                  <span className="text-[10px] uppercase text-sky-300 font-bold">Attendance Rate</span>
                  <div className="text-lg font-bold text-sky-400">{reportData.summary.attendanceRate}%</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Day</th>
                      <th className="py-2.5 px-3">Morning Session (AM)</th>
                      <th className="py-2.5 px-3">Evening Session (PM)</th>
                      <th className="py-2.5 px-3">Daily Attendance</th>
                      <th className="py-2.5 px-3">Work Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.dailyTable.map((row: any) => (
                      <tr key={row.date} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium">{row.date}</td>
                        <td className="py-2 px-3 text-slate-500">{row.day}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded font-medium ${row.morning === 'Present' ? 'bg-emerald-100 text-emerald-800 font-bold' : row.morning === 'Holiday' ? 'bg-purple-100 text-purple-800' : row.morning === 'Weekend' ? 'text-slate-400' : 'bg-rose-100 text-rose-800'}`}>
                            {row.morning}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded font-medium ${row.evening === 'Present' ? 'bg-emerald-100 text-emerald-800 font-bold' : row.evening === 'Holiday' ? 'bg-purple-100 text-purple-800' : row.evening === 'Weekend' ? 'text-slate-400' : 'bg-rose-100 text-rose-800'}`}>
                            {row.evening}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-700">{row.dailyStatus}</td>
                        <td className="py-2 px-3 font-medium text-slate-600">{row.workLog}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-bold">Total Staff</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.totalEmployees}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold">Avg Attendance Rate</span>
                  <div className="text-xl font-bold text-sky-700 mt-1">{reportData.averageAttendanceRate}%</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold">Total Sessions Recorded</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.presentSessions} / {reportData.totalSessions}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold">Work Log Rate</span>
                  <div className="text-xl font-bold text-teal-700 mt-1">{reportData.workLogCompletionRate}%</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Designation</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3 text-center">Sessions</th>
                      <th className="py-2.5 px-3 text-center">Attendance %</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Work Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.employees.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{emp.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{emp.designation}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">{emp.branchName}</td>
                        <td className="py-2.5 px-3 text-center font-mono">{emp.presentSessions} / {emp.totalSessions}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-sky-700">{emp.attendanceRate}%</td>
                        <td className="py-2.5 px-3 text-center">
                          <StatusBadge status={emp.statusRating} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{emp.workLog}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
            <div>
              <p>CONFIDENTIAL — FOR INTERNAL ARCS WORKFORCE MANAGEMENT ONLY</p>
              <p>Synchronized directly from Google Sheets source spreadsheets.</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1" />
              <span>Authorized Signature</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
