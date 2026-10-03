import express from 'express';
import cors from 'cors';
import { config } from './config/index';
import { initDatabase } from './database/db';
import { syncService } from './services/sync/syncService';
import apiRoutes from './routes/api';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Database & seed tables if required
initDatabase();

// Start background auto-sync timer
syncService.initAutoSync();

// Health check endpoints (including root '/' for Vercel service probe)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ARCS Attendance Backend',
    timestamp: new Date().toISOString(),
    mode: config.useMockData ? 'mock' : 'live_google_sheets',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ARCS Attendance Backend',
    timestamp: new Date().toISOString(),
    mode: config.useMockData ? 'mock' : 'live_google_sheets',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ARCS Attendance Backend',
    timestamp: new Date().toISOString(),
    mode: config.useMockData ? 'mock' : 'live_google_sheets',
  });
});

// Auto-sync middleware: ensures Google Sheets data is pulled before responding
app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  try {
    await syncService.ensureSynced();
  } catch (err: any) {
    console.error('Error during on-demand sync:', err);
  }
  next();
});

// Register API Routes on both /api and root (to support direct function invocations and rewrites)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

export default app;
export { app };

// Support direct CommonJS require in Vercel Express service loader
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  (module.exports as any).default = app;
  (module.exports as any).app = app;
}
