# ARCS — Employee Attendance Management & Analytics Portal

An enterprise-grade, React-based Attendance Management & Workforce Analytics Portal built for **ARCS**.

This system connects to four separate Google Sheets (one for each branch location), normalizes all attendance data into an internal high-performance database, and replaces the legacy master Google Sheet with a modern, interactive analytics portal.

---

## 🌟 Key Architecture & Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                   4 GOOGLE SHEETS SOURCES                   │
│  - Madurai             (1qLgY-eBlt9T24ZqZiW3eEWBeAn5YH...)  │
│  - NMC - Trichy        (15aUhYRFEffhYH9H5M4750hXjFnRZs...)  │
│  - Vivekanandha        (1BZ7LH_nTVotzyxpVymPxzYxU3w5xF...)  │
│  - Others              (1gUb-EcjozvMD_YPvUhcD1fZt757sN...)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS BACKEND                │
│  - Google Sheets API Client / Mock Data Provider             │
│  - Branch-Specific Parser Adapters (Madurai, NMC, Viv, Oth) │
│  - Dynamic Column & Header Discovery (Auto-skip subtotals)   │
│  - 5-Minute Automated & Manual Synchronization Engine       │
│  - Configurable Attendance Threshold Rating Engine          │
│  - SQLite High-Speed Database Layer (WAL Mode + Indexes)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 REACT + TYPESCRIPT + VITE FRONTEND          │
│  - Enterprise Dashboard with Recharts & Framer Motion       │
│  - GitHub-Style Daily Attendance Heatmap                    │
│  - Master Network Consolidated View (Replaces Master Sheet) │
│  - Daily Roster & Full Monthly Attendance Matrix Grid       │
│  - Searchable Employee Directory & Detailed Analytics Profile│
│  - PDF (jsPDF), Excel (xlsx), CSV & Print Report Generators │
│  - Google Sheets Sync Admin Hub & Audit Logs                │
│  - Attendance Rules & Holiday Calendar Manager              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Quick Start
From the project root:
```bash
# Run both Backend Server (port 5001) and Frontend (port 5173) concurrently:
npm run dev
```

- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5001](http://localhost:5001)
- **Health Endpoint**: [http://localhost:5001/health](http://localhost:5001/health)

---

## ⚙️ Environment Configuration

Configuration is managed via `.env` in the `server/` directory:

```env
PORT=5001
DATABASE_URL=arcs_attendance.sqlite
USE_MOCK_DATA=true
SYNC_INTERVAL_MINUTES=5

# Google Service Account Credentials (optional for live production sync)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_PROJECT_ID=

# Branch Spreadsheet IDs
GOOGLE_SHEET_ID_MADURAI=1qLgY-eBlt9T24ZqZiW3eEWBeAn5YH_2_z_vOAgNcFhY
GOOGLE_SHEET_ID_NMC_TRICHY=15aUhYRFEffhYH9H5M4750hXjFnRZsQBUg_iYJTFbqyQ
GOOGLE_SHEET_ID_VIVEKANANDHA=1BZ7LH_nTVotzyxpVymPxzYxU3w5xFtElcVvPMNJ0ivw
GOOGLE_SHEET_ID_OTHERS=1gUb-EcjozvMD_YPvUhcD1fZt757sN7JeHT89Sbtx2vI
```

> **Security Note:** Service account credentials and private keys are never exposed to the frontend. The React client communicates strictly with the normalized Express API.

---

## 📊 Modules & Features

1. **Executive Dashboard**:
   - Live KPI cards (Active Employees, Today's Rate, Monthly Attendance, Morning/Evening Sessions, Work Logs, Exceptions).
   - Recharts Area/Line Attendance Trend (Daily/Weekly toggles).
   - Branch Comparison & Morning vs Evening Session performance charts.
   - Configurable Attendance Status Distribution Donut Chart.
   - **GitHub-style Daily Attendance Heatmap** across all active employees.
   - **Master Network Consolidated View**: Dynamic replacement for the old master Google Sheet.

2. **Daily Attendance Roster**:
   - Real-time date selector, Morning/Evening session status pills, Work Log clickable links, performance rating badge, and instant Excel export.

3. **Monthly Attendance Matrix**:
   - Full calendar month grid with sticky employee column and sticky headers.
   - Day-by-day AM/PM session checkmarks, total sessions, and attendance percentages.

4. **Employee Directory & Detailed Profile**:
   - Filter by branch, role/designation, reporting manager, and performance status.
   - Individual Employee Analytics: KPI cards, Monthly Calendar Matrix, Historical Trajectory chart, and Work Log link.

5. **Executive Reports & Export**:
   - Employee Monthly Report and Monthly Network Consolidated Report.
   - Direct PDF generation via `jsPDF` + `jspdf-autotable`.
   - Excel spreadsheet export via `xlsx`.
   - Print-ready clean layout.

6. **Google Sheets Sync Hub**:
   - Real-time status for all 4 branch spreadsheets.
   - "Sync All" and "Sync Branch" triggers.
   - Complete audit trail with timestamps, durations, and record change logs.

7. **Configurable Status Rules & Holidays**:
   - Dynamic threshold engine (e.g. Excellent >=90%, Good 75-89.99%, Needs Review 60-74.99%, Review <60%).
   - Holiday calendar manager with branch-specific or company-wide scope (excludes holidays/weekends from absent penalty).
