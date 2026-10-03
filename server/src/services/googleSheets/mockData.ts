// Realistic raw sheet mock data representations for each of the 4 ARCS branches.
// Each branch simulates the actual Google Sheet 2D array structure with headers, sub-headers,
// employee rows, subtotal rows, and TRUE/FALSE cells.

export interface SheetRowData {
  branchId: string;
  spreadsheetId: string;
  values: (string | boolean | number)[][];
}

export function generateRealisticRawSheet(branchId: string, spreadsheetId: string): SheetRowData {
  // Generate dates for September and October 2026
  const dateList: string[] = [];
  // September 1 to 30, 2026
  for (let d = 1; d <= 30; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    dateList.push(`2026-09-${dayStr}`);
  }
  // October 1 to 15, 2026
  for (let d = 1; d <= 15; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    dateList.push(`2026-10-${dayStr}`);
  }

  // Branch employee definitions
  const branchEmployees: Record<string, Array<{ code: string; name: string; designation: string; reportingTo: string; workLink: string; attendanceBias: number }>> = {
    'madurai': [
      { code: 'ARCS-MDU-001', name: 'Meenakshi Sundaram', designation: 'Branch Coordinator', reportingTo: 'SasiKumar', workLink: 'https://docs.google.com/document/d/1_madurai_worklog/edit', attendanceBias: 0.94 },
    ],
    'nmc-trichy': [
      { code: 'ARCS-NMC-001', name: 'Abdul Azees', designation: 'Regional Manager', reportingTo: 'SasiKumar', workLink: 'https://docs.google.com/document/d/1_abdul_work_log_arcs/edit', attendanceBias: 0.88 },
      { code: 'ARCS-NMC-002', name: 'Kavitha S', designation: 'Operations Lead', reportingTo: 'Abdul Azees', workLink: 'https://docs.google.com/document/d/1_kavitha_worklog/edit', attendanceBias: 0.96 },
      { code: 'ARCS-NMC-003', name: 'Rajesh Kannan', designation: 'Senior Analyst', reportingTo: 'Abdul Azees', workLink: 'https://docs.google.com/document/d/1_rajesh_worklog/edit', attendanceBias: 0.82 },
    ],
    'vivekanandha': [
      { code: 'ARCS-VIV-001', name: 'Priya Mohan', designation: 'Academic Coordinator', reportingTo: 'SasiKumar', workLink: 'https://docs.google.com/document/d/1_priya_worklog/edit', attendanceBias: 0.95 },
      { code: 'ARCS-VIV-002', name: 'Suresh Babu', designation: 'Technical Trainer', reportingTo: 'Priya Mohan', workLink: 'https://docs.google.com/document/d/1_suresh_worklog/edit', attendanceBias: 0.91 },
      { code: 'ARCS-VIV-003', name: 'Anitha R', designation: 'Lab Instructor', reportingTo: 'Priya Mohan', workLink: 'https://docs.google.com/document/d/1_anitha_worklog/edit', attendanceBias: 0.72 },
      { code: 'ARCS-VIV-004', name: 'Karthik Velu', designation: 'Project Specialist', reportingTo: 'Priya Mohan', workLink: 'https://docs.google.com/document/d/1_karthik_worklog/edit', attendanceBias: 0.86 },
      { code: 'ARCS-VIV-005', name: 'Deepa Natarajan', designation: 'Support Engineer', reportingTo: 'Suresh Babu', workLink: '', attendanceBias: 0.58 },
      { code: 'ARCS-VIV-006', name: 'Vignesh Pandian', designation: 'QA Associate', reportingTo: 'Suresh Babu', workLink: 'https://docs.google.com/document/d/1_vignesh_worklog/edit', attendanceBias: 0.89 },
    ],
    'others': [
      { code: 'ARCS-OTH-001', name: 'Arvind Ramachandran', designation: 'Remote Consultant', reportingTo: 'SasiKumar', workLink: 'https://docs.google.com/document/d/1_arvind_worklog/edit', attendanceBias: 0.92 },
      { code: 'ARCS-OTH-002', name: 'Divya Prakash', designation: 'Field Operations Officer', reportingTo: 'SasiKumar', workLink: '', attendanceBias: 0.68 },
    ],
  };

  const employees = branchEmployees[branchId] || [];

  // Build Sheet Matrix
  const rows: (string | boolean | number)[][] = [];

  // Row 1: Title Header (Metadata row)
  rows.push(['ARCS ATTENDANCE SHEET', '', '', '', '', `BRANCH: ${branchId.toUpperCase()}`]);

  // Row 2: Date Header Row
  const dateHeaderRow: (string | boolean | number)[] = ['S.No', 'Employee Code', 'Employee Name', 'Designation', 'Reporting To', 'Link for Works Done'];
  for (const date of dateList) {
    const isHoliday = date === '2026-09-04' || date === '2026-10-02';
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let dateLabel = date;
    if (isHoliday) dateLabel += ' [Holiday]';
    else if (isWeekend) dateLabel += ' (Weekend)';

    dateHeaderRow.push(dateLabel);
    dateHeaderRow.push(''); // Span 2 columns for Morning and Evening
  }
  rows.push(dateHeaderRow);

  // Row 3: Sub-header Row: AM / PM (Morning / Evening)
  const sessionHeaderRow: (string | boolean | number)[] = ['', '', '', '', '', ''];
  for (let i = 0; i < dateList.length; i++) {
    sessionHeaderRow.push('Morning');
    sessionHeaderRow.push('Evening');
  }
  rows.push(sessionHeaderRow);

  // Employee Rows
  let sno = 1;
  for (const emp of employees) {
    const empRow: (string | boolean | number)[] = [
      sno++,
      emp.code,
      emp.name,
      emp.designation,
      emp.reportingTo,
      emp.workLink,
    ];

    // Seed deterministic pseudo-random attendance based on employee and date
    for (let di = 0; di < dateList.length; di++) {
      const date = dateList[di];
      const isHoliday = date === '2026-09-04' || date === '2026-10-02';
      const dayOfWeek = new Date(date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isHoliday || isWeekend) {
        empRow.push(false);
        empRow.push(false);
        continue;
      }

      // Generate deterministic attendance boolean
      const hashM = Math.sin(di * 17 + sno * 31) * 10000;
      const randM = hashM - Math.floor(hashM);
      const isMorningPresent = randM < emp.attendanceBias;

      const hashE = Math.cos(di * 23 + sno * 47) * 10000;
      const randE = hashE - Math.floor(hashE);
      const isEveningPresent = randE < (emp.attendanceBias - (isMorningPresent ? 0.04 : 0.2));

      empRow.push(isMorningPresent);
      empRow.push(isEveningPresent);
    }

    rows.push(empRow);
  }

  // Add Empty Row to test parser resilience
  rows.push([]);

  // Add Subtotal Row to test that parser DOES NOT treat it as employee
  const subtotalRow: (string | boolean | number)[] = [
    '',
    '',
    `Subtotal — ${branchId.toUpperCase()}`,
    'TOTAL ACTIVE: ' + employees.length,
    '',
    '',
  ];
  rows.push(subtotalRow);

  // Add Grand Total Row
  const grandTotalRow: (string | boolean | number)[] = [
    '',
    '',
    'MASTER NETWORK GRAND TOTAL',
    'ALL BRANCHES SUMMARY',
    '',
    '',
  ];
  rows.push(grandTotalRow);

  return {
    branchId,
    spreadsheetId,
    values: rows,
  };
}
