"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDatabase = initDatabase;
const memoryStore_1 = require("./memoryStore");
// Resilient, zero-dependency in-memory relational store optimized for Vercel Serverless & Local Dev
exports.db = new memoryStore_1.MemoryDatabase();
function initDatabase() {
    console.log('⚡ Relational database initialized with personnel, branches, and attendance matrix.');
}
