import { db } from '../../database/db';
import { AttendanceRating, AttendanceRule, DailyStatus, DailyAttendance, EmployeeMonthlySummary } from '../../types/index';

export class AttendanceEngine {
  getRules(): AttendanceRule[] {
    const rows = db.prepare('SELECT id, name, min_percentage as minPercentage, max_percentage as maxPercentage, color, description FROM attendance_rules ORDER BY min_percentage DESC').all() as AttendanceRule[];
    return rows;
  }

  getRating(rate: number): AttendanceRating {
    const rules = this.getRules();
    for (const rule of rules) {
      if (rate >= rule.minPercentage) {
        return rule.name;
      }
    }
    return 'Review';
  }

  isNonWorkingDay(dateStr: string, branchId?: string): { isHoliday: boolean; isWeekend: boolean; holidayName?: string } {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay();
    // In ARCS attendance sheets, Sunday is non-working weekend. Saturday is normal working.
    const isWeekend = dayOfWeek === 0;

    let query = 'SELECT name FROM holidays WHERE date = ? AND (branch_id IS NULL OR branch_id = ?)';
    const holiday = db.prepare(query).get(dateStr, branchId || '') as { name: string } | undefined;

    return {
      isHoliday: !!holiday,
      isWeekend,
      holidayName: holiday?.name,
    };
  }

  calculateDailyAttendance(
    employee: { id: string; name: string; designation?: string; reporting_to?: string; branch_id: string; branch_name?: string; work_link?: string },
    dateStr: string,
    morningRecord?: { present: number; entry_time?: string | null },
    eveningRecord?: { present: number; entry_time?: string | null }
  ): DailyAttendance {
    const dayInfo = this.isNonWorkingDay(dateStr, employee.branch_id);
    const morning = morningRecord ? morningRecord.present === 1 : null;
    const evening = eveningRecord ? eveningRecord.present === 1 : null;

    const morningTime = morning ? (morningRecord?.entry_time || '09:30 AM') : null;
    const eveningTime = evening ? (eveningRecord?.entry_time || '05:30 PM') : null;

    let totalPresent = 0;
    if (morning === true) totalPresent += 1;
    if (evening === true) totalPresent += 1;

    let status: DailyStatus = 'absent';
    let totalPossible = 2;

    if (totalPresent === 2) {
      status = 'full';
    } else if (totalPresent === 1) {
      status = 'partial';
    } else if (dayInfo.isHoliday) {
      status = 'holiday';
      totalPossible = 0;
    } else if (dayInfo.isWeekend) {
      status = 'weekend';
      totalPossible = 0;
    } else {
      status = 'absent';
    }

    const attendanceRate = totalPossible > 0 ? (totalPresent / totalPossible) * 100 : (dayInfo.isHoliday || dayInfo.isWeekend ? 100 : 0);

    const [y, m, dayNum] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, dayNum);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      designation: employee.designation,
      reportingTo: employee.reporting_to,
      branchId: employee.branch_id,
      branchName: employee.branch_name || employee.branch_id,
      workLink: employee.work_link,
      date: dateStr,
      dayName: dayNames[dateObj.getDay()],
      morning,
      morningTime,
      evening,
      eveningTime,
      totalPresentSessions: totalPresent,
      totalPossibleSessions: totalPossible,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      status,
      rating: totalPossible > 0 ? this.getRating(attendanceRate) : undefined,
      isHoliday: dayInfo.isHoliday,
      isWeekend: dayInfo.isWeekend,
      holidayName: dayInfo.holidayName,
    };
  }
}

export const attendanceEngine = new AttendanceEngine();
