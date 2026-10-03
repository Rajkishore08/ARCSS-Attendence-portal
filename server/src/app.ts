import express from 'express';
import cors from 'cors';
import { config } from './config/index';
import { initDatabase } from './database/db';
import apiRoutes from './routes/api';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Database & seed tables if required
initDatabase();

// Health check endpoint
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
