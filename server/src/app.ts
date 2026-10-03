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
syncService.initAutoSync();

// Register API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ARCS Attendance Backend',
    timestamp: new Date().toISOString(),
    mode: config.useMockData ? 'mock' : 'live_google_sheets',
  });
});

export default app;
export { app };
