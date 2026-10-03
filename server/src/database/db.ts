import path from 'path';
import fs from 'fs';
import { config } from '../config/index';
import { MemoryDatabase } from './memoryStore';

export interface DatabaseInterface {
  prepare(sql: string): {
    all(...args: any[]): any[];
    get(...args: any[]): any;
    run(...args: any[]): { changes: number; lastInsertRowid: number | bigint };
  };
  exec(sql: string): void;
  pragma(sql: string): any;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
}

let databaseInstance: DatabaseInterface;

// Try to load native better-sqlite3 if available in local environment,
// otherwise seamlessly fall back to high-performance zero-dependency in-memory relational store for Vercel Serverless
try {
  if (process.env.VERCEL !== '1') {
    const BetterSqlite3 = require('better-sqlite3');
    const dbPath = path.isAbsolute(config.databaseUrl)
      ? config.databaseUrl
      : path.resolve(process.cwd(), config.databaseUrl);

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const nativeDb = new BetterSqlite3(dbPath);
    try {
      nativeDb.pragma('journal_mode = WAL');
      nativeDb.pragma('foreign_keys = ON');
    } catch {}

    databaseInstance = nativeDb;
    console.log(`📦 Database loaded via native SQLite file: ${dbPath}`);
  } else {
    databaseInstance = new MemoryDatabase();
    console.log('⚡ Database loaded via MemoryDatabase (Serverless Optimized)');
  }
} catch (err: any) {
  console.warn(`⚠️ Better-sqlite3 native driver not available (${err.message}). Using resilient memory database.`);
  databaseInstance = new MemoryDatabase();
}

export const db = databaseInstance;

export function initDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        spreadsheet_id TEXT NOT NULL,
        sheet_name TEXT,
        color TEXT DEFAULT '#0284c7',
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        employee_code TEXT,
        name TEXT NOT NULL,
        designation TEXT,
        reporting_to TEXT,
        branch_id TEXT NOT NULL,
        work_link TEXT,
        active INTEGER DEFAULT 1,
        avatar_url TEXT,
        email TEXT,
        phone TEXT,
        joined_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        date TEXT NOT NULL,
        session TEXT NOT NULL,
        present INTEGER NOT NULL DEFAULT 0,
        entry_time TEXT,
        source_spreadsheet_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        UNIQUE(employee_id, date, session)
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        branch_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attendance_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        min_percentage REAL NOT NULL,
        max_percentage REAL NOT NULL,
        color TEXT NOT NULL,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        branch_id TEXT,
        status TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        employees_processed INTEGER NOT NULL DEFAULT 0,
        attendance_records_processed INTEGER NOT NULL DEFAULT 0,
        records_added INTEGER NOT NULL DEFAULT 0,
        records_updated INTEGER NOT NULL DEFAULT 0,
        records_removed INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        FOREIGN KEY(branch_id) REFERENCES branches(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
      CREATE INDEX IF NOT EXISTS idx_employees_reporting ON employees(reporting_to);
      CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_branch_date ON attendance_records(branch_id, date);
      CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
      CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp DESC);
    `);

    try {
      db.exec('ALTER TABLE attendance_records ADD COLUMN entry_time TEXT');
    } catch {}

    const insertBranch = db.prepare(`
      INSERT OR IGNORE INTO branches (id, name, code, spreadsheet_id, sheet_name, color, active)
      VALUES (@id, @name, @code, @spreadsheetId, @sheetName, @color, 1)
    `);

    const branchTransaction = db.transaction((branches: typeof config.branches) => {
      for (const b of branches) {
        insertBranch.run(b);
      }
    });
    branchTransaction(config.branches);

    const countRules = db.prepare('SELECT COUNT(*) as count FROM attendance_rules').get() as { count: number };
    if (!countRules || countRules.count === 0) {
      const insertRule = db.prepare(`
        INSERT INTO attendance_rules (id, name, min_percentage, max_percentage, color, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const defaultRules = [
        { id: 'rule_excellent', name: 'Excellent', min: 90.0, max: 100.0, color: '#10b981', desc: 'Outstanding consistency and participation' },
        { id: 'rule_good', name: 'Good', min: 75.0, max: 89.99, color: '#0284c7', desc: 'Meets high attendance expectations' },
        { id: 'rule_needs_review', name: 'Needs Review', min: 60.0, max: 74.99, color: '#f59e0b', desc: 'Requires attention or follow-up' },
        { id: 'rule_review', name: 'Review', min: 0.0, max: 59.99, color: '#ef4444', desc: 'Critical low attendance' },
      ];

      const ruleTx = db.transaction(() => {
        for (const r of defaultRules) {
          insertRule.run(r.id, r.name, r.min, r.max, r.color, r.desc);
        }
      });
      ruleTx();
    }

    const countHolidays = db.prepare('SELECT COUNT(*) as count FROM holidays').get() as { count: number };
    if (!countHolidays || countHolidays.count === 0) {
      const insertHoliday = db.prepare(`
        INSERT INTO holidays (id, date, name, branch_id)
        VALUES (?, ?, ?, ?)
      `);

      const defaultHolidays = [
        { id: 'h_2026_09_04', date: '2026-09-04', name: 'Branch Holiday / Special Leave', branchId: null },
        { id: 'h_2026_10_02', date: '2026-10-02', name: 'Gandhi Jayanti', branchId: null },
        { id: 'h_2026_10_20', date: '2026-10-20', name: 'Ayudha Puja / Vijayadasami', branchId: null },
        { id: 'h_2026_11_08', date: '2026-11-08', name: 'Deepavali', branchId: null },
      ];

      const holTx = db.transaction(() => {
        for (const h of defaultHolidays) {
          insertHoliday.run(h.id, h.date, h.name, h.branchId);
        }
      });
      holTx();
    }
  } catch (err: any) {
    console.error('Error during initDatabase:', err.message);
  }
}
