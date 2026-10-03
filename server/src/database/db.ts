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

// Resilient, zero-dependency in-memory relational store optimized for Vercel Serverless & Local Dev
export const db: DatabaseInterface = new MemoryDatabase();

export function initDatabase() {
  console.log('⚡ Relational database initialized with personnel, branches, and attendance matrix.');
}
