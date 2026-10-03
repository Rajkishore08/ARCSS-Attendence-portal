"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./database/db");
const results = db_1.db.prepare(`
  SELECT ar.date, 
         COUNT(*) as total_records,
         SUM(CASE WHEN ar.present = 1 THEN 1 ELSE 0 END) as present_count,
         SUM(CASE WHEN ar.session = 'morning' AND ar.present = 1 THEN 1 ELSE 0 END) as morning_present,
         SUM(CASE WHEN ar.session = 'evening' AND ar.present = 1 THEN 1 ELSE 0 END) as evening_present
  FROM attendance_records ar
  GROUP BY ar.date
  ORDER BY ar.date ASC
`).all();
console.log('--- ALL ATTENDANCE DATE COUNTS IN DB ---');
console.table(results);
const empAttendance = db_1.db.prepare(`
  SELECT e.name, e.branch_id, 
         COUNT(ar.id) as total_sessions,
         SUM(CASE WHEN ar.present = 1 THEN 1 ELSE 0 END) as present_sessions
  FROM employees e
  LEFT JOIN attendance_records ar ON e.id = ar.employee_id
  GROUP BY e.id
`).all();
console.log('\n--- ATTENDANCE PER EMPLOYEE ---');
console.table(empAttendance);
