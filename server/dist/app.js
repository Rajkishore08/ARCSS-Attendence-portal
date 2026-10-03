"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = require("./config/index");
const db_1 = require("./database/db");
const syncService_1 = require("./services/sync/syncService");
const api_1 = __importDefault(require("./routes/api"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize Database & seed tables if required
(0, db_1.initDatabase)();
// Start background auto-sync timer for long-running servers
if (!process.env.VERCEL) {
    syncService_1.syncService.initAutoSync();
}
// Health check endpoints (including root '/' for Vercel service probe)
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ARCS Attendance Backend',
        timestamp: new Date().toISOString(),
        mode: index_1.config.useMockData ? 'mock' : 'live_google_sheets',
    });
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ARCS Attendance Backend',
        timestamp: new Date().toISOString(),
        mode: index_1.config.useMockData ? 'mock' : 'live_google_sheets',
    });
});
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ARCS Attendance Backend',
        timestamp: new Date().toISOString(),
        mode: index_1.config.useMockData ? 'mock' : 'live_google_sheets',
    });
});
// Auto-sync middleware: ensures Google Sheets data is pulled before responding
app.use(async (req, res, next) => {
    if (req.path === '/' || req.path === '/health' || req.path === '/api/health') {
        return next();
    }
    try {
        await syncService_1.syncService.ensureSynced();
    }
    catch (err) {
        console.error('Error during on-demand sync:', err);
    }
    next();
});
// Register API Routes on both /api and root (to support direct function invocations and rewrites)
app.use('/api', api_1.default);
app.use('/', api_1.default);
// Global error handler
app.use((err, req, res, next) => {
    console.error('Express Error:', err);
    res.status(500).json({
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString(),
    });
});
exports.default = app;
// Support direct CommonJS require in Vercel Express service loader
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
    module.exports.default = app;
    module.exports.app = app;
}
