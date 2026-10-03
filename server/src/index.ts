import app from './app';
import { config } from './config/index';
import { syncService } from './services/sync/syncService';

const port = process.env.PORT || config.port || 5001;

// Start Express server listening on the port provided by Vercel / environment
app.listen(port, async () => {
  console.log(`🚀 ARCS Attendance Server running on port ${port}`);
  console.log(`📊 Live Google Sheets Mode Active`);

  try {
    console.log('📡 Starting immediate live sync with Google Sheets for all 4 branches...');
    await syncService.syncAll();
    console.log('✅ Initial live sync with Google Sheets completed successfully.');
  } catch (err: any) {
    console.error('Initial live sync error:', err.message);
  }
});

export default app;
export { app };
